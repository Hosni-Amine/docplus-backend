import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { ERole, EUserStatus } from '../common';
import { IBaseRes } from '../common/responses.dto';
import { UserRepository } from '../user/user.repository';
import { CreateAppointmentInput } from './dto/create-appointment.input';
import { UpdateAppointmentInput } from './dto/update-appointment.input';
import { Appointment } from './entities/appointment.entity';
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

      const userCheck = await this.resolveAttendeeUser(
        input.userId,
        officeId,
        actor,
      );
      if (userCheck.error) {
        return {
          status: userCheck.status,
          message: userCheck.error,
          appointment: null,
        };
      }

      const appointment = await this.appointmentRepository.create({
        title: input.title,
        description: input.description,
        color: input.color,
        allDay: input.allDay ?? false,
        start: new Date(input.start),
        end: new Date(input.end),
        userId: new Types.ObjectId(input.userId),
        adminId: input.adminId ? new Types.ObjectId(input.adminId) : undefined,
        officeId: new Types.ObjectId(officeId),
        isDeleted: false,
      });

      return {
        status: 201,
        message: 'APPOINTMENT_CREATED_SUCCESSFULLY',
        appointment,
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

      const appointments = await this.appointmentRepository.find({
        officeId: actor.officeId,
        isDeleted: false,
      });
      return {
        status: 200,
        message: 'APPOINTMENTS_FOUND_SUCCESSFULLY',
        appointments,
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
      const appointment = await this.appointmentRepository.findOne({
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
        appointment,
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

      if (input.userId) {
        const userCheck = await this.resolveAttendeeUser(
          input.userId,
          existing.officeId.toString(),
          actor,
        );
        if (userCheck.error) {
          return {
            status: userCheck.status,
            message: userCheck.error,
            appointment: null,
          };
        }
      }

      const {
        id,
        userId,
        adminId,
        start: startInput,
        end: endInput,
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

      const appointment = await this.appointmentRepository.findOneAndUpdate(
        { _id: id },
        updates,
      );
      return {
        status: 200,
        message: 'APPOINTMENT_UPDATED_SUCCESSFULLY',
        appointment: appointment ?? null,
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

  private async resolveAttendeeUser(
    userId: string,
    officeId: string,
    actor: Actor,
  ): Promise<{ status: number; error?: string }> {
    const user = await this.userRepository.findOne({
      _id: userId,
      status: { $ne: EUserStatus.DELETED },
    });
    if (!user) {
      return { status: 404, error: 'USER_NOT_FOUND' };
    }
    if (user.role !== ERole.USER) {
      return { status: 400, error: 'INVALID_USER_ROLE' };
    }
    if (!user.officeId) {
      return { status: 400, error: 'OFFICE_REQUIRED' };
    }
    if (!this.canAccess(actor, user.officeId.toString())) {
      return { status: 403, error: 'FORBIDDEN' };
    }
    if (user.officeId.toString() !== officeId) {
      return { status: 400, error: 'USER_OFFICE_MISMATCH' };
    }
    return { status: 200 };
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
