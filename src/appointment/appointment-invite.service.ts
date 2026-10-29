import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { AuthRateLimiter } from '../auth/auth-rate-limiter';
import {
  IBaseRes,
  EUserStatus,
  EConsultationType,
  buildFrontendUrl,
} from '../common';
import { MailingService } from '../mailing/mailing.service';
import { UserRepository } from '../user/user.repository';
import { AppointmentRepository } from './appointment.repository';

/**
 * Marks a token as an appointment invite so it can never pass as a session
 * token: the AuthGuard rejects any token carrying a purpose claim.
 */
export const APPOINTMENT_INVITE_PURPOSE = 'appointment_invite';
export const VIDEO_SESSION_PURPOSE = 'video_session';

/** The consultation room opens before the start and closes after the end. */
const ROOM_OPENS_BEFORE_MS = 15 * 60 * 1000;
const ROOM_GRACE_MS = 15 * 60 * 1000;

/**
 * Headroom on the minted session past the room close, so the frontend's
 * expiry handler does not fire while the consultation is still wrapping up.
 */
const SESSION_GRACE_MS = 30 * 60 * 1000;

const RESEND_WINDOW_MS = 15 * 60 * 1000;

export interface AppointmentInvitePayload {
  purpose: typeof APPOINTMENT_INVITE_PURPOSE;
  appointmentId: string;
  /** Attendee user id. Deliberately not `id`, which is the session token claim. */
  uid: string;
  email: string;
}

export interface ExchangeInviteRes extends IBaseRes {
  token?: string;
  appointmentId?: string;
}

