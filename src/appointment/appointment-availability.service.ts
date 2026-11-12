import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  EOfficeStaffRole,
  EOfficeStatus,
  ERole,
  EUserStatus,
  getZonedParts,
  resolveTimeZone,
  wallTimeToUtc,
  WEEKDAY_KEYS,
} from '../common';
import { parseHm, formatHm } from '../common/timezone.util';
import type { Office } from '../office/entities/office.entity';
import { OfficeRepository } from '../office/office.repository';
import type { User } from '../user/entities/user.entity';
import { UserRepository } from '../user/user.repository';
import { AppointmentRepository } from './appointment.repository';

const SLOT_DURATION_MS = 30 * 60_000;
const DEFAULT_OPEN = '09:00';
const DEFAULT_CLOSE = '17:00';

export type AvailabilityInterval = {
  start: string;
  end: string;
};

export type AvailabilitySlot = AvailabilityInterval & {
  time: string;
};

export type AvailabilityDay = {
  date: string;
  periods: AvailabilityInterval[];
  slots: AvailabilitySlot[];
};

export type AppointmentAvailabilityResponse = {
  status: number;
  message: string;
  timezone?: string;
  slotDurationMinutes: number;
  days: AvailabilityDay[];
};

export type AppointmentAvailabilityCheck = {
  available: boolean;
  status: number;
  message: string;
  doctor?: User;
  office?: Office;
};

type DayHours = { start: string; end: string };

