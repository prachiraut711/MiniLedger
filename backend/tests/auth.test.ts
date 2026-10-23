import request from 'supertest';
import { createApp } from '../src/app';
import { setupTestDb } from './setupTestDb';
import { otpStore } from '../src/services/otpStore';
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';

const app = createApp();

describe('Auth API (/api/auth)', () => {
  let pool: any;

  beforeAll(() => {
    const testDb = setupTestDb();
    pool = testDb.pool;
  });

  afterAll(async () => {
    if (pool && pool.end) {
      await pool.end();
    }
  });

  beforeEach(() => {
    otpStore.clearAll();
  });

  describe('POST /api/auth/send-otp', () => {
    it('should reject request without phone number', async () => {
      const res = await request(app).post('/api/auth/send-otp').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Phone number is required');
    });

    it('should reject invalid phone format', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: 'abc-xyz' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid phone number format');
    });

    it('should generate mock OTP and return success message', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: '+919876543210' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Mock OTP sent successfully');
      expect(res.body.phone).toBe('+919876543210');
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    const testPhone = '9876543210';
    const validOtp = '123456';

    beforeEach(() => {
      otpStore.saveOtp(testPhone, validOtp, 5);
    });

    it('should reject request with missing fields', async () => {
      const res = await request(app).post('/api/auth/verify-otp').send({ phone: testPhone });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('OTP is required');
    });

    it('should reject invalid OTP', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, otp: '999999' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid or expired OTP');
    });

    it('should successfully verify valid OTP and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, otp: validOtp });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.phone).toBe(testPhone);
      expect(typeof res.body.user.id).toBe('number');
    });

    it('should prevent reusing the same OTP once verified', async () => {
      // First verification succeeds
      const firstRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, otp: validOtp });
      expect(firstRes.status).toBe(200);

      // Re-using the same OTP should fail
      const secondRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, otp: validOtp });
      expect(secondRes.status).toBe(400);
    });
  });
});
