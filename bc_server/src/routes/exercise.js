const express = require("express");
const router = express.Router();

// Định nghĩa câu trả lời đúng
const correctAnswers = [2, 1, 1]; // Tương ứng với các câu hỏi trong frontend

router.post("/score", (req, res) => {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: "Invalid answers format" });
    }

    // Tính điểm
    let score = 0;
    answers.forEach((answer, index) => {
      if (answer === correctAnswers[index]) {
        score++;
      }
    });

    res.json({ score });
  } catch (error) {
    console.error("Error calculating score:", error);
    res.status(500).json({ error: "Failed to calculate score" });
  }
});

module.exports = router;
