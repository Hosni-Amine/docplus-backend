import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { buildFrontendUrl, EConsultationType, ERole } from '../common';
import { IBaseRes } from '../common/responses.dto';
import { MailingService } from '../mailing/mailing.service';
import { User } from '../user/entities/user.entity';
import { UserRepository } from '../user/user.repository';
import { OfficeRepository } from '../office/office.repository';
import { CreateAppointmentInput } from './dto/create-appointment.input';
import { UpdateAppointmentInput } from './dto/update-appointment.input';
import { Appointment } from './entities/appointment.entity';
import { AppointmentInviteService } from './appointment-invite.service';
import { AppointmentRepository } from './appointment.repository';

type Actor = {
  id?: string;
  role?: ERole;
  officeId?: { toString(): string } | string;
};

export interface GetAppointmentRes extends IBaseRes {
  appointment: Appointment | null;
}

export interface GetAppointmentsRes extends IBaseRes {
  appointments: Appointment[];
}

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly userRepository: UserRepository,
    private readonly officeRepository: OfficeRepository,
    private readonly inviteService: AppointmentInviteService,
    private readonly mailingService: MailingService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create an appointment for a user (role USER) in the actor's office.
   */
  async createAppointment(
    input: CreateAppointmentInput,
    actor: Actor,
  ): Promise<GetAppointmentRes> {
    try {
      if (!actor.officeId) {
        return { status: 403, message: 'OFFICE_REQUIRED', appointment: null };
      }

      const officeId = actor.officeId.toString();
      const dateError = this.getDateError(input.start, input.end);
      if (dateError) {
        return { status: 400, message: dateError, appointment: null };
      }

      const appointment = await this.appointmentRepository.create({
        title: input.title,
        description: input.description,
        color: input.color,
        allDay: input.allDay ?? false,
        start: new Date(input.start),
        end: new Date(input.end),
        userId: new Types.ObjectId(input.userId),
        adminId: new Types.ObjectId(input.adminId),
        officeId: new Types.ObjectId(officeId),
        consultationType: input.consultationType,
        isDeleted: false,
      });

      const [attendee, practitioner] = await Promise.all([
        this.userRepository.findOne({ _id: appointment.userId }),
        this.userRepository.findOne({ _id: appointment.adminId }),
      ]);

      if (attendee && practitioner) {
        await this.notifyParticipants(
          appointment,
          attendee,
          practitioner,
          false,
        );
      }

      const populated = await this.appointmentRepository.findOneWithUser({
        _id: appointment._id,
      });

      return {
        status: 201,
        message: 'APPOINTMENT_CREATED_SUCCESSFULLY',
        appointment: (populated ?? appointment) as any,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        appointment: null,
      };
    }
  }

  /**
   * Return non-deleted appointments of the actor's office.
   */
  async getAppointments(actor: Actor): Promise<GetAppointmentsRes> {
    try {
      if (!actor.officeId) {
        return { status: 403, message: 'OFFICE_REQUIRED', appointments: [] };
      }

      const appointments = await this.appointmentRepository.findWithUser({
        officeId: actor.officeId,
        isDeleted: false,
      });
      return {
        status: 200,
        message: 'APPOINTMENTS_FOUND_SUCCESSFULLY',
        appointments: appointments as any,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        appointments: [],
      };
    }
  }

  /**
   * Return one appointment when it belongs to the actor's office.
   */
  async getAppointmentById(
    id: string,
    actor: Actor,
  ): Promise<GetAppointmentRes> {
    try {
      const appointment = await this.appointmentRepository.findOneWithUser({
        _id: id,
        isDeleted: false,
      });
      if (!appointment) {
        return {
          status: 404,
          message: 'APPOINTMENT_NOT_FOUND',
          appointment: null,
        };
      }
      if (!this.canAccess(actor, appointment.officeId.toString())) {
        return { status: 403, message: 'FORBIDDEN', appointment: null };
      }
      return {
        status: 200,
        message: 'APPOINTMENT_FOUND_SUCCESSFULLY',
        appointment: appointment as any,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        appointment: null,
      };
    }
  }

  /**
   * Update an appointment in the actor's office.
   */
  async updateAppointment(
    input: UpdateAppointmentInput,
    actor: Actor,
  ): Promise<GetAppointmentRes> {
    try {
      const existing = await this.appointmentRepository.findOne({
        _id: input.id,
        isDeleted: false,
      });
      if (!existing) {
        return {
          status: 404,
          message: 'APPOINTMENT_NOT_FOUND',
          appointment: null,
        };
      }
      if (!this.canAccess(actor, existing.officeId.toString())) {
        return { status: 403, message: 'FORBIDDEN', appointment: null };
      }

      const start = input.start ?? existing.start.toISOString();
      const end = input.end ?? existing.end.toISOString();
      const dateError = this.getDateError(start, end);
      if (dateError) {
        return { status: 400, message: dateError, appointment: null };
      }

      const {
        id,
        userId,
        adminId,
        start: startInput,
        end: endInput,
        consultationType,
        ...rest
      } = input;
      const updates: Record<string, unknown> = { ...rest };
      if (userId) {
        updates.userId = new Types.ObjectId(userId);
      }
      if (adminId) {
        updates.adminId = new Types.ObjectId(adminId);
      }
      if (startInput) {
        updates.start = new Date(startInput);
      }
      if (endInput) {
        updates.end = new Date(endInput);
      }
      if (consultationType !== undefined) {
        updates.consultationType = consultationType;
      }

      const appointment = await this.appointmentRepository.findOneAndUpdate(
        { _id: id },
        updates,
      );

      if (appointment) {
        const rescheduled =
          (updates.start instanceof Date &&
            updates.start.getTime() !== new Date(existing.start).getTime()) ||
          (updates.end instanceof Date &&
            updates.end.getTime() !== new Date(existing.end).getTime());

        const [attendee, practitioner] = await Promise.all([
          this.userRepository.findOne({ _id: appointment.userId }),
          this.userRepository.findOne({ _id: appointment.adminId }),
        ]);

        if (attendee && practitioner) {
          await this.notifyParticipants(
            appointment,
            attendee,
            practitioner,
            rescheduled,
          );
        }
      }

      const populated = await this.appointmentRepository.findOneWithUser({
        _id: id,
      });

      return {
        status: 200,
        message: 'APPOINTMENT_UPDATED_SUCCESSFULLY',
        appointment: (populated ?? appointment ?? null) as any,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        appointment: null,
      };
    }
  }

  /**
   * Soft-delete an appointment. The record stays.
   */
  async deleteAppointment(id: string, actor: Actor): Promise<IBaseRes> {
    try {
      const existing = await this.appointmentRepository.findOne({
        _id: id,
        isDeleted: false,
      });
      if (!existing) {
        return { status: 404, message: 'APPOINTMENT_NOT_FOUND' };
      }
      if (!this.canAccess(actor, existing.officeId.toString())) {
        return { status: 403, message: 'FORBIDDEN' };
      }

      await this.appointmentRepository.findOneAndUpdate(
        { _id: id },
        { isDeleted: true },
      );
      return { status: 200, message: 'APPOINTMENT_DELETED_SUCCESSFULLY' };
    } catch (error) {
      this.logger.error(error);
      return { status: 500, message: 'INTERNAL_SERVER_ERROR' };
    }
  }

  /**
   * Send appointment confirmation/reschedule emails to both the attendee and the practitioner.
   */
  private async notifyParticipants(
    appointment: Appointment,
    attendee: User,
    practitioner: User,
    rescheduled: boolean,
  ): Promise<void> {
    try {
      const startFormatted = this.formatAppointmentDate(appointment.start);
      const practitionerName =
        [practitioner.firstName, practitioner.lastName]
          .filter(Boolean)
          .join(' ') || practitioner.email;
      const attendeeName =
        [attendee.firstName, attendee.lastName].filter(Boolean).join(' ') ||
        attendee.email;

      let address: string | undefined;
      let phone: string | undefined;
      let consultationTypeLabel: string | undefined;
      let locationPhrase: string | undefined;
      let attendeeJoinUrl: string | undefined;
      let adminJoinUrl: string | undefined;

      switch (appointment.consultationType) {
        case EConsultationType.IN_OFFICE: {
          consultationTypeLabel = 'In office consultation';
          const office = await this.officeRepository.findOne({
            _id: appointment.officeId,
          });
          if (office) {
            const parts = [
              office.address,
              [office.zipCode, office.city].filter(Boolean).join(' '),
              office.country,
            ]
              .map((p) => p?.trim())
              .filter(Boolean);
            address = parts.join(', ') || office.address?.trim() || undefined;
          }
          locationPhrase = address ? `at ${address}` : 'at the office';
          break;
        }
        case EConsultationType.HOME_VISIT: {
          consultationTypeLabel = 'Home visit';
          const parts = [
            attendee.address,
            [attendee.zipCode, attendee.city].filter(Boolean).join(' '),
            attendee.country,
          ]
            .map((p) => p?.trim())
            .filter(Boolean);
          address = parts.join(', ') || attendee.address?.trim() || undefined;
          locationPhrase = address ? `at ${address}` : 'at home';
          break;
        }
        case EConsultationType.PHONE: {
          consultationTypeLabel = 'Phone consultation';
          const office = await this.officeRepository.findOne({
            _id: appointment.officeId,
          });
          const rawPhone =
            attendee.phone?.trim() ||
            practitioner.phone?.trim() ||
            office?.phone?.trim();
          phone = rawPhone || undefined;
          locationPhrase = phone ? `by phone (${phone})` : 'by phone';
          break;
        }
        case EConsultationType.VIDEO: {
          consultationTypeLabel = 'Video consultation';
          locationPhrase = 'via video consultation';
          if (attendee.email) {
            const inviteToken = await this.inviteService.sign({
              appointmentId: appointment._id.toString(),
              userId: attendee._id.toString(),
              email: attendee.email,
              end: appointment.end,
            });
            attendeeJoinUrl = this.inviteService.buildJoinLink(
              appointment._id.toString(),
              inviteToken,
            );
          }
          adminJoinUrl = buildFrontendUrl(
            this.configService.get<string>('FRONTEND_URL'),
            `/dashboard/consultation/${appointment._id.toString()}`,
          );
          break;
        }
        default:
          break;
      }

      // Notify attendee
      if (attendee.email) {
        await this.mailingService.sendAppointmentInvitation(attendee.email, {
          fullname: attendeeName,
          title: appointment.title,
          startFormatted,
          otherPartyName: practitionerName,
          locationPhrase,
          practitionerName,
          consultationTypeLabel,
          address,
          phone,
          joinUrl: attendeeJoinUrl,
          rescheduled,
        });
      }

      // Notify practitioner/admin
      if (practitioner.email) {
        await this.mailingService.sendAppointmentInvitation(
          practitioner.email,
          {
            fullname: practitionerName,
            title: appointment.title,
            startFormatted,
            otherPartyName: attendeeName,
            locationPhrase,
            attendeeName,
            consultationTypeLabel,
            address,
            phone,
            joinUrl: adminJoinUrl,
            rescheduled,
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to notify appointment participants', error);
    }
  }

  /** Human-readable appointment date for emails (Day before Month in English). */
  private formatAppointmentDate(date: Date): string {
    const timeZone =
      this.configService.get<string>('APP_TIMEZONE') || 'Europe/Paris';
    try {
      return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone,
      }).format(new Date(date));
    } catch {
      return new Date(date).toISOString();
    }
  }

  private getDateError(
    start: string | Date,
    end: string | Date,
  ): string | null {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return 'INVALID_DATE';
    }
    if (endDate < startDate) {
      return 'END_BEFORE_START';
    }
    return null;
  }

  private canAccess(actor: Actor, officeId: string): boolean {
    if (actor.role === ERole.SUPER_ADMIN) {
      return true;
    }
    return actor.officeId?.toString() === officeId;
  }
}
