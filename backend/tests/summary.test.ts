import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { setupTestDb } from './setupTestDb';

const app = createApp();
const JWT_SECRET = process.env.JWT_SECRET || 'miniledger_dev_secret_key_12345';

describe('Summary API (/api/summary)', () => {
  let pool: any;
  let userToken: string;
  let userId: number;

  beforeAll(async () => {
    const testDb = setupTestDb();
    pool = testDb.pool;

    // Seed test user
    const res = await pool.query(
      "INSERT INTO users (phone) VALUES ('9988776655') RETURNING id, phone"
    );
    userId = res.rows[0].id;
    userToken = jwt.sign({ id: userId, phone: '9988776655' }, JWT_SECRET);

    // 1. Repaid loan: 500
    await pool.query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date, is_repaid)
       VALUES ($1, 'Rahul', 500, '2026-01-01', TRUE)`,
      [userId]
    );

    // 2. Overdue unpaid loan: 300 (due in 2020)
    await pool.query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date, is_repaid)
       VALUES ($1, 'Amit', 300, '2020-01-01', FALSE)`,
      [userId]
    );

    // 3. Future unpaid loan: 700 (due in 2028)
    await pool.query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date, is_repaid)
       VALUES ($1, 'Neha', 700, '2028-01-01', FALSE)`,
      [userId]
    );

    // Another user's loan (should NOT be counted): 2000
    const otherUser = await pool.query(
      "INSERT INTO users (phone) VALUES ('5555555555') RETURNING id"
    );
    await pool.query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date, is_repaid)
       VALUES ($1, 'Stranger', 2000, '2026-05-01', FALSE)`,
      [otherUser.rows[0].id]
    );
  });

  afterAll(async () => {
    if (pool && pool.end) {
      await pool.end();
    }
  });

  it('should reject unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/summary');
    expect(res.status).toBe(401);
  });

  it('should accurately calculate totalLent, totalRepaid, overdueAmount, and outstandingAmount', async () => {
    const res = await request(app)
      .get('/api/summary')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    // totalLent: 500 + 300 + 700 = 1500
    expect(res.body.totalLent).toBe(1500);
    // totalRepaid: 500
    expect(res.body.totalRepaid).toBe(500);
    // overdueAmount: 300 (Amit's loan from 2020)
    expect(res.body.overdueAmount).toBe(300);
    // outstandingAmount: 300 + 700 = 1000
    expect(res.body.outstandingAmount).toBe(1000);
  });
});
