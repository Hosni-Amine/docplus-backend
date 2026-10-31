import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { Types } from 'mongoose';
import {
  EConsultationType,
  EOfficeStatus,
  ERole,
  EUserStatus,
  buildFrontendUrl,
  formatHm,
  getZonedParts,
  parseHm,
  resolveTimeZone,
  wallTimeToUtc,
  zonedDayRange,
} from '../common';
import { MailingService } from '../mailing/mailing.service';
import { OfficeRepository } from '../office/office.repository';
import { Office } from '../office/entities/office.entity';
import { User } from '../user/entities/user.entity';
import { AppointmentRepository } from './appointment.repository';
import { Appointment } from './entities/appointment.entity';

type PopulatedAppointment = Appointment & {
  user?: User | null;
  admin?: User | null;
};

@Injectable()
export class AppointmentReminderService {
  private readonly logger = new Logger(AppointmentReminderService.name);
  /** Prevents duplicate sends for the same admin on the same local day. */
  private readonly sentKeys = new Set<string>();

  constructor(
    private readonly officeRepository: OfficeRepository,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly mailingService: MailingService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Every hour: for each active office (in its own timezone, 05:00–14:00),
   * if open is in ~1 hour, email each admin their day's appointment table (≥ 1).
   */
  @Cron('0 * * * *')
  async sendDailyAdminReminders(): Promise<void> {
    const appTimeZone =
      this.configService.get<string>('APP_TIMEZONE') || 'Europe/Paris';
    const now = new Date();

    try {
      const offices = await this.officeRepository.find({
        status: EOfficeStatus.ACTIVE,
        workingHours: { $ne: null },
      });

      for (const office of offices) {
        await this.processOffice(office, now, appTimeZone);
      }

      this.pruneSentKeys();
    } catch (error) {
      this.logger.error('Daily appointment reminder cron failed', error);
    }
  }

  private async processOffice(
    office: Office,
    now: Date,
    appTimeZone: string,
  ): Promise<void> {
    const timeZone = resolveTimeZone(office.timezone, appTimeZone);
    const nowParts = getZonedParts(now, timeZone);

    // Reminder window in the office's local timezone.
    if (nowParts.hour < 5 || nowParts.hour > 14) {
      return;
    }

    // Today + tomorrow covers open times near midnight (reminder falls on previous day).
    const noonToday = wallTimeToUtc(
      nowParts.year,
      nowParts.month,
      nowParts.day,
      12,
      0,
      timeZone,
    );
    const tomorrowParts = getZonedParts(
      new Date(noonToday.getTime() + 24 * 60 * 60 * 1000),
      timeZone,
    );

    for (const agendaDay of [nowParts, tomorrowParts]) {
      await this.processOfficeAgendaDay(office, nowParts, agendaDay, timeZone);
    }
  }

  private async processOfficeAgendaDay(
    office: Office,
    nowParts: ReturnType<typeof getZonedParts>,
    agendaDay: ReturnType<typeof getZonedParts>,
    timeZone: string,
  ): Promise<void> {
    const dayHours = office.workingHours?.[agendaDay.weekdayKey];
    if (!dayHours?.enabled) {
      return;
    }

    const open = parseHm(dayHours.start);
    if (!open) {
      return;
    }

    // Reminder = 1 hour before that day's office open (office timezone), same local hour.
    const openUtc = wallTimeToUtc(
      agendaDay.year,
      agendaDay.month,
      agendaDay.day,
      open.hour,
      open.minute,
      timeZone,
    );
    const reminderParts = getZonedParts(
      new Date(openUtc.getTime() - 60 * 60 * 1000),
      timeZone,
    );
    if (
      reminderParts.dateKey !== nowParts.dateKey ||
      reminderParts.hour !== nowParts.hour
    ) {
      return;
    }

    const { start, end } = zonedDayRange(
      agendaDay.year,
      agendaDay.month,
      agendaDay.day,
      timeZone,
    );

    const appointments = (await this.appointmentRepository.findWithUser({
      officeId: office._id,
      isDeleted: false,
      start: { $gte: start, $lt: end },
    })) as PopulatedAppointment[];

    if (!appointments.length) {
      return;
    }

    const byAdmin = new Map<string, PopulatedAppointment[]>();
    for (const appointment of appointments) {
      const adminId = appointment.adminId?.toString();
      if (!adminId) {
        continue;
      }
      const list = byAdmin.get(adminId) ?? [];
      list.push(appointment);
      byAdmin.set(adminId, list);
    }

    const dateFormatted = this.formatDateLabel(start, timeZone);
    const officeOpenTime = formatHm(open.hour, open.minute);
    const officeName = office.legalName?.trim() || undefined;
    const calendarUrl = buildFrontendUrl(
      this.configService.get<string>('FRONTEND_URL'),
      '/dashboard/calendar',
    );

    for (const [adminId, adminAppointments] of byAdmin) {
      if (!adminAppointments.length) {
        continue;
      }

      const sendKey = `${adminId}:${agendaDay.dateKey}`;
      if (this.sentKeys.has(sendKey)) {
        continue;
      }

      const admin =
        adminAppointments[0].admin ||
        ({
          _id: new Types.ObjectId(adminId),
        } as User);

      if (
        admin.role &&
        admin.role !== ERole.ADMIN &&
        admin.role !== ERole.SUPER_ADMIN
      ) {
        continue;
      }
      if (
        admin.status === EUserStatus.DELETED ||
        admin.status === EUserStatus.DISABLED
      ) {
        continue;
      }
      if (!admin.email || admin.emailAppointmentReminders === false) {
        continue;
      }

      const sorted = [...adminAppointments].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
      );

      const fullname =
        [admin.firstName, admin.lastName].filter(Boolean).join(' ') ||
        admin.email;

      const rows = sorted.map((appointment) => ({
        timeRange: this.formatTimeRange(
          appointment.start,
          appointment.end,
          timeZone,
        ),
        title: appointment.title || 'Appointment',
        attendeeName: this.attendeeName(appointment),
        consultationTypeLabel: this.consultationLabel(
          appointment.consultationType,
        ),
      }));

      const sent = await this.mailingService.sendAppointmentDailyReminder(
        admin.email,
        {
          fullname,
          dateFormatted,
          officeOpenTime,
          officeName,
          calendarUrl,
          appointments: rows,
        },
      );

      if (sent) {
        this.sentKeys.add(sendKey);
        this.logger.log(
          `Daily reminder sent to ${admin.email} (${rows.length} appointment(s), office ${office._id}, tz ${timeZone})`,
        );
      }
    }
  }

