import { Router } from 'express';
import { createLoan, getLoans, repayLoan } from '../controllers/loanController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Protect all loan routes with JWT authentication
router.use(authMiddleware);

router.post('/', createLoan);
router.get('/', getLoans);
router.patch('/:id/repay', repayLoan);

export default router;
