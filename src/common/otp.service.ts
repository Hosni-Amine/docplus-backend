import { randomInt } from 'crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OtpService {
  /**
   * Generate a 6-digit OTP code
   */
  generateOtpCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  /**
   * Generate OTP expiration date
   * @param minutes - Number of minutes until expiration (default: 5)
   */
  generateOtpExpiration(minutes: number = 5): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }
}