@Injectable()
export class AppointmentAvailabilityService {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly userRepository: UserRepository,
    private readonly officeRepository: OfficeRepository,
  ) {}

  async getMonthAvailability(input: {
    adminId: string;
    month: string;
    officeId?: string;
    publicOnly?: boolean;
    excludeAppointmentId?: string;
  }): Promise<AppointmentAvailabilityResponse> {
    const context = await this.getDoctorContext(input);
    if (!context.doctor || !context.office) {
      return {
        status: context.status,
        message: context.message,
        slotDurationMinutes: SLOT_DURATION_MS / 60_000,
        days: [],
      };
    }

    const monthMatch = /^(\d{4})-(\d{2})$/.exec(input.month);
    if (!monthMatch) {
      return {
        status: 400,
        message: 'INVALID_AVAILABILITY_MONTH',
        slotDurationMinutes: SLOT_DURATION_MS / 60_000,
        days: [],
      };
    }

    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    const timeZone = resolveTimeZone(context.office.timezone);
    const monthStart = wallTimeToUtc(year, month, 1, 0, 0, timeZone);
    const nextMonthDate = new Date(Date.UTC(year, month, 1));
    const monthEnd = wallTimeToUtc(
      nextMonthDate.getUTCFullYear(),
      nextMonthDate.getUTCMonth() + 1,
      1,
      0,
      0,
      timeZone,
    );

    const currentAppointment =
      input.officeId && input.excludeAppointmentId && Types.ObjectId.isValid(input.excludeAppointmentId)
        ? await this.appointmentRepository.findOne({
            _id: new Types.ObjectId(input.excludeAppointmentId),
            adminId: context.doctor._id,
            officeId: new Types.ObjectId(input.officeId),
            isDeleted: false,
          })
        : null;
    const busyRanges = await this.appointmentRepository.findBusyRanges(
      new Types.ObjectId(context.doctor._id.toString()),
      monthStart,
      monthEnd,
      currentAppointment?._id,
    );
    const busy = busyRanges.map((range) => ({
      start: new Date(range.start).getTime(),
      end: new Date(range.end).getTime(),
    }));
    const now = Date.now();
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const days: AvailabilityDay[] = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
      const weekdayIndex = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
      const dayHours = this.getDayHours(context.office, WEEKDAY_KEYS[weekdayIndex]);
      if (!dayHours) continue;

      const open = parseHm(dayHours.start);
      const close = parseHm(dayHours.end);
      if (!open || !close) continue;

      const dayStart = wallTimeToUtc(
        year,
        month,
        day,
        open.hour,
        open.minute,
        timeZone,
      );
      const dayEnd = wallTimeToUtc(
        year,
        month,
        day,
        close.hour,
        close.minute,
        timeZone,
      );
      const dayStartMs = dayStart.getTime();
      const dayEndMs = dayEnd.getTime();
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayBusy = busy
        .filter((range) => range.start < dayEndMs && range.end > dayStartMs)
        .sort((a, b) => a.start - b.start);

      const periods = this.subtractBusyRanges(
        dayStartMs,
        dayEndMs,
        dayBusy,
        now,
      );
      const slots: AvailabilitySlot[] = [];

      for (
        let slotStart = dayStartMs;
        slotStart + SLOT_DURATION_MS <= dayEndMs;
        slotStart += SLOT_DURATION_MS
      ) {
        const slotEnd = slotStart + SLOT_DURATION_MS;
        if (slotStart < now) continue;
        if (dayBusy.some((range) => range.start < slotEnd && range.end > slotStart)) continue;

        const parts = getZonedParts(new Date(slotStart), timeZone);
        slots.push({
          start: new Date(slotStart).toISOString(),
          end: new Date(slotEnd).toISOString(),
          time: formatHm(parts.hour, parts.minute),
        });
      }

      if (periods.length || slots.length) {
        days.push({ date, periods, slots });
      }
    }

    return {
      status: 200,
      message: 'APPOINTMENT_AVAILABILITY_FOUND',
      timezone: timeZone,
      slotDurationMinutes: SLOT_DURATION_MS / 60_000,
      days,
    };
  }

  async checkSlot(input: {
    adminId: string;
    start: Date;
    end: Date;
    officeId?: string;
    publicOnly?: boolean;
    allDay?: boolean;
    excludeAppointmentId?: string;
  }): Promise<AppointmentAvailabilityCheck> {
    const { start, end } = input;
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end.getTime() <= start.getTime()
    ) {
      return {
        available: false,
        status: 400,
        message: 'INVALID_APPOINTMENT_SLOT',
      };
    }
    if (input.publicOnly && start.getTime() <= Date.now()) {
      return {
        available: false,
        status: 400,
        message: 'APPOINTMENT_SLOT_IN_PAST',
      };
    }

    const context = await this.getDoctorContext(input);
    if (!context.doctor || !context.office) {
      return {
        available: false,
        status: context.status,
        message: context.message,
      };
    }

    if (!input.allDay && !this.isWithinOfficeHours(start, end, context.office)) {
      return {
        available: false,
        status: 400,
        message: 'APPOINTMENT_OUTSIDE_WORKING_HOURS',
        doctor: context.doctor,
        office: context.office,
      };
    }

    const conflict = await this.appointmentRepository.findOne({
      adminId: new Types.ObjectId(input.adminId),
      isDeleted: false,
      start: { $lt: end },
      end: { $gt: start },
      ...(input.excludeAppointmentId
        ? { _id: { $ne: new Types.ObjectId(input.excludeAppointmentId) } }
        : {}),
    });
    if (conflict) {
      return {
        available: false,
        status: 409,
        message: 'PRACTITIONER_NOT_AVAILABLE',
        doctor: context.doctor,
        office: context.office,
      };
    }

    return {
      available: true,
      status: 200,
      message: 'APPOINTMENT_SLOT_AVAILABLE',
      doctor: context.doctor,
      office: context.office,
    };
  }

  private async getDoctorContext(input: {
    adminId: string;
    officeId?: string;
    publicOnly?: boolean;
  }): Promise<AppointmentAvailabilityCheck> {
    if (input.officeId && !Types.ObjectId.isValid(input.officeId)) {
      return { available: false, status: 403, message: 'OFFICE_REQUIRED' };
    }

    const doctor = await this.userRepository.findOne({
      _id: input.adminId,
      role: ERole.ADMIN,
      officeStaffRole: EOfficeStaffRole.DOCTOR,
      status: EUserStatus.ACTIVE,
      ...(input.publicOnly ? { isPublic: true } : {}),
      ...(input.officeId
        ? { officeId: new Types.ObjectId(input.officeId) }
        : {}),
    });
    if (!doctor?.officeId) {
      return {
        available: false,
        status: input.publicOnly ? 404 : 400,
        message: input.publicOnly
          ? 'PRACTITIONER_NOT_FOUND'
          : 'PRACTITIONER_MUST_BE_DOCTOR',
      };
    }

    const office = await this.officeRepository.findOne({
      _id: doctor.officeId,
      status: EOfficeStatus.ACTIVE,
    });
    if (!office) {
      return {
        available: false,
        status: 404,
        message: 'PRACTITIONER_NOT_FOUND',
      };
    }

    return { available: true, status: 200, message: 'OK', doctor, office };
  }

  private getDayHours(office: Office, weekday: (typeof WEEKDAY_KEYS)[number]): DayHours | null {
    if (office.workingHours == null) {
      return { start: DEFAULT_OPEN, end: DEFAULT_CLOSE };
    }

    const hours = office.workingHours[weekday];
    if (!hours?.enabled) return null;
    return { start: hours.start, end: hours.end };
  }

  private isWithinOfficeHours(start: Date, end: Date, office: Office): boolean {
    const timeZone = resolveTimeZone(office.timezone);
    const startParts = getZonedParts(start, timeZone);
    const endParts = getZonedParts(end, timeZone);
    if (startParts.dateKey !== endParts.dateKey) return false;

    const dayHours = this.getDayHours(office, startParts.weekdayKey);
    if (!dayHours) return false;
    const open = parseHm(dayHours.start);
    const close = parseHm(dayHours.end);
    if (!open || !close) return false;

    const startMinutes = startParts.hour * 60 + startParts.minute;
    const endMinutes = endParts.hour * 60 + endParts.minute;
    const openMinutes = open.hour * 60 + open.minute;
    const closeMinutes = close.hour * 60 + close.minute;
    return (
      startMinutes >= openMinutes &&
      startMinutes < closeMinutes &&
      endMinutes > startMinutes &&
      endMinutes <= closeMinutes
    );
  }

  private subtractBusyRanges(
    start: number,
    end: number,
    busyRanges: Array<{ start: number; end: number }>,
    notBefore?: number,
  ): AvailabilityInterval[] {
    const periods: AvailabilityInterval[] = [];
    let cursor = Math.max(start, notBefore ?? start);

    for (const busy of busyRanges) {
      const busyStart = Math.max(start, busy.start);
      const busyEnd = Math.min(end, busy.end);
      if (busyEnd <= cursor) continue;
      if (busyStart > cursor) {
        periods.push({
          start: new Date(cursor).toISOString(),
          end: new Date(busyStart).toISOString(),
        });
      }
      cursor = Math.max(cursor, busyEnd);
      if (cursor >= end) break;
    }

    if (cursor < end) {
      periods.push({
        start: new Date(cursor).toISOString(),
        end: new Date(end).toISOString(),
      });
    }

    return periods;
  }
}
