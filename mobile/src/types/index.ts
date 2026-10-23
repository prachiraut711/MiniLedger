export interface User {
  id: number;
  phone: string;
  createdAt?: string;
}

export interface Loan {
  id: number;
  userId: number;
  friendName: string;
  amount: number;
  dueDate: string;
  isRepaid: boolean;
  createdAt: string;
}

export interface Summary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
  outstandingAmount: number;
}

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  AddLoan: undefined;
};
