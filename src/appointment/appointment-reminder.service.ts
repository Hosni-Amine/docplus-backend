import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import {
  EConsultationType,
  EUserStatus,
  getZonedParts,
  resolveTimeZone,
  wallTimeToUtc,
  zonedDayRange,
} from '../common';
import { MailingService } from '../mailing/mailing.service';
import { OfficeRepository } from '../office/office.repository';
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

  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly officeRepository: OfficeRepository,
    private readonly mailingService: MailingService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Every 2 hours: email the attendee (user only) about each appointment
   * scheduled for tomorrow (office timezone). Once per appointment.
   */
  @Cron('0 */2 * * *')
  async sendTomorrowReminders(): Promise<void> {
    const appTimeZone =
      this.configService.get<string>('APP_TIMEZONE') || 'Europe/Paris';
    const now = new Date();

    try {
      // Wide UTC window covering "tomorrow" in any reasonable office timezone.
      const windowStart = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      const windowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const appointments = (await this.appointmentRepository.findWithUser({
        isDeleted: false,
        reminderSentAt: null,
        start: { $gte: windowStart, $lt: windowEnd },
      })) as PopulatedAppointment[];

      if (!appointments.length) {
        return;
      }

      let sentCount = 0;
      for (const appointment of appointments) {
        const sent = await this.remindIfTomorrow(appointment, now, appTimeZone);
        if (sent) {
          sentCount += 1;
        }
      }

      if (sentCount) {
        this.logger.log(
          `Tomorrow reminder cron: emailed ${sentCount} attendee(s)`,
        );
      }
    } catch (error) {
      this.logger.error('Tomorrow appointment reminder cron failed', error);
    }
  }

  private async remindIfTomorrow(
    appointment: PopulatedAppointment,
    now: Date,
    appTimeZone: string,
  ): Promise<boolean> {
    let timeZone = appTimeZone;
    try {
      const office = await this.officeRepository.findOne({
        _id: appointment.officeId,
      });
      timeZone = resolveTimeZone(office?.timezone, appTimeZone);
    } catch {
      // keep app timezone
    }

    const nowParts = getZonedParts(now, timeZone);
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
    const { start: dayStart, end: dayEnd } = zonedDayRange(
      tomorrowParts.year,
      tomorrowParts.month,
      tomorrowParts.day,
      timeZone,
    );

    const startMs = new Date(appointment.start).getTime();
    if (startMs < dayStart.getTime() || startMs >= dayEnd.getTime()) {
      return false;
    }

    const attendee = appointment.user;
    if (
      !attendee?.email ||
      attendee.emailAppointmentReminders === false ||
      attendee.status === EUserStatus.DELETED ||
      attendee.status === EUserStatus.DISABLED
    ) {
      return false;
    }

    // Claim first so concurrent ticks / instances do not double-send.
    const claimed = await this.appointmentRepository.findOneAndUpdate(
      {
        _id: appointment._id,
        isDeleted: false,
        reminderSentAt: null,
      },
      { reminderSentAt: new Date() },
    );
    if (!claimed) {
      return false;
    }

    const practitioner = appointment.admin;
    const ok = await this.mailingService.sendAppointmentInvitation(
      attendee.email,
      {
        fullname: this.displayName(attendee) || attendee.email,
        title: appointment.title || 'Appointment',
        startFormatted: this.formatStart(appointment.start, timeZone),
        otherPartyName: this.displayName(practitioner),
        practitionerName: this.displayName(practitioner),
        consultationTypeLabel: this.consultationLabel(
          appointment.consultationType,
        ),
        reminder: true,
      },
    );

    if (ok) {
      this.logger.log(
        `Tomorrow reminder sent to ${attendee.email} for appointment ${appointment._id}`,
      );
    }
    return ok;
  }

  private displayName(user?: User | null): string {
    if (!user) {
      return '';
    }
    return (
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      user.email ||
      ''
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
        return '';
    }
  }

  private formatStart(date: Date, timeZone: string): string {
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
}
