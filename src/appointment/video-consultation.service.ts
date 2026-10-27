import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';
import { Types } from 'mongoose';
import { ERole, EMeetingStatus } from '../common';
import { IBaseRes } from '../common/responses.dto';
import { UserRepository } from '../user/user.repository';
import { AppointmentRepository } from './appointment.repository';
import { Appointment } from './entities/appointment.entity';

export type VideoActor = {
  id?: string;
  role?: ERole;
  officeId?: { toString(): string } | string;
};

export interface ConsultationTokenRes extends IBaseRes {
  token?: string;
  serverUrl?: string;
  roomName?: string;
  appointment?: Appointment | null;
  participantName?: string;
  isHost?: boolean;
}

@Injectable()
export class VideoConsultationService {
  private readonly logger = new Logger(VideoConsultationService.name);

  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates a secure, time-bound LiveKit JWT token for the appointment consultation room.
   */
  async getConsultationToken(
    appointmentId: string,
    actor: VideoActor,
  ): Promise<ConsultationTokenRes> {
    try {
      if (
        !Types.ObjectId.isValid(appointmentId) ||
        !actor?.id ||
        !Types.ObjectId.isValid(actor.id)
      ) {
        return { status: 400, message: 'INVALID_PARAMETERS' };
      }

      const actorId = actor.id.toString();
      const actorObjectId = new Types.ObjectId(actorId);

      // Directly find non-deleted appointment with video enabled where actor is either attendee (userId) or assigned staff (adminId)
      const appointment = await this.appointmentRepository.findOne({
        _id: new Types.ObjectId(appointmentId),
        withVideo: true,
        isDeleted: false,
        $or: [{ userId: actorObjectId }, { adminId: actorObjectId }],
      });

      if (!appointment) {
        return {
          status: 404,
          message: 'APPOINTMENT_NOT_FOUND_OR_UNAUTHORIZED',
        };
      }

      // Enforce: room only opens starting 15 minutes before start time and closes 15 minutes after end time
      const now = new Date();
      const opensAt = new Date(
        new Date(appointment.start).getTime() - 15 * 60 * 1000,
      );
      const closesAt = new Date(
        new Date(appointment.end).getTime() + 15 * 60 * 1000,
      );

      if (now < opensAt) {
        return {
          status: 403,
          message: 'CONSULTATION_ROOM_NOT_OPEN_YET',
        };
      }

      if (now > closesAt) {
        return {
          status: 403,
          message: 'CONSULTATION_ROOM_CLOSED',
        };
      }

      // Determine or assign room name
      let roomName = appointment.meetingRoom;
      if (!roomName) {
        roomName = `consultation_${appointment._id.toString()}`;
        await this.appointmentRepository.findOneAndUpdate(
          { _id: appointment._id },
          { meetingRoom: roomName },
        );
      }

      // Resolve display name for the participant
      let participantName = 'Participant';
      if (actorId && Types.ObjectId.isValid(actorId)) {
        try {
          const userDoc = await this.userRepository.findOne({
            _id: new Types.ObjectId(actorId),
          });
          if (userDoc) {
            const nameParts = [userDoc.firstName, userDoc.lastName].filter(
              Boolean,
            );
            if (nameParts.length > 0) {
              participantName = nameParts.join(' ');
            } else if (userDoc.email) {
              participantName = userDoc.email.split('@')[0];
            }
          }
        } catch (e: any) {
          this.logger.warn(
            `Could not resolve user name for ${actorId}: ${e.message}`,
          );
        }
      }

      const livekitApiKey =
        this.configService.get<string>('LIVEKIT_API_KEY') ||
        process.env.LIVEKIT_API_KEY ||
        'devkey';
      const livekitApiSecret =
        this.configService.get<string>('LIVEKIT_API_SECRET') ||
        process.env.LIVEKIT_API_SECRET ||
        'secret';
      const livekitUrl =
        this.configService.get<string>('LIVEKIT_URL') ||
        process.env.LIVEKIT_URL ||
        'wss://therapy-consultation.livekit.cloud';

      const identity = actorId || `user_${Date.now()}`;

      // Create LiveKit Access Token
      const at = new AccessToken(livekitApiKey, livekitApiSecret, {
        identity,
        name: participantName,
        ttl: '3h', // 3 hours validity
      });

      // Add permissions: anyone with token can join and stream mic/cam
      at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      const token = await at.toJwt();

      return {
        status: 200,
        message: 'TOKEN_GENERATED_SUCCESSFULLY',
        token,
        serverUrl: livekitUrl,
        roomName,
        appointment,
        participantName,
      };
    } catch (error) {
      this.logger.error('Error generating consultation token', error);
      return {
        status: 500,
        message: 'FAILED_TO_GENERATE_CONSULTATION_TOKEN',
      };
    }
  }

  /**
   * Update consultation session status (e.g. in_progress, completed).
   * Only the assigned doctor / staff (adminId) is allowed to update status.
   */
  async updateConsultationStatus(
    appointmentId: string,
    status: EMeetingStatus,
    actor: VideoActor,
  ): Promise<IBaseRes> {
    try {
      if (
        !Types.ObjectId.isValid(appointmentId) ||
        !actor?.id ||
        !Types.ObjectId.isValid(actor.id)
      ) {
        return { status: 400, message: 'INVALID_PARAMETERS' };
      }

      // Directly update appointment where _id matches and actor is the assigned adminId
      const updated = await this.appointmentRepository.findOneAndUpdate(
        {
          _id: new Types.ObjectId(appointmentId),
          adminId: new Types.ObjectId(actor.id),
          isDeleted: false,
        },
        { meetingStatus: status },
      );

      if (!updated) {
        return { status: 404, message: 'APPOINTMENT_NOT_FOUND_OR_FORBIDDEN' };
      }

      return { status: 200, message: 'STATUS_UPDATED_SUCCESSFULLY' };
    } catch (error) {
      this.logger.error('Error updating consultation status', error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR' };
    }
  }
}
