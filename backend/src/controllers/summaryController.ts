import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { query } from '../config/db';

/**
 * GET /api/summary
 * Returns calculated totals: totalLent, totalRepaid, overdueAmount, outstandingAmount
 */
export const getSummary = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized user' });
      return;
    }

    const result = await query(
      `SELECT
        COALESCE(SUM(amount), 0) AS "totalLent",
        COALESCE(SUM(CASE WHEN is_repaid = TRUE THEN amount ELSE 0 END), 0) AS "totalRepaid",
        COALESCE(SUM(CASE WHEN is_repaid = FALSE AND due_date < CURRENT_DATE THEN amount ELSE 0 END), 0) AS "overdueAmount",
        COALESCE(SUM(CASE WHEN is_repaid = FALSE THEN amount ELSE 0 END), 0) AS "outstandingAmount"
       FROM loans
       WHERE user_id = $1`,
      [userId]
    );

    const row = result.rows[0] || {};

    res.status(200).json({
      totalLent: parseFloat(row.totalLent || '0'),
      totalRepaid: parseFloat(row.totalRepaid || '0'),
      overdueAmount: parseFloat(row.overdueAmount || '0'),
      outstandingAmount: parseFloat(row.outstandingAmount || '0'),
    });
  } catch (error) {
    next(error);
  }
};
