import { ethers } from "ethers";
import puppeteer from "puppeteer";
import { getCertificateHTML } from "../utils/certificateTemplate.js";
import { uploadBufferToIPFS } from "./ipfs.js";
import { CONTRACT_ABI } from "../config/contract.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      CONTRACT_ABI,
      this.wallet
    );
  }

  // Hàm retry với delay
  async retry(fn, retries = 3, delay = 1000) {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;

      // Kiểm tra nếu là lỗi rate limit
      if (error.message && error.message.includes("Too Many Requests")) {
        console.log(
          `Rate limited, retrying in ${delay}ms... (${retries} retries left)`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.retry(fn, retries - 1, delay * 2); // Tăng delay gấp đôi mỗi lần retry
      }

      throw error;
    }
  }

  async getAllCertificates(page = 1, limit = 10, filters = {}) {
    try {
      // Sử dụng retry cho các blockchain calls
      const tokenIds = await this.retry(() => this.contract.getAllTokens());
      const totalSupply = tokenIds.length;

      // Apply filters if any
      let filteredTokenIds = tokenIds;
      if (filters.owner) {
        filteredTokenIds = await Promise.all(
          tokenIds.map(async (tokenId) => {
            const owner = await this.retry(() =>
              this.contract.ownerOf(tokenId)
            );
            return owner.toLowerCase() === filters.owner.toLowerCase()
              ? tokenId
              : null;
          })
        );
        filteredTokenIds = filteredTokenIds.filter((id) => id !== null);
      }

      // Calculate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTokenIds = filteredTokenIds.slice(startIndex, endIndex);

      // Chia nhỏ requests để tránh rate limit
      const certificates = [];
      for (const tokenId of paginatedTokenIds) {
        try {
          const [
            name,
            readingScore,
            listeningScore,
            issueDate,
            expirationDate,
            nationalID,
            cidCertificate,
          ] = await this.retry(() =>
            this.contract.getCertificateDetails(tokenId)
          );

          const owner = await this.retry(() => this.contract.ownerOf(tokenId));
          const isValid = await this.retry(() =>
            this.contract.isCertificateValid(tokenId)
          );

          certificates.push({
            tokenId: Number(tokenId),
            name,
            readingScore: Number(readingScore),
            listeningScore: Number(listeningScore),
            issueDate: new Date(Number(issueDate) * 1000).toISOString(),
            expirationDate: new Date(
              Number(expirationDate) * 1000
            ).toISOString(),
            nationalID,
            cidCertificate,
            owner,
            isValid,
          });
        } catch (error) {
          console.error(
            `Error fetching certificate ${tokenId}:`,
            error.message
          );
          continue;
        }
      }

      return {
        totalSupply,
        totalPages: Math.ceil(filteredTokenIds.length / limit),
        currentPage: page,
        certificates: certificates.sort((a, b) => b.tokenId - a.tokenId),
      };
    } catch (error) {
      console.error("Error in getAllCertificates:", error);
      throw new Error(`Failed to get certificates: ${error.message}`);
    }
  }

  async getCertificateDetails(tokenId) {
    try {
      const [
        name,
        readingScore,
        listeningScore,
        issueDate,
        expirationDate,
        nationalID,
        cidCertificate,
      ] = await this.retry(() => this.contract.getCertificateDetails(tokenId));

      const owner = await this.retry(() => this.contract.ownerOf(tokenId));
      const isValid = await this.retry(() =>
        this.contract.isCertificateValid(tokenId)
      );

      return {
        tokenId: Number(tokenId),
        name,
        readingScore: Number(readingScore),
        listeningScore: Number(listeningScore),
        issueDate: new Date(Number(issueDate) * 1000).toISOString(),
        expirationDate: new Date(Number(expirationDate) * 1000).toISOString(),
        nationalID,
        cidCertificate,
        owner,
        isValid,
      };
    } catch (error) {
      console.error("Error in getCertificateDetails:", error);
      throw new Error(`Failed to get certificate details: ${error.message}`);
    }
  }

  async isCertificateValid(tokenId) {
    try {
      const isValid = await this.retry(() =>
        this.contract.isCertificateValid(tokenId)
      );
      return isValid;
    } catch (error) {
      console.error("Error in isCertificateValid:", error);
      throw new Error(`Failed to check certificate validity: ${error.message}`);
    }
  }

  async mintCertificate(
    name,
    readingScore,
    listeningScore,
    issueDate,
    expirationDate,
    nationalID
  ) {
    try {
      // Generate certificate image
      const html = getCertificateHTML({
        name,
        readingScore,
        listeningScore,
        issueDate,
        expirationDate,
        nationalID,
      });

      const browser = await puppeteer.launch({
        headless: "new",
      });
      const page = await browser.newPage();

      // Set viewport to match certificate dimensions exactly
      await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 2,
      });

      await page.setContent(html);

      // Wait for fonts to load
      await page.evaluateHandle("document.fonts.ready");

      // Take screenshot with exact dimensions
      const screenshot = await page.screenshot({
        type: "png",
        clip: {
          x: 0,
          y: 0,
          width: 1200,
          height: 800,
        },
      });

      await browser.close();

      // Ensure uploads directory exists
      const uploadsDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Upload to IPFS
      const { cid, url } = await uploadBufferToIPFS(screenshot, `image.png`);

      // Mint NFT
      const tx = await this.contract.mintCertificate(
        process.env.OWNER_WALLET,
        name,
        readingScore,
        listeningScore,
        issueDate,
        expirationDate,
        nationalID,
        cid
      );

      const receipt = await tx.wait();

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        cid,
        url,
      };
    } catch (error) {
      console.error("Error minting certificate:", error);
      throw error;
    }
  }
}

export const mintCertificate = async (params) => {
  const service = new BlockchainService();
  return service.mintCertificate(
    params.name,
    params.readingScore,
    params.listeningScore,
    params.issueDate,
    params.expirationDate,
    params.nationalID,
    params.cidCertificate
  );
};

export default new BlockchainService();
