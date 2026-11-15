
import express from "express";
import db from "../database/db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// Get dashboard statistics for a queue
router.get("/queue/:queueId", (req, res) => {
  try {
    const { queueId } = req.params;
    const managerId = req.manager.id;

    // Verify queue ownership
    const queue = db.prepare(`
      SELECT id, name
      FROM queues
      WHERE id = ? AND manager_id = ?
    `).get(queueId, managerId);

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: "Queue not found"
      });
    }

    // Token counts
    const stats = db.prepare(`
      SELECT
        COUNT(*) AS totalTokens,
        SUM(CASE WHEN status = 'WAITING' THEN 1 ELSE 0 END) AS waitingTokens,
        SUM(CASE WHEN status = 'SERVING' THEN 1 ELSE 0 END) AS servingTokens,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completedTokens,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelledTokens
      FROM tokens
      WHERE queue_id = ?
    `).get(queueId);

    // Average waiting time in minutes
    const waitingTime = db.prepare(`
      SELECT
        ROUND(
          AVG((julianday(called_at) - julianday(created_at)) * 1440),
          1
        ) AS averageWaitMinutes
      FROM tokens
      WHERE queue_id = ?
      AND called_at IS NOT NULL
    `).get(queueId);

    // Daily token creation trend for the last 7 days
    const dailyTokenTrend = db.prepare(`
      SELECT
        date(created_at) AS date,
        COUNT(*) AS totalTokens
      FROM tokens
      WHERE queue_id = ?
      AND created_at >= datetime('now', '-6 days')
      GROUP BY date(created_at)
      ORDER BY date(created_at) ASC
    `).all(queueId);

    res.status(200).json({
      success: true,
      queue: queue.name,
      analytics: {
        ...stats,
        averageWaitMinutes: waitingTime.averageWaitMinutes || 0,
        currentQueueLength: stats.waitingTokens || 0
      },
      dailyTokenTrend
    });

  } catch (error) {
    console.error("Analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics"
    });
  }
});

export default router;
