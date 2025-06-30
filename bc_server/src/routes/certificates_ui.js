import express from "express";
import puppeteer from "puppeteer";
import { getCertificateHTML } from "../utils/certificateTemplate.js";

const router = express.Router();

// API preview chứng chỉ (trả về HTML để xem trước)
router.post("/preview", async (req, res) => {
  try {
    const html = getCertificateHTML(req.body);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi tạo xem trước",
      error: error.message,
    });
  }
});

// API tạo chứng chỉ và trả về PDF
router.post("/pdf", async (req, res) => {
  try {
    const html = getCertificateHTML(req.body);
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "0.5cm", right: "0.5cm", bottom: "0.5cm", left: "0.5cm" },
    });
    await browser.close();

    const sanitizedFilename = (req.body.candidateName || "certificate")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="TOEIC_Certificate_${sanitizedFilename}.pdf"`
    );
    res.send(pdf);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi tạo file PDF",
      error: error.message,
    });
  }
});

// API tạo chứng chỉ và trả về hình ảnh PNG
router.post("/image", async (req, res) => {
  try {
    const html = getCertificateHTML(req.body);
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1123, height: 794 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    const screenshot = await page.screenshot({
      type: "png",
      fullPage: true,
      omitBackground: true,
    });
    await browser.close();

    const sanitizedFilename = (req.body.candidateName || "certificate")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="TOEIC_Certificate_${sanitizedFilename}.png"`
    );
    res.send(screenshot);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi tạo hình ảnh",
      error: error.message,
    });
  }
});

router.get("/:certificateId", async (req, res) => {
  try {
    const { certificateId } = req.params;
    const html = getCertificateHTML({
      studentName: "Test Student",
      studentId: "12345",
      score: "850",
      testDate: "2024-03-15",
      certificateId,
      certificateType: "TOEIC",
    });

    res.send(html);
  } catch (error) {
    console.error("Error generating certificate UI:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
