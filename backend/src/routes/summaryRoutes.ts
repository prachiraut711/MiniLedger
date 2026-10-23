import { Router } from 'express';
import { getSummary } from '../controllers/summaryController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Protect summary route with JWT authentication
router.use(authMiddleware);

router.get('/', getSummary);

export default router;
