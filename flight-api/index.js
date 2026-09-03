import express from "express";
import pool from "./db/connection.js";

const app = express();

const PORT = process.env.PORT || 3001;

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      status: "ok"
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      status: "error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Flight API running on port ${PORT}`);
});