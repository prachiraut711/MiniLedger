import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import { otpStore } from '../services/otpStore';

const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

/**
 * POST /api/auth/send-otp
 * Generates and prints a 6-digit mock OTP to the backend console
 */
export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone } = req.body;

    if (!phone || typeof phone !== 'string') {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    const cleanPhone = phone.trim().replace(/[\s-]/g, '');

    if (!PHONE_REGEX.test(cleanPhone)) {
      res.status(400).json({
        error: 'Invalid phone number format. Please provide a valid phone number (7-15 digits, optional + prefix).',
      });
      return;
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);

    // Save in temporary memory store
    otpStore.saveOtp(cleanPhone, otp, expiryMinutes);

    // Print to the backend terminal clearly
    console.log('\n============================================================');
    console.log(' [MiniLedger MOCK OTP SERVICE]');
    console.log(` Phone:    ${cleanPhone}`);
    console.log(` Mock OTP: ${otp}`);
    console.log(` Expiry:   ${expiryMinutes} minutes`);
    console.log(' Enter this 6-digit code in the mobile app.');
    console.log('============================================================\n');

    res.status(200).json({
      success: true,
      message: 'Mock OTP sent successfully. Please check your backend terminal console for the OTP code.',
      phone: cleanPhone,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-otp
 * Verifies OTP and returns a signed JWT token
 */
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone, otp } = req.body;

    if (!phone || typeof phone !== 'string') {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    if (!otp || typeof otp !== 'string') {
      res.status(400).json({ error: 'OTP is required' });
      return;
    }

    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    const cleanOtp = otp.trim();

    // Verify OTP against in-memory store
    const isValid = otpStore.verifyOtp(cleanPhone, cleanOtp);

    if (!isValid) {
      res.status(400).json({
        error: 'Invalid or expired OTP. Please check your backend console or request a new OTP.',
      });
      return;
    }

    // Upsert or retrieve user in PostgreSQL
    let user;
    const existing = await query(
      'SELECT id, phone, created_at FROM users WHERE phone = $1',
      [cleanPhone]
    );

    if (existing.rows.length > 0) {
      user = existing.rows[0];
    } else {
      const created = await query(
        'INSERT INTO users (phone) VALUES ($1) RETURNING id, phone, created_at',
        [cleanPhone]
      );
      user = created.rows[0];
    }

    const secret = process.env.JWT_SECRET || 'miniledger_dev_secret_key_12345';
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as any;

    const token = jwt.sign(
      {
        id: user.id,
        phone: user.phone,
      },
      secret,
      { expiresIn }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};
