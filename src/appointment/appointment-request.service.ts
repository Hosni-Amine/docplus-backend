import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import {
  EConsultationType,
  EOfficeStaffRole,
  EOfficeStatus,
  ERole,
  EUserStatus,
  doctorDisplayName,
} from '../common';
import { buildFrontendUrl } from '../common';
import { IBaseRes } from '../common/responses.dto';
import type { Office } from '../office/entities/office.entity';
import { ChatGateway } from '../chat/chat.gateway';
import { MailingService } from '../mailing/mailing.service';
import { UserRepository } from '../user/user.repository';
import { OfficeRepository } from '../office/office.repository';
import { AppointmentRepository } from './appointment.repository';
import { AppointmentRequestRepository } from './appointment-request.repository';
import { CreatePublicAppointmentRequestInput } from './dto/create-public-appointment-request.input';
import { EAppointmentRequestStatus } from './entities/appointment-request.entity';
import { MarkAppointmentRequestsReadInput } from './dto/mark-appointment-requests-read.input';

type OfficeActor = {
  id?: string;
  officeId?: { toString(): string } | string;
};

export type PendingAppointmentRequestItem = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  start: Date;
  consultationType: EConsultationType;
  adminId: string;
  status: EAppointmentRequestStatus;
  seen: boolean;
  createdAt?: Date;
};

export interface CreatePublicAppointmentRequestRes extends IBaseRes {
  available: boolean;
}

