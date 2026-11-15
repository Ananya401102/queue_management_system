
import express from "express";
import bcrypt from "bcryptjs";
import db from "../database/db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Manager Registration
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const existingManager = db.prepare(
      "SELECT id FROM managers WHERE email = ?"
    ).get(email);

    if (existingManager) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = db.prepare(`
      INSERT INTO managers (name, email, password)
      VALUES (?, ?, ?)
    `).run(name, email, hashedPassword);

    res.status(201).json({
      success: true,
      message: "Manager registered successfully",
      managerId: result.lastInsertRowid
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
});

// Manager Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const manager = db.prepare(
      "SELECT * FROM managers WHERE email = ?"
    ).get(email);

    if (!manager) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      manager.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
  {
    id: manager.id,
    email: manager.email
  },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

res.status(200).json({
  success: true,
  message: "Login successful",
  token,
  manager: {
    id: manager.id,
    name: manager.name,
    email: manager.email
  }
});

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
});

export default router;
