import express from "express";
import { mintCertificate } from "../services/blockchain.js";
import blockchainService from "../services/blockchain.js";

const router = express.Router();

// Get all certificates with pagination and filtering
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      owner: req.query.owner,
    };

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        error:
          "Invalid pagination parameters. Page and limit must be positive numbers.",
      });
    }

    const result = await blockchainService.getAllCertificates(
      page,
      limit,
      filters
    );
    res.json(result);
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({
      error: "Failed to fetch certificates",
      details: error.message,
    });
  }
});

// Get certificate by token ID
router.get("/:tokenId", async (req, res) => {
  try {
    const { tokenId } = req.params;

    if (!tokenId || isNaN(parseInt(tokenId))) {
      return res.status(400).json({
        error: "Invalid token ID. Must be a valid number.",
      });
    }

    const certificate = await blockchainService.getCertificateDetails(tokenId);

    if (!certificate) {
      return res.status(404).json({
        error: "Certificate not found",
      });
    }

    res.json(certificate);
  } catch (error) {
    console.error(`Error fetching certificate ${req.params.tokenId}:`, error);

    if (error.message.includes("Token does not exist")) {
      return res.status(404).json({
        error: "Certificate not found",
      });
    }

    res.status(500).json({
      error: "Failed to fetch certificate details",
      details: error.message,
    });
  }
});

// Check certificate validity
router.get("/:tokenId/valid", async (req, res) => {
  try {
    const { tokenId } = req.params;

    if (!tokenId || isNaN(parseInt(tokenId))) {
      return res.status(400).json({
        error: "Invalid token ID. Must be a valid number.",
      });
    }

    const isValid = await blockchainService.isCertificateValid(tokenId);
    res.json({
      tokenId: parseInt(tokenId),
      isValid,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      `Error checking certificate validity ${req.params.tokenId}:`,
      error
    );

    if (error.message.includes("Token does not exist")) {
      return res.status(404).json({
        error: "Certificate not found",
      });
    }

    res.status(500).json({
      error: "Failed to check certificate validity",
      details: error.message,
    });
  }
});

// Mint new certificate
router.post("/mint", async (req, res) => {
  try {
    const {
      name,
      readingScore,
      listeningScore,
      issueDate,
      expirationDate,
      nationalID,
    } = req.body;

    if (
      !name ||
      !readingScore ||
      !listeningScore ||
      !issueDate ||
      !expirationDate ||
      !nationalID
    ) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    const result = await mintCertificate({
      to: process.env.OWNER_WALLET,
      name,
      readingScore,
      listeningScore,
      issueDate,
      expirationDate,
      nationalID,
      cidCertificate: "", // This will be set after IPFS upload
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