  private attendeeName(appointment: PopulatedAppointment): string {
    const user = appointment.user;
    if (!user) {
      return '—';
    }
    return (
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      user.email ||
      '—'
    );
  }

  private consultationLabel(type?: EConsultationType): string {
    switch (type) {
      case EConsultationType.IN_OFFICE:
        return 'In office';
      case EConsultationType.VIDEO:
        return 'Video';
      case EConsultationType.PHONE:
        return 'Phone';
      case EConsultationType.HOME_VISIT:
        return 'Home visit';
      default:
        return '—';
    }
  }

  private formatTimeRange(start: Date, end: Date, timeZone: string): string {
    const opts: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone,
    };
    try {
      const startLabel = new Intl.DateTimeFormat('en-GB', opts).format(
        new Date(start),
      );
      const endLabel = new Intl.DateTimeFormat('en-GB', opts).format(
        new Date(end),
      );
      return `${startLabel} – ${endLabel}`;
    } catch {
      return `${new Date(start).toISOString()} – ${new Date(end).toISOString()}`;
    }
  }

  private formatDateLabel(date: Date, timeZone: string): string {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone,
      }).format(date);
    } catch {
      return date.toISOString().slice(0, 10);
    }
  }

  /** Drop send-keys older than ~2 days (multi-timezone safe). */
  private pruneSentKeys(): void {
    const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;
    for (const key of this.sentKeys) {
      const dateKey = key.slice(key.lastIndexOf(':') + 1);
      const [year, month, day] = dateKey.split('-').map(Number);
      if (!year || !month || !day) {
        this.sentKeys.delete(key);
        continue;
      }
      if (Date.UTC(year, month - 1, day) < cutoff) {
        this.sentKeys.delete(key);
      }
    }
  }
}
