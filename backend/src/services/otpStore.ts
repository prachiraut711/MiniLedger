interface StoredOtp {
  otp: string;
  expiresAt: number;
}

class OtpStore {
  private store: Map<string, StoredOtp> = new Map();

  /**
   * Save OTP in memory with expiration
   */
  public saveOtp(phone: string, otp: string, ttlMinutes: number = 5): void {
    const normalizedPhone = this.normalizePhone(phone);
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
    this.store.set(normalizedPhone, { otp, expiresAt });
  }

  /**
   * Verify whether the OTP is valid and not expired
   * Removes OTP upon successful verification to prevent replay
   */
  public verifyOtp(phone: string, otp: string): boolean {
    const normalizedPhone = this.normalizePhone(phone);
    const record = this.store.get(normalizedPhone);

    if (!record) {
      return false;
    }

    if (Date.now() > record.expiresAt) {
      this.store.delete(normalizedPhone);
      return false;
    }

    if (record.otp === otp.trim()) {
      // Consume the OTP
      this.store.delete(normalizedPhone);
      return true;
    }

    return false;
  }

  /**
   * Get remaining seconds for an active OTP
   */
  public getRemainingTtl(phone: string): number | null {
    const normalizedPhone = this.normalizePhone(phone);
    const record = this.store.get(normalizedPhone);
    if (!record) return null;
    const remainingMs = record.expiresAt - Date.now();
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : null;
  }

  /**
   * Clear all OTPs (for tests)
   */
  public clearAll(): void {
    this.store.clear();
  }

  /**
   * Normalize phone number format (trim and clean whitespace/dashes)
   */
  public normalizePhone(phone: string): string {
    return phone.trim().replace(/[\s-]/g, '');
  }
}

export const otpStore = new OtpStore();
export default otpStore;
