import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from './config';
import { Loan, Summary, User } from '../types';

const TOKEN_STORAGE_KEY = '@miniledger_jwt_token';
const USER_STORAGE_KEY = '@miniledger_user_profile';

let memoryToken: string | null = null;

export const setAuthToken = async (token: string | null): Promise<void> => {
  memoryToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

export const getStoredToken = async (): Promise<string | null> => {
  if (memoryToken) return memoryToken;
  try {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    memoryToken = token;
    return token;
  } catch (err) {
    return null;
  }
};

export const setStoredUser = async (user: User | null): Promise<void> => {
  if (user) {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  }
};

export const getStoredUser = async (): Promise<User | null> => {
  try {
    const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

/**
 * Generic API request wrapper
 */
async function request<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: any;
    requireAuth?: boolean;
  } = {}
): Promise<T> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (options.requireAuth !== false) {
    const token = await getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        data?.error || data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data as T;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out while connecting to ${baseUrl}. Check your network connection.`);
    }
    if (error.message?.includes('Network request failed')) {
      throw new Error(
        `Unable to reach backend at ${baseUrl}.\nEnsure backend is running and you are using the correct IP address.`
      );
    }
    throw error;
  }
}

export const api = {
  // Auth
  sendOtp: async (phone: string) => {
    return request<{ success: boolean; message: string; phone: string }>('/auth/send-otp', {
      method: 'POST',
      body: { phone },
      requireAuth: false,
    });
  },

  verifyOtp: async (phone: string, otp: string) => {
    return request<{ success: boolean; token: string; user: User }>('/auth/verify-otp', {
      method: 'POST',
      body: { phone, otp },
      requireAuth: false,
    });
  },

  // Summary
  getSummary: async () => {
    return request<Summary>('/summary', {
      method: 'GET',
      requireAuth: true,
    });
  },

  // Loans
  getLoans: async () => {
    return request<{ loans: Loan[] }>('/loans', {
      method: 'GET',
      requireAuth: true,
    });
  },

  createLoan: async (loanData: { friendName: string; amount: number; dueDate: string }) => {
    return request<{ success: boolean; loan: Loan }>('/loans', {
      method: 'POST',
      body: loanData,
      requireAuth: true,
    });
  },

  repayLoan: async (loanId: number) => {
    return request<{ success: boolean; message: string; loan: Loan }>(`/loans/${loanId}/repay`, {
      method: 'PATCH',
      requireAuth: true,
    });
  },
};

export default api;
