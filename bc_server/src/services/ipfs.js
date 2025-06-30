import { create } from "@web3-storage/w3up-client";
import { filesFromPaths } from "files-from-path";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config();

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hàm tạo client web3.storage
async function makeStorageClient() {
  const client = await create();
  console.log("Client created");

  // Kiểm tra và setup lần đầu
  const spaces = client.spaces();
  let currentSpace;

  if (!spaces.length) {
    console.log("First time setup...");
    // Đăng nhập với email
    await client.authorize("hauhpll123@gmail.com");
    console.log("Authorized with email");

    // Tạo space
    currentSpace = await client.createSpace("certificate-space");
    console.log("Space created:", currentSpace.did());
  } else {
    // Sử dụng space đầu tiên nếu đã có
    currentSpace = spaces[0];
    console.log("Using existing space:", currentSpace.did());
  }

  // Luôn set current space
  await client.setCurrentSpace(currentSpace.did());
  console.log("Current space set");

  return client;
}

/**
 * Upload buffer data to IPFS using Web3.Storage
 * @param {Buffer} data - The data to upload
 * @param {string} filename - Name of the file
 * @returns {Promise<{cid: string, url: string}>} - The IPFS CID and URL
 */
async function uploadBufferToIPFS(data, filename = "certificate.png") {
  try {
    // Tạo file tạm thời
    const tempPath = path.join(process.cwd(), "uploads", filename);
    fs.writeFileSync(tempPath, data);

    // Upload file
    const files = await filesFromPaths([tempPath]);
    const client = await makeStorageClient();
    const root = await client.uploadDirectory(files);

    // Xóa file tạm
    fs.unlinkSync(tempPath);

    return {
      cid: root.toString(),
      url: `https://${root}.ipfs.w3s.link/${filename}`,
    };
  } catch (error) {
    console.error("Error uploading to Web3.Storage:", error);
    throw new Error(`Failed to upload to Web3.Storage: ${error.message}`);
  }
}

/**
 * Upload file to IPFS using Web3.Storage
 * @param {string} filePath - Path to the file
 * @returns {Promise<{cid: string, url: string}>} - The IPFS CID and URL
 */
async function uploadFileToIPFS(filePath) {
  try {
    const files = await filesFromPaths([filePath]);
    const client = await makeStorageClient();
    const root = await client.uploadDirectory(files);

    return {
      cid: root.toString(),
      url: `https://${root}.ipfs.w3s.link/${path.basename(filePath)}`,
    };
  } catch (error) {
    console.error("Error uploading to Web3.Storage:", error);
    throw new Error(`Failed to upload to Web3.Storage: ${error.message}`);
  }
}

export { uploadBufferToIPFS, uploadFileToIPFS };
