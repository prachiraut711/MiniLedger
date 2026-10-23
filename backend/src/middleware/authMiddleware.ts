import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types';

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token is required (Bearer token)' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'miniledger_dev_secret_key_12345';

  try {
    const decoded = jwt.verify(token, secret) as { id: number; phone: string };
    req.user = {
      id: decoded.id,
      phone: decoded.phone,
    };
    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
};
