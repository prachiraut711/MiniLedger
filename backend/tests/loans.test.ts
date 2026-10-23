import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { setupTestDb } from './setupTestDb';

const app = createApp();
const JWT_SECRET = process.env.JWT_SECRET || 'miniledger_dev_secret_key_12345';

describe('Loans API (/api/loans)', () => {
  let pool: any;
  let user1Token: string;
  let user2Token: string;
  let user1Id: number;
  let user2Id: number;

  beforeAll(async () => {
    const testDb = setupTestDb();
    pool = testDb.pool;

    // Seed test users
    const res1 = await pool.query(
      "INSERT INTO users (phone) VALUES ('1111111111') RETURNING id, phone"
    );
    user1Id = res1.rows[0].id;
    user1Token = jwt.sign({ id: user1Id, phone: '1111111111' }, JWT_SECRET);

    const res2 = await pool.query(
      "INSERT INTO users (phone) VALUES ('2222222222') RETURNING id, phone"
    );
    user2Id = res2.rows[0].id;
    user2Token = jwt.sign({ id: user2Id, phone: '2222222222' }, JWT_SECRET);
  });

  afterAll(async () => {
    if (pool && pool.end) {
      await pool.end();
    }
  });

  describe('Authentication Check', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/loans');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Authorization token is required');
    });

    it('should return 401 when invalid token is provided', async () => {
      const res = await request(app)
        .get('/api/loans')
        .set('Authorization', 'Bearer invalidtoken123');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid or expired token');
    });
  });

  describe('POST /api/loans (Create loan)', () => {
    it('should reject loan with empty friendName', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          friendName: '',
          amount: 500,
          dueDate: '2026-12-31',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Friend name is required');
    });

    it('should reject loan with zero or negative amount', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          friendName: 'Aman',
          amount: -100,
          dueDate: '2026-12-31',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Amount must be a valid number greater than 0');
    });

    it('should reject loan with invalid date', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          friendName: 'Aman',
          amount: 500,
          dueDate: 'not-a-date',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('valid date');
    });

    it('should create loan successfully with valid data', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          friendName: 'Rohan Sharma',
          amount: 1500,
          dueDate: '2026-11-15',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.loan.friendName).toBe('Rohan Sharma');
      expect(res.body.loan.amount).toBe(1500);
      expect(res.body.loan.dueDate).toBe('2026-11-15');
      expect(res.body.loan.isRepaid).toBe(false);
      expect(res.body.loan.userId).toBe(user1Id);
    });
  });

  describe('GET /api/loans (User Isolation)', () => {
    beforeAll(async () => {
      // Create a loan for user2
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          friendName: 'Priya Verma',
          amount: 800,
          dueDate: '2026-12-01',
        });
    });

    it('should only return loans belonging to user1', async () => {
      const res = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.loans)).toBe(true);
      // All loans returned must belong to user1
      res.body.loans.forEach((loan: any) => {
        expect(loan.userId).toBe(user1Id);
        expect(loan.friendName).not.toBe('Priya Verma');
      });
    });

    it('should only return loans belonging to user2', async () => {
      const res = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.loans.length).toBeGreaterThan(0);
      res.body.loans.forEach((loan: any) => {
        expect(loan.userId).toBe(user2Id);
      });
    });
  });

  describe('PATCH /api/loans/:id/repay', () => {
    let user1LoanId: number;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          friendName: 'Kunal',
          amount: 600,
          dueDate: '2026-10-30',
        });
      user1LoanId = res.body.loan.id;
    });

    it('should prevent another user from marking a loan as repaid', async () => {
      const res = await request(app)
        .patch(`/api/loans/${user1LoanId}/repay`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not authorized');
    });

    it('should allow the owner to mark the loan as repaid', async () => {
      const res = await request(app)
        .patch(`/api/loans/${user1LoanId}/repay`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.loan.isRepaid).toBe(true);
    });
  });
});
