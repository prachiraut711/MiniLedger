import { Request } from 'express';

export interface User {
  id: number;
  phone: string;
  created_at?: string;
}

export interface Loan {
  id: number;
  user_id: number;
  friend_name: string;
  amount: number;
  due_date: string;
  is_repaid: boolean;
  created_at: string;
}

export interface Summary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
  outstandingAmount: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    phone: string;
  };
}
