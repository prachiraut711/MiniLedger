import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool | any = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/miniledger',
});

// Allow overriding the pool for testing (e.g. pg-mem)
export const setPool = (newPool: any) => {
  pool = newPool;
};

export const getPool = (): Pool => pool;

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  return pool.query(text, params);
};

export const checkDbConnection = async (): Promise<boolean> => {
  try {
    await query('SELECT 1');
    return true;
  } catch (err) {
    return false;
  }
};

export default {
  query,
  getPool,
  setPool,
  checkDbConnection,
};
