import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import puppeteer from "puppeteer";
import dotenv from "dotenv";
import certificatesRouter from "./routes/certificates.js";
import certificatesUIRouter from "./routes/certificates_ui.js";
import { getCertificateHTML } from "./utils/certificateTemplate.js";

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
// allow all origins
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use("/api/certificates", certificatesRouter);
app.use("/api/certificate", certificatesUIRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
