import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { query } from '../config/db';

/**
 * Format a database loan row into a clean JSON response
 */
export const formatLoanRow = (row: any) => {
  // Ensure date is formatted as YYYY-MM-DD
  let formattedDueDate = row.due_date;
  if (row.due_date instanceof Date) {
    formattedDueDate = row.due_date.toISOString().split('T')[0];
  } else if (typeof row.due_date === 'string' && row.due_date.includes('T')) {
    formattedDueDate = row.due_date.split('T')[0];
  }

  return {
    id: row.id,
    userId: row.user_id,
    friendName: row.friend_name,
    amount: parseFloat(row.amount),
    dueDate: formattedDueDate,
    isRepaid: Boolean(row.is_repaid),
    createdAt: row.created_at,
  };
};

/**
 * POST /api/loans
 * Create a new loan entry for the authenticated user
 */
export const createLoan = async (
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

    const { friendName, amount, dueDate } = req.body;

    // Validate friend name
    if (!friendName || typeof friendName !== 'string' || friendName.trim().length === 0) {
      res.status(400).json({ error: 'Friend name is required' });
      return;
    }

    // Validate amount
    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ error: 'Amount must be a valid number greater than 0' });
      return;
    }

    // Validate due date
    if (!dueDate || typeof dueDate !== 'string') {
      res.status(400).json({ error: 'Due date is required' });
      return;
    }

    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ error: 'Due date must be a valid date in YYYY-MM-DD format' });
      return;
    }

    const formattedDate = parsedDate.toISOString().split('T')[0];

    const result = await query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, friend_name, amount, due_date, is_repaid, created_at`,
      [userId, friendName.trim(), parsedAmount, formattedDate]
    );

    const newLoan = formatLoanRow(result.rows[0]);
    res.status(201).json({
      success: true,
      loan: newLoan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/loans
 * Fetch all loans for the authenticated user
 */
export const getLoans = async (
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
      `SELECT id, user_id, friend_name, amount, due_date, is_repaid, created_at
       FROM loans
       WHERE user_id = $1
       ORDER BY is_repaid ASC, due_date ASC, id DESC`,
      [userId]
    );

    const loans = result.rows.map(formatLoanRow);
    res.status(200).json({ loans });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/loans/:id/repay
 * Mark a loan entry as repaid for the authenticated user
 */
export const repayLoan = async (
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

    const loanId = parseInt(req.params.id, 10);
    if (isNaN(loanId)) {
      res.status(400).json({ error: 'Invalid loan ID parameter' });
      return;
    }

    // Check ownership and update in a single safe query
    const result = await query(
      `UPDATE loans
       SET is_repaid = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, friend_name, amount, due_date, is_repaid, created_at`,
      [loanId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: 'Loan entry not found or you are not authorized to modify it',
      });
      return;
    }

    const updatedLoan = formatLoanRow(result.rows[0]);
    res.status(200).json({
      success: true,
      message: 'Loan successfully marked as repaid',
      loan: updatedLoan,
    });
  } catch (error) {
    next(error);
  }
};
