import { ethers } from "ethers";
import { CONTRACT_ABI } from "@/config/contract";

export interface Certificate {
  tokenId: number;
  name: string;
  readingScore: number;
  listeningScore: number;
  issueDate: number;
  expirationDate: number;
  nationalID: string;
  cidCertificate: string;
  owner: string;
  isValid: boolean;
}

class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor() {
    if (!process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL) {
      throw new Error("NEXT_PUBLIC_SEPOLIA_RPC_URL is not configured");
    }
    if (!process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
      throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not configured");
    }

    this.provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL
    );
    this.contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
      CONTRACT_ABI,
      this.provider
    );
  }

  async getCertificateDetails(tokenId: number): Promise<Certificate> {
    try {
      const certificate = await this.contract.getCertificateDetails(tokenId);
      const isValid = await this.contract.isCertificateValid(tokenId);
      return {
        tokenId: Number(certificate.tokenId),
        name: certificate.name,
        readingScore: Number(certificate.readingScore),
        listeningScore: Number(certificate.listeningScore),
        issueDate: Number(certificate.issueDate),
        expirationDate: Number(certificate.expirationDate),
        nationalID: certificate.nationalID,
        cidCertificate: certificate.cidCertificate,
        owner: certificate.owner,
        isValid,
      };
    } catch (error) {
      console.error("Error getting certificate details:", error);
      throw error;
    }
  }

  async getCertificatesByNationalId(
    nationalId: string
  ): Promise<Certificate[]> {
    try {
      const tokenIds = await this.contract.getAllTokens();
      const certificates: Certificate[] = [];

      for (const tokenId of tokenIds) {
        try {
          const certificate = await this.contract.getCertificateDetails(
            tokenId
          );
          const isValid = await this.contract.isCertificateValid(tokenId);
          if (certificate.nationalID === nationalId) {
            certificates.push({
              tokenId: Number(certificate.tokenId),
              name: certificate.name,
              readingScore: Number(certificate.readingScore),
              listeningScore: Number(certificate.listeningScore),
              issueDate: Number(certificate.issueDate),
              expirationDate: Number(certificate.expirationDate),
              nationalID: certificate.nationalID,
              cidCertificate: certificate.cidCertificate,
              owner: certificate.owner,
              isValid,
            });
          }
        } catch (error) {
          // Skip invalid token IDs
          continue;
        }
      }

      return certificates;
    } catch (error) {
      console.error("Error getting certificates by national ID:", error);
      throw error;
    }
  }

  async isCertificateValid(tokenId: number): Promise<boolean> {
    try {
      return await this.contract.isCertificateValid(tokenId);
    } catch (error) {
      console.error("Error in isCertificateValid:", error);
      throw new Error(
        `Failed to check certificate validity: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

export const blockchainService = new BlockchainService();