@Injectable()
export class AppointmentInviteService {
  private readonly logger = new Logger(AppointmentInviteService.name);
  private readonly rateLimiter = new AuthRateLimiter();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly userRepository: UserRepository,
    private readonly mailingService: MailingService,
  ) {}

  /**
   * Sign an invite for the attendee. It expires when the room closes and is
   * bound to one appointment and one user, so it is useless anywhere else.
   */
  async sign(params: {
    appointmentId: string;
    userId: string;
    email: string;
    end: Date;
  }): Promise<string> {
    const payload: AppointmentInvitePayload = {
      purpose: APPOINTMENT_INVITE_PURPOSE,
      appointmentId: params.appointmentId,
      uid: params.userId,
      email: params.email,
    };

    const msUntilClose =
      new Date(params.end).getTime() + ROOM_GRACE_MS - Date.now();
    const expiresIn = Math.max(Math.floor(msUntilClose / 1000), 60);

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      algorithm: 'HS256',
      expiresIn,
    });
  }

  /** Verify an invite. Returns null for anything unsigned, expired or of another kind. */
  private async verify(
    token: string,
  ): Promise<AppointmentInvitePayload | null> {
    try {
      const payload =
        await this.jwtService.verifyAsync<AppointmentInvitePayload>(token, {
          secret: this.configService.getOrThrow<string>('JWT_SECRET'),
          algorithms: ['HS256'],
        });

      if (
        payload?.purpose !== APPOINTMENT_INVITE_PURPOSE ||
        !Types.ObjectId.isValid(payload.appointmentId ?? '') ||
        !Types.ObjectId.isValid(payload.uid ?? '') ||
        !payload.email
      ) {
        return null;
      }

      return payload;
    } catch (error: any) {
      this.logger.warn(`Invalid appointment invite: ${error?.message}`);
      return null;
    }
  }

  /**
   * Trade a valid invite for a normal session token, so the patient joins as
   * an identified user rather than the link standing in for their identity.
   *
   * Only inside the room window, only for the invited attendee of that
   * appointment, and only while the exchange budget lasts.
   */
  async exchange(token: string): Promise<ExchangeInviteRes> {
    const invalid: ExchangeInviteRes = {
      status: 400,
      message: 'INVITE_INVALID_OR_EXPIRED',
    };

    if (!token) {
      return invalid;
    }

    try {
      const payload = await this.verify(token);
      if (!payload) {
        return invalid;
      }

      const appointment = await this.appointmentRepository.findOne({
        _id: new Types.ObjectId(payload.appointmentId),
        userId: new Types.ObjectId(payload.uid),
        isDeleted: false,
      });
      const isVideo = appointment?.consultationType === EConsultationType.VIDEO;
      if (!appointment || !isVideo) {
        return invalid;
      }

      const now = Date.now();
      const startTime = new Date(appointment.start).getTime();
      const endTime = new Date(appointment.end).getTime();

      if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
        return invalid;
      }

      const opensAt = startTime - ROOM_OPENS_BEFORE_MS;
      const closesAt = endTime + ROOM_GRACE_MS;

      if (now < opensAt || now > closesAt) {
        return invalid;
      }

      const user = await this.userRepository.findOne({
        _id: new Types.ObjectId(payload.uid),
      });
      if (!user || user.status !== EUserStatus.ACTIVE) {
        return invalid;
      }

      // The video session token expires shortly after the room, so a copied link cannot be
      // used on another day, and is scoped strictly for video session access.
      const sessionToken = await this.jwtService.signAsync(
        {
          purpose: VIDEO_SESSION_PURPOSE,
          appointmentId: payload.appointmentId,
          id: user._id.toString(),
          tokenVersion: user.tokenVersion ?? 0,
        },
        {
          secret: this.configService.getOrThrow<string>('JWT_SECRET'),
          algorithm: 'HS256',
          expiresIn: Math.max(
            Math.floor((closesAt + SESSION_GRACE_MS - now) / 1000),
            60,
          ) as JwtSignOptions['expiresIn'],
        },
      );

      this.logger.log(
        `Invite exchanged for user ${user.email} on appointment ${payload.appointmentId}`,
      );

      return {
        status: 200,
        message: 'INVITE_ACCEPTED',
        token: sessionToken,
        appointmentId: payload.appointmentId,
      };
    } catch (error) {
      this.logger.error('Error exchanging appointment invite', error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR' };
    }
  }

  /** One-click join link for the attendee's invitation email. */
  buildJoinLink(appointmentId: string, inviteToken: string): string {
    return buildFrontendUrl(
      this.configService.get<string>('FRONTEND_URL'),
      `/join/${appointmentId}`,
      { t: inviteToken },
    );
  }

  /**
   * Resend a fresh appointment invite link to the attendee when their link was used up.
   * Resets the invite exchange count so the attendee can join.
   */
  async resendInvite(token: string, ip: string): Promise<IBaseRes> {
    if (!token) {
      return { status: 400, message: 'INVITE_INVALID_OR_EXPIRED' };
    }

    if (
      !this.rateLimiter.tryConsume(`invite:resend:${ip}`, 20, RESEND_WINDOW_MS)
    ) {
      return { status: 429, message: 'TOO_MANY_REQUESTS' };
    }

    try {
      // Decode or verify payload
      let payload: AppointmentInvitePayload | null = null;
      try {
        payload = await this.jwtService.verifyAsync<AppointmentInvitePayload>(
          token,
          {
            secret: this.configService.getOrThrow<string>('JWT_SECRET'),
            algorithms: ['HS256'],
          },
        );
      } catch {
        payload = this.jwtService.decode(
          token,
        ) as AppointmentInvitePayload | null;
      }

      if (
        !payload ||
        payload.purpose !== APPOINTMENT_INVITE_PURPOSE ||
        !Types.ObjectId.isValid(payload.appointmentId ?? '') ||
        !Types.ObjectId.isValid(payload.uid ?? '') ||
        !payload.email
      ) {
        return { status: 400, message: 'INVITE_INVALID_OR_EXPIRED' };
      }

      const appointment = await this.appointmentRepository.findOne({
        _id: new Types.ObjectId(payload.appointmentId),
        userId: new Types.ObjectId(payload.uid),
        isDeleted: false,
      });

      if (!appointment) {
        return { status: 400, message: 'INVITE_INVALID_OR_EXPIRED' };
      }

      const isVideo = appointment.consultationType === EConsultationType.VIDEO;
      if (!isVideo) {
        return { status: 403, message: 'VIDEO_NOT_ENABLED_FOR_APPOINTMENT' };
      }

      const now = Date.now();
      const closesAt = new Date(appointment.end).getTime() + ROOM_GRACE_MS;
      if (now > closesAt) {
        return { status: 403, message: 'CONSULTATION_ROOM_CLOSED' };
      }

      const user = await this.userRepository.findOne({
        _id: new Types.ObjectId(payload.uid),
      });

      if (!user || user.status !== EUserStatus.ACTIVE) {
        return { status: 400, message: 'INVITE_INVALID_OR_EXPIRED' };
      }

      // Reset exchange count
      await this.appointmentRepository.findOneAndUpdate(
        { _id: appointment._id },
        { $set: { inviteExchangeCount: 0 } },
      );

      // Issue new fresh invite token
      const freshInviteToken = await this.sign({
        appointmentId: appointment._id.toString(),
        userId: user._id.toString(),
        email: user.email,
        end: appointment.end,
      });

      const joinUrl = this.buildJoinLink(
        appointment._id.toString(),
        freshInviteToken,
      );

      let practitionerName: string | undefined;
      if (appointment.adminId) {
        const practitioner = await this.userRepository.findOne({
          _id: appointment.adminId,
        });
        if (practitioner) {
          practitionerName =
            [practitioner.firstName, practitioner.lastName]
              .filter(Boolean)
              .join(' ') || practitioner.email;
        }
      }

      const timeZone =
        this.configService.get<string>('APP_TIMEZONE') || 'Europe/Paris';
      let startFormatted: string;
      try {
        startFormatted = new Intl.DateTimeFormat('en-GB', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone,
        }).format(new Date(appointment.start));
      } catch {
        startFormatted = new Date(appointment.start).toISOString();
      }

      await this.mailingService.sendAppointmentInvitation(user.email, {
        fullname:
          [user.firstName, user.lastName].filter(Boolean).join(' ') ||
          user.email,
        title: appointment.title,
        startFormatted,
        practitionerName,
        consultationTypeLabel: 'Video consultation',
        joinUrl,
        rescheduled: false,
      });

      this.logger.log(
        `Fresh consultation link resent to ${user.email} for appointment ${appointment._id}`,
      );

      return { status: 200, message: 'INVITE_LINK_RESENT' };
    } catch (error) {
      this.logger.error('Error resending appointment invite', error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR' };
    }
  }
}
