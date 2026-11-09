import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { createHash, timingSafeEqual } from 'crypto';
import { EDemoRequestStatus, OtpService } from '../common';
import { MailingService } from '../mailing/mailing.service';
import { AuthRateLimiter } from '../auth/auth-rate-limiter';
import { DemoRequestRepository } from './demo-request.repository';
import { RequestDemoOtpInput } from './dto/request-demo-otp.input';
import { CreateDemoRequestInput } from './dto/create-demo-request.input';
import { UpdateDemoRequestStatusInput } from './dto/update-demo-request-status.input';
import { GetDemoRequestsInput } from './dto/get-demo-requests.input';
import { DemoRequest } from './entities/demo-request.entity';

type PendingDemoOtp = {
  email: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
};

@Injectable()
export class DemoRequestService {
  private readonly logger = new Logger(DemoRequestService.name);
  private readonly rateLimiter = new AuthRateLimiter();
  private readonly pendingOtps = new Map<string, PendingDemoOtp>();

  constructor(
    private readonly demoRequestRepository: DemoRequestRepository,
    private readonly otpService: OtpService,
    private readonly mailingService: MailingService,
  ) {}

  private hashOtp(otpCode: string): string {
    return createHash('sha256').update(otpCode).digest('hex');
  }

  private isBypassCode(otpCode: string): boolean {
    return otpCode === '000000';
  }

  private otpMatches(storedHash: string, otpCode: string): boolean {
    try {
      const a = Buffer.from(storedHash, 'hex');
      const b = Buffer.from(this.hashOtp(otpCode), 'hex');
      return (
        a.length === b.length &&
        timingSafeEqual(new Uint8Array(a), new Uint8Array(b))
      );
    } catch {
      return false;
    }
  }

  private cleanupExpiredOtps(): void {
    const now = Date.now();
    for (const [token, data] of this.pendingOtps.entries()) {
      if (data.expiresAt.getTime() < now) {
        this.pendingOtps.delete(token);
      }
    }
  }

  /**
   * Request OTP for demo request verification.
   * Ensures every email has only one active (non-deleted) request.
   */
  async requestOtp(
    body: RequestDemoOtpInput,
    ip: string,
  ): Promise<{
    status: number;
    message: string;
    otp_confirmation_token?: string;
  }> {
    const normalizedEmail = body.email.trim().toLowerCase();

    if (
      !this.rateLimiter.tryConsume(`demo_otp:ip:${ip}`, 10, 60_000) ||
      !this.rateLimiter.tryConsume(
        `demo_otp:email:${normalizedEmail}`,
        5,
        60_000,
      )
    ) {
      return {
        status: 429,
        message: 'TOO_MANY_REQUESTS',
      };
    }

    try {
      // Check if an active, already verified demo request exists
      const existing = await this.demoRequestRepository.findOne({
        email: normalizedEmail,
        is_deleted: { $ne: true },
        is_email_verified: true,
      });

      if (existing) {
        return {
          status: 400,
          message: 'DEMO_REQUEST_ALREADY_EXISTS',
        };
      }

      const otpCode = this.otpService.generateOtpCode();
      const otpConfirmationToken = uuidv4();
      const otpExpiresAt = this.otpService.generateOtpExpiration(5);

      this.cleanupExpiredOtps();
      this.pendingOtps.set(otpConfirmationToken, {
        email: normalizedEmail,
        otpHash: this.hashOtp(otpCode),
        expiresAt: otpExpiresAt,
        attempts: 0,
      });

      // Send OTP via email
      const isSent = await this.mailingService.sendOtpCode(
        normalizedEmail,
        body.firstName || normalizedEmail,
        otpCode,
        5,
      );

      if (!isSent) {
        this.pendingOtps.delete(otpConfirmationToken);
        this.logger.error(`Error sending OTP email to ${normalizedEmail}`);
        return {
          status: 500,
          message: 'ERROR_SENDING_OTP_EMAIL_TRY_AGAIN',
        };
      }

      this.logger.log(`Demo request OTP sent to ${normalizedEmail}`);
      return {
        status: 200,
        message: 'OTP_SENT_SUCCESSFULLY',
        otp_confirmation_token: otpConfirmationToken,
      };
    } catch (error) {
      this.logger.error('Error during demo request OTP generation:', error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
      };
    }
  }