@Injectable()
export class AppointmentRequestService {
  private readonly logger = new Logger(AppointmentRequestService.name);
  /** Provisional slot length for availability check; doctor confirms the final time. */
  private readonly slotDurationMinutes = 30;

  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly requestRepository: AppointmentRequestRepository,
    private readonly userRepository: UserRepository,
    private readonly officeRepository: OfficeRepository,
    private readonly mailingService: MailingService,
    private readonly configService: ConfigService,
    private readonly chatGateway: ChatGateway,
  ) {}

  private consultationTypeLabel(type: EConsultationType): string {
    switch (type) {
      case EConsultationType.IN_OFFICE:
        return 'In office consultation';
      case EConsultationType.VIDEO:
        return 'Video consultation';
      case EConsultationType.PHONE:
        return 'Phone consultation';
      case EConsultationType.HOME_VISIT:
        return 'Home visit';
      default:
        return 'In office consultation';
    }
  }

  private formatOfficeAddress(office: Office): string | undefined {
    const parts = [
      office.address,
      [office.zipCode, office.city].filter(Boolean).join(' '),
      office.country,
    ]
      .map((p) => p?.trim())
      .filter(Boolean);
    return parts.length
      ? parts.join(', ')
      : office.address?.trim() || undefined;
  }

  private buildRequestLocationContext(
    consultationType: EConsultationType,
    office: Office,
    patientPhone: string,
  ): {
    address: string;
    phone: string;
    locationPhrase: string;
  } {
    const address = this.formatOfficeAddress(office) ?? '';
    const officePhone = office.phone?.trim() ?? '';
    const trimmedPatientPhone = patientPhone.trim();

    switch (consultationType) {
      case EConsultationType.IN_OFFICE:
        return {
          address,
          phone: officePhone,
          locationPhrase: address ? `at ${address}` : 'at the office',
        };
      case EConsultationType.HOME_VISIT:
        return {
          address: '',
          phone: officePhone,
          locationPhrase: 'at home (address to be confirmed with the patient)',
        };
      case EConsultationType.PHONE:
        return {
          address: '',
          phone: trimmedPatientPhone || officePhone,
          locationPhrase: trimmedPatientPhone
            ? `by phone (${trimmedPatientPhone})`
            : 'by phone',
        };
      case EConsultationType.VIDEO:
        return {
          address: '',
          phone: officePhone,
          locationPhrase: 'via video consultation',
        };
      default:
        return {
          address,
          phone: officePhone,
          locationPhrase: address ? `at ${address}` : 'at the office',
        };
    }
  }

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

  /** Public, privacy-preserving slot check followed by creation of a pending request. */
  async createRequest(
    input: CreatePublicAppointmentRequestInput,
  ): Promise<CreatePublicAppointmentRequestRes> {
    try {
      const startDate = new Date(input.start);
      if (isNaN(startDate.getTime())) {
        return {
          status: 400,
          message: 'INVALID_APPOINTMENT_SLOT',
          available: false,
        };
      }

      const endDate = new Date(
        startDate.getTime() + this.slotDurationMinutes * 60_000,
      );

      const doctor = await this.userRepository.findOne({
        _id: input.adminId,
        role: ERole.ADMIN,
        officeStaffRole: EOfficeStaffRole.DOCTOR,
        status: EUserStatus.ACTIVE,
        isPublic: true,
      });
      if (!doctor?.officeId) {
        return {
          status: 404,
          message: 'PRACTITIONER_NOT_FOUND',
          available: false,
        };
      }

      const office = await this.officeRepository.findOne({
        _id: doctor.officeId,
        status: EOfficeStatus.ACTIVE,
      });
      if (!office) {
        return {
          status: 404,
          message: 'PRACTITIONER_NOT_FOUND',
          available: false,
        };
      }

      // Check practitioner conflict
      const adminId = new Types.ObjectId(input.adminId);
      const conflict = await this.appointmentRepository.findOne({
        adminId,
        isDeleted: false,
        start: { $lt: endDate },
        end: { $gt: startDate },
      });
      if (conflict) {
        return {
          status: 409,
          message: 'PRACTITIONER_NOT_AVAILABLE',
          available: false,
        };
      }

      const email = input.email.trim().toLowerCase();
      const phone = input.phone.trim();

      const pendingMatches = await this.requestRepository.findPendingForContact(
        adminId,
        email,
        phone,
      );
      const sameSlot = pendingMatches.some(
        (row) => new Date(row.start).getTime() === startDate.getTime(),
      );
      if (sameSlot) {
        return {
          status: 200,
          message: 'APPOINTMENT_REQUEST_ALREADY_SUBMITTED',
          available: true,
        };
      }

      const recentRequests = await this.requestRepository.countRecentForEmail(
        email,
        new Date(Date.now() - 60 * 60 * 1000),
      );
      if (recentRequests >= 5) {
        return {
          status: 429,
          message: 'APPOINTMENT_REQUEST_RATE_LIMITED',
          available: true,
        };
      }

      if (pendingMatches.length > 0) {
        await this.requestRepository.deletePendingForContact(
          adminId,
          email,
          phone,
        );
      }

      const consultationType = input.consultationType;
      const consultationTypeLabel =
        this.consultationTypeLabel(consultationType);

      const request = await this.requestRepository.create({
        adminId,
        officeId: office._id,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email,
        phone,
        start: startDate,
        end: endDate,
        consultationType,
        status: EAppointmentRequestStatus.PENDING,
      });

      this.chatGateway.emitToOffice(
        office._id.toString(),
        'appointment-request:new',
      );

      const doctorName = doctorDisplayName(doctor.firstName, doctor.lastName);
      const patientName = `${input.firstName.trim()} ${input.lastName.trim()}`;
      const startFormatted = this.formatAppointmentDate(startDate);
      const reference = request._id.toString();
      const locationContext = this.buildRequestLocationContext(
        consultationType,
        office,
        phone,
      );
      const calendarUrl =
        buildFrontendUrl(
          this.configService.get<string>('FRONTEND_URL'),
          '/dashboard/calendar',
        ) || '';

      if (doctor.email) {
        await this.mailingService.sendPublicAppointmentRequestDoctorNotification(
          doctor.email,
          {
            fullname: doctorName,
            title: `Appointment request — ${patientName}`,
            patientName,
            attendeeName: patientName,
            otherPartyName: patientName,
            patientEmail: email,
            patientPhone: phone,
            startFormatted,
            reference,
            consultationTypeLabel,
            locationPhrase: locationContext.locationPhrase,
            address: locationContext.address,
            phone: locationContext.phone,
            calendarUrl,
          },
        );
      }

      await this.mailingService.sendPublicAppointmentRequestPatientConfirmation(
        email,
        {
          fullname: patientName,
          title: doctorName
            ? `Appointment request with ${doctorName}`
            : 'Appointment request',
          practitionerName: doctorName,
          otherPartyName: doctorName,
          startFormatted,
          reference,
          consultationTypeLabel,
          locationPhrase: locationContext.locationPhrase,
          address: locationContext.address,
          phone: locationContext.phone,
        },
      );

      return {
        status: 201,
        message: 'APPOINTMENT_REQUEST_CREATED_SUCCESSFULLY',
        available: true,
      };
    } catch (error) {
      if ((error as { code?: number })?.code === 11000) {
        return {
          status: 200,
          message: 'APPOINTMENT_REQUEST_PENDING_WITH_DOCTOR',
          available: true,
        };
      }
      this.logger.error(
        'Failed to create public appointment request',
        error instanceof Error ? error.stack : String(error),
      );
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        available: false,
      };
    }
  }

  private actorOfficeId(actor: OfficeActor): Types.ObjectId | null {
    if (!actor.officeId || !actor.id) return null;
    const value = actor.officeId.toString();
    if (!Types.ObjectId.isValid(value) || !Types.ObjectId.isValid(actor.id)) {
      return null;
    }
    return new Types.ObjectId(value);
  }

  async listPendingForOffice(actor: OfficeActor): Promise<{
    status: number;
    message: string;
    requests: PendingAppointmentRequestItem[];
  }> {
    try {
      const officeId = this.actorOfficeId(actor);
      if (!officeId || !actor.id) {
        return { status: 403, message: 'OFFICE_REQUIRED', requests: [] };
      }

      const rows = await this.requestRepository.listPendingForOffice(officeId);

      return {
        status: 200,
        message: 'APPOINTMENT_REQUESTS_FOUND',
        requests: rows.map((row) => ({
          id: row._id.toString(),
          adminId: row.adminId.toString(),
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone,
          start: row.start,
          consultationType: row.consultationType,
          status: row.status,
          seen: (row.seenBy ?? []).some((id) => id.toString() === actor.id),
          createdAt: (row as { created_at?: Date }).created_at,
        })),
      };
    } catch (error) {
      this.logger.error(
        'Failed to list appointment requests',
        error instanceof Error ? error.stack : String(error),
      );
      return {
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
        requests: [],
      };
    }
  }

  async markPendingSeen(
    actor: OfficeActor,
    input: MarkAppointmentRequestsReadInput,
  ): Promise<IBaseRes> {
    try {
      const officeId = this.actorOfficeId(actor);
      if (!officeId || !actor.id) {
        return { status: 403, message: 'OFFICE_REQUIRED' };
      }

      const ids = (input.ids ?? [])
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

      await this.requestRepository.markSeen(
        officeId,
        new Types.ObjectId(actor.id),
        input.ids ? ids : undefined,
      );

      return { status: 200, message: 'APPOINTMENT_REQUESTS_MARKED_READ' };
    } catch (error) {
      this.logger.error(
        'Failed to mark appointment requests read',
        error instanceof Error ? error.stack : String(error),
      );
      return { status: 500, message: 'INTERNAL_SERVER_ERROR' };
    }
  }

  async declinePending(actor: OfficeActor, id: string): Promise<IBaseRes> {
    try {
      const officeId = this.actorOfficeId(actor);
      if (!officeId || !actor.id || !Types.ObjectId.isValid(id)) {
        return { status: 403, message: 'OFFICE_REQUIRED' };
      }

      const updated = await this.requestRepository.declinePending(
        officeId,
        new Types.ObjectId(id),
      );
      if (!updated) {
        return { status: 404, message: 'APPOINTMENT_REQUEST_NOT_FOUND' };
      }

      this.chatGateway.emitToOffice(
        officeId.toString(),
        'appointment-request:updated',
      );

      return { status: 200, message: 'APPOINTMENT_REQUEST_DECLINED' };
    } catch (error) {
      this.logger.error(
        'Failed to decline appointment request',
        error instanceof Error ? error.stack : String(error),
      );
      return { status: 500, message: 'INTERNAL_SERVER_ERROR' };
    }
  }
}
