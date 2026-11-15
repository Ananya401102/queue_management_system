
import express from "express";
import db from "../database/db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

// Check whether a queue belongs to the logged-in manager
const getOwnedQueue = (queueId, managerId) => {
  return db.prepare(`
    SELECT id FROM queues
    WHERE id = ? AND manager_id = ?
  `).get(queueId, managerId);
};

// Check whether a token belongs to the logged-in manager
const getOwnedToken = (tokenId, managerId) => {
  return db.prepare(`
    SELECT tokens.*
    FROM tokens
    JOIN queues ON tokens.queue_id = queues.id
    WHERE tokens.id = ? AND queues.manager_id = ?
  `).get(tokenId, managerId);
};

// Add a person and generate a token
router.post("/queue/:queueId", (req, res) => {
  try {
    const { person_name } = req.body;
    const queueId = req.params.queueId;

    if (!person_name || !person_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Person name is required"
      });
    }

    if (!getOwnedQueue(queueId, req.manager.id)) {
      return res.status(404).json({
        success: false,
        message: "Queue not found"
      });
    }

    const count = db.prepare(`
      SELECT COUNT(*) AS total FROM tokens WHERE queue_id = ?
    `).get(queueId).total;

    const tokenNumber = `T${String(count + 1).padStart(3, "0")}`;

    const position = db.prepare(`
      SELECT COALESCE(MAX(position), 0) + 1 AS nextPosition
      FROM tokens
      WHERE queue_id = ? AND status = 'WAITING'
    `).get(queueId).nextPosition;

    const result = db.prepare(`
      INSERT INTO tokens (token_number, person_name, queue_id, position)
      VALUES (?, ?, ?, ?)
    `).run(tokenNumber, person_name.trim(), queueId, position);

    res.status(201).json({
      success: true,
      message: "Token generated successfully",
      token: {
        id: result.lastInsertRowid,
        token_number: tokenNumber,
        person_name: person_name.trim(),
        position
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate token"
    });
  }
});

// Get all tokens in a queue
router.get("/queue/:queueId", (req, res) => {
  try {
    const queueId = req.params.queueId;

    if (!getOwnedQueue(queueId, req.manager.id)) {
      return res.status(404).json({
        success: false,
        message: "Queue not found"
      });
    }

    const tokens = db.prepare(`
      SELECT * FROM tokens
      WHERE queue_id = ?
      ORDER BY
        CASE WHEN status = 'WAITING' THEN 0 ELSE 1 END,
        position ASC,
        id ASC
    `).all(queueId);

    res.json({ success: true, tokens });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tokens"
    });
  }
});

// Call the next waiting person
router.post("/queue/:queueId/call-next", (req, res) => {
  try {
    const queueId = req.params.queueId;

    if (!getOwnedQueue(queueId, req.manager.id)) {
      return res.status(404).json({
        success: false,
        message: "Queue not found"
      });
    }

    const currentlyServing = db.prepare(`
      SELECT id FROM tokens
      WHERE queue_id = ? AND status = 'SERVING'
    `).get(queueId);

    if (currentlyServing) {
      return res.status(409).json({
        success: false,
        message: "Complete the currently serving token first"
      });
    }

    const nextToken = db.prepare(`
      SELECT * FROM tokens
      WHERE queue_id = ? AND status = 'WAITING'
      ORDER BY position ASC, id ASC
      LIMIT 1
    `).get(queueId);

    if (!nextToken) {
      return res.status(404).json({
        success: false,
        message: "No waiting tokens"
      });
    }

    db.prepare(`
      UPDATE tokens
      SET status = 'SERVING', called_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nextToken.id);

    res.json({
      success: true,
      message: "Next token called successfully",
      token: { ...nextToken, status: "SERVING" }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to call next token"
    });
  }
});

// Move a waiting token up or down
router.patch("/:tokenId/move", (req, res) => {
  try {
    const { direction } = req.body;

    if (!["up", "down"].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: "Direction must be up or down"
      });
    }

    const token = getOwnedToken(req.params.tokenId, req.manager.id);

    if (!token || token.status !== "WAITING") {
      return res.status(404).json({
        success: false,
        message: "Waiting token not found"
      });
    }

    const comparison = direction === "up" ? "<" : ">";

    const neighbour = db.prepare(`
      SELECT * FROM tokens
      WHERE queue_id = ?
      AND status = 'WAITING'
      AND position ${comparison} ?
      ORDER BY position ${direction === "up" ? "DESC" : "ASC"}
      LIMIT 1
    `).get(token.queue_id, token.position);

    if (!neighbour) {
      return res.status(400).json({
        success: false,
        message: "Token cannot move further"
      });
    }

    const swap = db.transaction(() => {
      db.prepare(
        "UPDATE tokens SET position = ? WHERE id = ?"
      ).run(neighbour.position, token.id);

      db.prepare(
        "UPDATE tokens SET position = ? WHERE id = ?"
      ).run(token.position, neighbour.id);
    });

    swap();

    res.json({
      success: true,
      message: "Token position updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to move token"
    });
  }
});

// Cancel a waiting token
router.patch("/:tokenId/cancel", (req, res) => {
  try {
    const token = getOwnedToken(req.params.tokenId, req.manager.id);

    if (!token || token.status !== "WAITING") {
      return res.status(404).json({
        success: false,
        message: "Waiting token not found"
      });
    }

    db.prepare(`
      UPDATE tokens
      SET status = 'CANCELLED',
          cancelled_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(token.id);

    res.json({
      success: true,
      message: "Token cancelled successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel token"
    });
  }
});

// Complete a serving token
router.patch("/:tokenId/complete", (req, res) => {
  try {
    const token = getOwnedToken(req.params.tokenId, req.manager.id);

    if (!token) {
      return res.status(404).json({
        success: false,
        message: "Token not found"
      });
    }

    if (token.status !== "SERVING") {
      return res.status(400).json({
        success: false,
        message: "Only serving tokens can be completed"
      });
    }

    db.prepare(`
      UPDATE tokens
      SET status = 'COMPLETED',
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(token.id);

    res.json({
      success: true,
      message: "Token completed successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to complete token"
    });
  }
});

export default router;
