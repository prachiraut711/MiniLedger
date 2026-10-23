import request from 'supertest';
import { createApp } from '../src/app';
import { setPool } from '../src/config/db';
import { otpStore } from '../src/services/otpStore';

const app = createApp();

describe('Database Availability and Error Handling', () => {
  it('should return 503 with friendly message when database is unavailable', async () => {
    // Mock a disconnected pool that throws ECONNREFUSED
    const brokenPool = {
      query: jest.fn().mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED 127.0.0.1:5432',
      }),
    };
    setPool(brokenPool);

    // Prepare valid OTP in memory
    otpStore.saveOtp('9998887776', '123456', 5);

    // Call verify-otp, which attempts to read/insert into users table
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: '9998887776', otp: '123456' });

    expect(res.status).toBe(503);
    expect(res.body.error).toContain('Database is unavailable');
    expect(res.body.code).toBe('ECONNREFUSED');
  });
});