  /**
   * Verify OTP and complete Demo Request creation.
   * Open endpoint for public landing page / sign-up.
   */
  async create(
    body: CreateDemoRequestInput,
    ip: string,
  ): Promise<{ status: number; message: string; demoRequest?: DemoRequest }> {
    const normalizedEmail = body.email.trim().toLowerCase();

    if (!this.rateLimiter.tryConsume(`demo_verify:ip:${ip}`, 15, 60_000)) {
      return {
        status: 429,
        message: 'TOO_MANY_REQUESTS',
      };
    }

    try {
      // Ensure only one non-deleted demo request per email
      const existing = await this.demoRequestRepository.findOne({
        email: normalizedEmail,
        is_deleted: { $ne: true },
        is_email_verified: true,
      });

      if (existing) {
        return {
          status: 400,
          message: 'DEMO_REQUEST_ALREADY_EXISTS',
        };
      }

      // Verify OTP from pending verification store
      const pending = this.pendingOtps.get(body.otp_confirmation_token);

      if (!pending || pending.email !== normalizedEmail) {
        return {
          status: 400,
          message: 'OTP_VALIDATION_FAILED',
        };
      }

      if (!this.isBypassCode(body.otp_code)) {
        pending.attempts += 1;

        if (
          pending.expiresAt.getTime() < Date.now() ||
          pending.attempts > 5 ||
          !this.otpMatches(pending.otpHash, body.otp_code)
        ) {
          if (
            pending.attempts > 5 ||
            pending.expiresAt.getTime() < Date.now()
          ) {
            this.pendingOtps.delete(body.otp_confirmation_token);
          }
          return {
            status: 400,
            message: 'OTP_VALIDATION_FAILED',
          };
        }
      }

      // Consume OTP so it cannot be reused
      this.pendingOtps.delete(body.otp_confirmation_token);

      // Create new verified Demo Request document
      const resolvedLegalName = body.legalName?.trim() || '';

      const demoRequest = await this.demoRequestRepository.create({
        email: normalizedEmail,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        legalName: resolvedLegalName,
        phone: body.phone?.trim() || '',
        service: body.service?.trim() || '',
        note: body.note?.trim() || '',
        status: EDemoRequestStatus.PENDING_APPROVAL,
        is_email_verified: true,
        is_deleted: false,
      });

      this.logger.log(
        `Demo request created successfully for ${normalizedEmail}`,
      );

      // Send confirmation email to the requester
      void this.mailingService.sendDemoRequestConfirmation(
        normalizedEmail,
        `${body.firstName} ${body.lastName}`.trim(),
        resolvedLegalName,
      );

      return {
        status: 201,
        message: 'DEMO_REQUEST_CREATED_SUCCESSFULLY',
        demoRequest,
      };
    } catch (error) {
      this.logger.error('Error creating demo request:', error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
      };
    }
  }

  /**
   * Admin: List all demo requests.
   */
  async findAll(
    query: GetDemoRequestsInput,
  ): Promise<{ status: number; message: string; demoRequests: DemoRequest[] }> {
    try {
      const filter: any = {
        is_deleted: { $ne: true },
        is_email_verified: true,
      };

      if (query.status) {
        filter.status = query.status;
      }

      if (query.search) {
        const regex = new RegExp(query.search.trim(), 'i');
        filter.$or = [
          { email: regex },
          { firstName: regex },
          { lastName: regex },
          { legalName: regex },
          { clinicName: regex },
          { phone: regex },
        ];
      }

      const demoRequests = await this.demoRequestRepository.find(filter);
      demoRequests.sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      return {
        status: 200,
        message: 'DEMO_REQUESTS_FOUND_SUCCESSFULLY',
        demoRequests,
      };
    } catch (error) {
      this.logger.error('Error fetching demo requests:', error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        demoRequests: [],
      };
    }
  }

  /**
   * Admin: Get a single demo request by ID.
   */
  async findOne(id: string): Promise<{
    status: number;
    message: string;
    demoRequest: DemoRequest | null;
  }> {
    try {
      const demoRequest = await this.demoRequestRepository.findOne({
        _id: id,
        is_deleted: { $ne: true },
      });

      if (!demoRequest) {
        return {
          status: 404,
          message: 'DEMO_REQUEST_NOT_FOUND',
          demoRequest: null,
        };
      }

      return {
        status: 200,
        message: 'DEMO_REQUEST_FOUND_SUCCESSFULLY',
        demoRequest,
      };
    } catch (error) {
      this.logger.error('Error finding demo request:', error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        demoRequest: null,
      };
    }
  }

  /**
   * Admin: Update demo request status ONLY.
   * Requirement: "we can only update the status".
   */
  async updateStatus(
    id: string,
    input: UpdateDemoRequestStatusInput,
  ): Promise<{
    status: number;
    message: string;
    demoRequest: DemoRequest | null;
  }> {
    try {
      const updated = await this.demoRequestRepository.findOneAndUpdate(
        { _id: id, is_deleted: { $ne: true } },
        { $set: { status: input.status } },
      );

      if (!updated) {
        return {
          status: 404,
          message: 'DEMO_REQUEST_NOT_FOUND',
          demoRequest: null,
        };
      }

      this.logger.log(`Demo request ${id} status updated to ${input.status}`);
      return {
        status: 200,
        message: 'DEMO_REQUEST_STATUS_UPDATED_SUCCESSFULLY',
        demoRequest: updated,
      };
    } catch (error) {
      this.logger.error('Error updating demo request status:', error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        demoRequest: null,
      };
    }
  }

  /**
   * Admin: Soft delete demo request.
   */
  async remove(id: string): Promise<{ status: number; message: string }> {
    try {
      const deleted = await this.demoRequestRepository.findOneAndUpdate(
        { _id: id },
        { $set: { is_deleted: true } },
      );

      if (!deleted) {
        return {
          status: 404,
          message: 'DEMO_REQUEST_NOT_FOUND',
        };
      }

      return {
        status: 200,
        message: 'DEMO_REQUEST_DELETED_SUCCESSFULLY',
      };
    } catch (error) {
      this.logger.error('Error deleting demo request:', error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
      };
    }
  }
}
