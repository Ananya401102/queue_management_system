
import express from "express";
import db from "../database/db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// Create a new queue
router.post("/", (req, res) => {
  try {
    const { name } = req.body;
    const manager_id = req.manager.id;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Queue name is required"
      });
    }

    const manager = db.prepare(
      "SELECT id FROM managers WHERE id = ?"
    ).get(manager_id);

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Manager not found"
      });
    }

    const result = db.prepare(`
      INSERT INTO queues (name, manager_id)
      VALUES (?, ?)
    `).run(name.trim(), manager_id);

    res.status(201).json({
      success: true,
      message: "Queue created successfully",
      queueId: result.lastInsertRowid
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create queue"
    });
  }
});

// Get all queues for logged-in manager
router.get("/", (req, res) => {
  try {
    const queues = db.prepare(`
      SELECT * FROM queues
      WHERE manager_id = ?
      ORDER BY created_at DESC
    `).all(req.manager.id);

    res.status(200).json({
      success: true,
      queues
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch queues"
    });
  }
});

export default router;

