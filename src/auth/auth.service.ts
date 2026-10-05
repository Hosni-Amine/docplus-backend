import { createHmac, timingSafeEqual } from 'crypto';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { UserRepository } from '../user/user.repository';
import { Injectable, Logger } from '@nestjs/common';
import { MailingService } from '../mailing/mailing.service';
import { ConfigService } from '@nestjs/config';
import { IBaseRes, OtpService } from '../common';
import {
  RequestOtpReqInput,
  RequestOtpRes,
  VerifyOtpReqInput,
  VerifyOtpRes,
} from './dto/auth.args';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../user/entities/user.entity';
import { AuthRateLimiter } from './auth-rate-limiter';

export interface GetUserRes extends IBaseRes {
  user: User;
}

const OTP_WINDOW_MS = 15 * 60 * 1000;
const OTP_REQUESTS_PER_EMAIL = 5;
const OTP_REQUESTS_PER_IP = 20;
const OTP_VERIFIES_PER_IP = 10;
const OTP_VERIFIES_PER_EMAIL = 5;
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly rateLimiter = new AuthRateLimiter();

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly mailingService: MailingService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
  ) {}

  /**
   * Send a one-time code to the user's email.
   * Unknown, blocked, and deleted accounts get the same success response.
   */
  async requestOtp(
    body: RequestOtpReqInput,
    ip: string,
  ): Promise<RequestOtpRes> {
    const emailKey = body.email.trim().toLowerCase();
    if (
      // check if the ip is rate limited
      !this.rateLimiter.tryConsume(
        `otp:ip:${ip}`,
        OTP_REQUESTS_PER_IP,
        OTP_WINDOW_MS,
      ) ||
      // check if the email is rate limited
      !this.rateLimiter.tryConsume(
        `otp:email:${emailKey}`,
        OTP_REQUESTS_PER_EMAIL,
        OTP_WINDOW_MS,
      )
    ) {
      return this.tooManyRequests();
    }

    const session = await this.userRepository.startTransaction();
    try {
      const current_user = await this.userRepository.findOne(
        { email: body.email.trim() },
        { session },
      );

      if (!current_user || current_user.isBlocked || current_user.isDeleted) {
        await session.abortTransaction();
        return this.genericOtpResponse();
      }

      // Generate OTP code and expiration
      const otpCode = this.otpService.generateOtpCode();
      const otpConfirmationToken = uuidv4();
      const otpExpiresAt = this.otpService.generateOtpExpiration(5); // 5 minutes

      await this.userRepository.findOneAndUpdate(
        { _id: current_user._id },
        {
          $set: {
            otp_confirmation_token: otpConfirmationToken,
            otp_code: this.hashOtp(otpCode),
            otp_expires_at: otpExpiresAt,
            otp_attempts: 0,
          },
        },
        { session },
      );

      // Send OTP via email
      const is_sent = await this.mailingService.sendOtpCode(
        current_user.email,
        current_user.firstName || current_user.email,
        otpCode,
        5, // 5 minutes
      );

      if (!is_sent) {
        this.logger.error(`Error sending OTP email to ${current_user.email}!`);
        await session.abortTransaction();
        return {
          message: 'ERROR_SENDING_OTP_EMAIL_TRY_AGAIN',
          status: 500,
        };
      }

      await session.commitTransaction();
      this.logger.log(`OTP code sent successfully to ${current_user.email}`);

      return {
        otp_confirmation_token: otpConfirmationToken,
        message: 'OTP_SENT_SUCCESSFULLY',
        status: 200,
      };
    } catch (error) {
      await session.abortTransaction().catch(() => undefined);
      this.logger.error('Error during OTP request:', error);
      return this.serverError();
    } finally {
      await session.endSession();
    }
  }

  /**
   * Check the one-time code and return a JWT.
   * In development, the code 000000 skips the OTP check.
   */
  async verifyOtp(body: VerifyOtpReqInput, ip: string): Promise<VerifyOtpRes> {
    const emailKey = body.email.trim().toLowerCase();
    if (
      !this.rateLimiter.tryConsume(
        `verify:ip:${ip}`,
        OTP_VERIFIES_PER_IP,
        OTP_WINDOW_MS,
      ) ||
      !this.rateLimiter.tryConsume(
        `verify:email:${emailKey}`,
        OTP_VERIFIES_PER_EMAIL,
        OTP_WINDOW_MS,
      )
    ) {
      return this.tooManyRequests();
    }

    try {
      const current_user = await this.userRepository.findOne({
        email: body.email.trim(),
      });
      const invalid = this.invalidOtpResponse();

      if (!current_user || current_user.isBlocked || current_user.isDeleted) {
        return invalid;
      }

      if (!this.isDevelopmentBypass(body.otp_code)) {
        const expiresAt = current_user.otp_expires_at
          ? new Date(current_user.otp_expires_at)
          : null;
        const validOTP =
          !!current_user.otp_code &&
          !!expiresAt &&
          new Date() < expiresAt &&
          this.otpMatches(current_user.otp_code, body.otp_code) &&
          this.tokensMatch(
            current_user.otp_confirmation_token,
            body.otp_confirmation_token,
          );

        if (!validOTP) {
          await this.registerFailedOtpAttempt(current_user);
          this.logger.error('OTP validation failed');
          return invalid;
        }
      }

      await this.userRepository.findOneAndUpdate(
        { _id: current_user._id },
        {
          $unset: {
            otp_code: 1,
            otp_expires_at: 1,
            otp_confirmation_token: 1,
            otp_attempts: 1,
          },
        },
      );

      const token = await this.jwtService.signAsync(
        {
          id: current_user._id.toString(),
          role: current_user.role,
          firstName: current_user.firstName,
          lastName: current_user.lastName,
          midNames: current_user.midNames ?? [],
          email: current_user.email,
          tokenVersion: current_user.tokenVersion ?? 0,
        },
        {
          secret: this.configService.getOrThrow<string>('JWT_SECRET'),
          expiresIn: this.configService.getOrThrow<string>(
            'JWT_EXPIRY',
          ) as JwtSignOptions['expiresIn'],
          algorithm: 'HS256',
        },
      );

      this.logger.log(`User ${current_user.email} logged in successfully`);

      return this.loggedIn(token);
    } catch (error) {
      this.logger.error('Error during OTP verification:', error);
      return this.serverError();
    }
  }

  /**
   * Invalidate the current JWT by bumping tokenVersion and clear any pending OTP.
   */
  async logout(userId: string): Promise<IBaseRes> {
    const current_user = await this.userRepository.findOne({ _id: userId });
    if (!current_user) {
      return {
        message: 'USER_NOT_FOUND',
        status: 404,
      };
    }

    await this.userRepository.findOneAndUpdate(
      { _id: userId },
      {
        $set: { tokenVersion: (current_user.tokenVersion ?? 0) + 1 },
        $unset: {
          otp_code: 1,
          otp_expires_at: 1,
          otp_confirmation_token: 1,
          otp_attempts: 1,
        },
      },
    );

    return {
      message: 'LOGGED_OUT_SUCCESSFULLY',
      status: 200,
    };
  }

  /**
   * Allow the code 000000 only when NODE_ENV is development.
   */
  private isDevelopmentBypass(otpCode: string): boolean {
    return (
      this.configService.get<string>('NODE_ENV') === 'development' &&
      otpCode === '000000'
    );
  }

  /**
   * Hash an OTP with HMAC-SHA256 so the plain code is not stored.
   */
  private hashOtp(otpCode: string): string {
    return createHmac(
      'sha256',
      this.configService.getOrThrow<string>('JWT_SECRET'),
    )
      .update(otpCode)
      .digest('hex');
  }

  /**
   * Compare a submitted OTP with the stored hash in constant time.
   */
  private otpMatches(storedHash: string, otpCode: string): boolean {
    return this.safeEqual(
      Buffer.from(this.hashOtp(otpCode), 'hex'),
      Buffer.from(storedHash, 'hex'),
    );
  }

  /**
   * Compare the confirmation token in constant time.
   */
  private tokensMatch(stored: string | undefined, provided: string): boolean {
    if (!stored) {
      return false;
    }
    return this.safeEqual(Buffer.from(stored), Buffer.from(provided));
  }

  /**
   * Compare two buffers in constant time. Lengths must match first.
   */
  private safeEqual(actual: Buffer, expected: Buffer): boolean {
    if (actual.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(new Uint8Array(actual), new Uint8Array(expected));
  }

  /**
   * Count a failed OTP check. After 5 failures the current code is deleted.
   */
  private async registerFailedOtpAttempt(user: User): Promise<void> {
    const attempts = (user.otp_attempts ?? 0) + 1;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await this.userRepository.findOneAndUpdate(
        { _id: user._id },
        {
          $unset: {
            otp_code: 1,
            otp_expires_at: 1,
            otp_confirmation_token: 1,
            otp_attempts: 1,
          },
        },
      );
      return;
    }

    await this.userRepository.findOneAndUpdate(
      { _id: user._id },
      { $set: { otp_attempts: attempts } },
    );
  }

  /**
   * Successful login. The profile is loaded later with the token.
   */
  private loggedIn(token: string): VerifyOtpRes {
    return {
      token,
      message: 'LOGGED_IN_SUCCESSFULLY',
      status: 200,
    };
  }

  /**
   * Shared response for an unexpected failure.
   */
  private serverError(): IBaseRes {
    return {
      message: 'INTERNAL_SERVER_ERROR',
      status: 500,
    };
  }

  /**
   * Shared response when an IP or email is over the attempt limit.
   */
  private tooManyRequests(): RequestOtpRes {
    return {
      message: 'TOO_MANY_REQUESTS',
      status: 429,
    };
  }

  /**
   * Success-shaped response used when no email should be sent.
   */
  private genericOtpResponse(): RequestOtpRes {
    return {
      otp_confirmation_token: uuidv4(),
      message: 'OTP_SENT_SUCCESSFULLY',
      status: 200,
    };
  }

  /**
   * Shared failure response so callers cannot tell why verification failed.
   */
  private invalidOtpResponse(): VerifyOtpRes {
    return {
      message: 'OTP_VALIDATION_FAILED',
      status: 400,
    };
  }
}
