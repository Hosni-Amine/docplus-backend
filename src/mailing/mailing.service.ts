import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'node:fs/promises';
import { join } from 'path';
import Handlebars from 'handlebars';
import { buildFrontendUrl } from '../common';

const customHandlebars = Handlebars.create();
export enum MailTemplate {
  WelcomeEmail = 'welcome-email.hbs',
  OtpCodeEmail = 'otp-code-email.hbs',
  AppointmentInvitation = 'appointment-invitation.hbs',
  AppointmentRequestDoctor = 'appointment-request-doctor.hbs',
  AppointmentRequestPatient = 'appointment-request-patient.hbs',
  DemoRequestConfirmation = 'demo-request-confirmation.hbs',
}

@Injectable()
export class MailingService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailingService.name);
  private customHandlebars: typeof Handlebars;

  private readonly defaultHeader = `
<tr>
  <td align="left" style="padding:32px 32px 20px;">
    <a href="{{platformUrl}}" target="_blank" style="text-decoration:none;display:inline-block;">
      <img src="{{logoUrl}}" alt="{{brandName}}" width="140" style="display:block;width:140px;max-width:140px;height:auto;border:0;outline:none;text-decoration:none;" />
    </a>
  </td>
</tr>
  `.trim();

  private readonly defaultFooter = `
<tr>
  <td style="padding:0 32px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e6ebf1;padding-top:24px;">
      <tr>
        <td align="center" style="font-size:12px;line-height:1.6;color:#5c6b7a;text-align:center;">
          <p style="margin:0;font-size:13px;font-weight:600;color:#122033;">{{brandName}} &mdash; Medical SaaS Platform</p>
          <p style="margin:6px 0 0;font-size:12px;color:#5c6b7a;">
            Healthcare management, consultations, and patient care.
          </p>
          <p style="margin:10px 0 0;font-size:12px;">
            <a href="{{platformUrl}}" target="_blank" style="color:#0F6E56;text-decoration:none;font-weight:600;">Visit {{brandName}}</a>
            <span style="color:#cbd5e1;margin:0 6px;">&bull;</span>
            <a href="mailto:{{supportEmail}}" style="color:#0F6E56;text-decoration:none;font-weight:600;">Help &amp; Support</a>
          </p>
          <p style="margin:14px 0 0;font-size:11px;line-height:1.5;color:#8592a3;">
            This is an automated notification. Please do not reply directly to this email.<br>
            &copy; {{currentYear}} {{brandName}}. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
  `.trim();

  constructor(private readonly configService: ConfigService) {
    this.transporter = this.createTransporter();
    this.customHandlebars = customHandlebars;
    this.initPartials();
  }

  private initPartials(): void {
    this.customHandlebars.registerPartial('emailHeader', this.defaultHeader);
    this.customHandlebars.registerPartial('emailFooter', this.defaultFooter);

    // Try reading disk partials if present
    const headerPath = join(
      process.cwd(),
      'templates',
      'partials',
      'email-header.hbs',
    );
    const footerPath = join(
      process.cwd(),
      'templates',
      'partials',
      'email-footer.hbs',
    );

    fs.readFile(headerPath, 'utf-8')
      .then((content) => {
        this.customHandlebars.registerPartial('emailHeader', content);
      })
      .catch(() => {
        // Fallback to inline defaultHeader
      });

    fs.readFile(footerPath, 'utf-8')
      .then((content) => {
        this.customHandlebars.registerPartial('emailFooter', content);
      })
      .catch(() => {
        // Fallback to inline defaultFooter
      });
  }

  private createTransporter(): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: false,
      },
      pool: true,
      maxConnections: 1,
      rateDelta: 20000,
      rateLimit: 5,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }

  async sendMail({
    templatePath,
    context,
    ...mailOptions
  }: nodemailer.SendMailOptions & {
    templatePath?: MailTemplate;
    context?: Record<string, unknown>;
  }): Promise<void> {
    let html: string | undefined;

    const brandName =
      this.configService.get<string>('MAIL_DEFAULT_NAME') || 'Cliniqo';
    const frontendUrl = buildFrontendUrl(
      this.configService.get<string>('FRONTEND_URL'),
      '',
    );
    const logoUrl = buildFrontendUrl(
      this.configService.get<string>('FRONTEND_URL'),
      '/logo/logo-full-transparent.png',
    );
    const supportEmail =
      this.configService.get<string>('MAIL_SUPPORT_EMAIL') ||
      this.configService.get<string>('MAIL_DEFAULT_EMAIL') ||
      'support@cliniqo.com';
    const currentYear = new Date().getFullYear();

    const mergedContext: Record<string, unknown> = {
      brandName,
      platformUrl: frontendUrl || 'https://cliniqo.com',
      logoUrl,
      supportEmail,
      currentYear,
      ...context,
    };

    if (templatePath) {
      const template = await fs.readFile('templates/' + templatePath, 'utf-8');
      html = this.customHandlebars.compile(template, {
        strict: true,
      })(mergedContext, { allowProtoPropertiesByDefault: true });
    }

    try {
      const recipients = Array.isArray(mailOptions.to)
        ? mailOptions.to
            .map((recipient) =>
              typeof recipient === 'string' ? recipient : recipient.address,
            )
            .join(', ')
        : typeof mailOptions.to === 'string'
          ? mailOptions.to
          : mailOptions.to?.address;
      this.logger.log(
        'Sending email\nSubject: ' +
          mailOptions.subject +
          '\nList of recipients: ' +
          recipients,
      );
      // TODO : REMOVE THIS THIS AFTER TESTING
      /* if(this.configService.get('NODE_ENV') !== 'development') {
       */ if (true) {
        await this.transporter.sendMail({
          ...mailOptions,
          from: mailOptions.from
            ? mailOptions.from
            : `"${brandName}" <${this.configService.get('MAIL_DEFAULT_EMAIL', {
                infer: true,
              })}>`,
          html: mailOptions.text ? mailOptions.text : html,
        });
        this.logger.log('Email accepted by the mail server for ' + recipients);
      } else {
        this.logger.log(
          'send mail to : ' +
            mailOptions.to +
            ' with subject : ' +
            mailOptions.subject,
        );
      }
    } catch (e: any) {
      this.logger.error(e.message || 'Failed to send email');
    }
  }

  async sendWelcomeEmail(email: string, fullname: string): Promise<boolean> {
    const brandName =
      this.configService.get<string>('MAIL_DEFAULT_NAME') || 'Cliniqo';
    try {
      await this.sendMail({
        templatePath: MailTemplate.WelcomeEmail,
        context: {
          fullname,
          title: `Welcome to ${brandName}`,
          summaryLine: 'Your account is ready',
          url: buildFrontendUrl(
            this.configService.get<string>('FRONTEND_URL'),
            '/auth/sign-in',
          ),
        },
        to: email,
        subject: `Bienvenue sur ${brandName}`,
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to send welcome email:', error);
      return false;
    }
  }

  async sendOtpCode(
    email: string,
    fullname: string,
    otpCode: string,
    expirationMinutes: number,
  ): Promise<boolean> {
    const brandName =
      this.configService.get<string>('MAIL_DEFAULT_NAME') || 'Cliniqo';
    try {
      await this.sendMail({
        templatePath: MailTemplate.OtpCodeEmail,
        context: {
          fullname,
          title: 'Your sign-in code',
          otpCode,
          expirationMinutes,
        },
        to: email,
        subject: `Code de vérification - ${brandName}`,
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to send OTP code email:', error);
      return false;
    }
  }

  async sendDemoRequestConfirmation(
    email: string,
    fullname: string,
    legalName?: string,
  ): Promise<boolean> {
    const brandName =
      this.configService.get<string>('MAIL_DEFAULT_NAME') || 'Cliniqo';
    try {
      await this.sendMail({
        templatePath: MailTemplate.DemoRequestConfirmation,
        context: {
          fullname,
          legalName: legalName ?? '',
          title: 'Demande de démonstration',
          summaryLine: 'Réponse sous 48 heures',
        },
        to: email,
        subject: `Confirmation de votre demande de démonstration — ${brandName}`,
      });
      return true;
    } catch (error) {
      this.logger.error(
        'Failed to send demo request confirmation email:',
        error,
      );
      return false;
    }
  }

  /**
   * Tell the attendee about their appointment, with a one-click join link when
   * the consultation happens over video.
   *
   * Every context key is passed even when empty: templates are compiled in
   * strict mode, which throws on a missing property.
   */
  async sendPublicAppointmentRequestDoctorNotification(
    email: string,
    data: {
      fullname: string;
      title: string;
      patientName: string;
      attendeeName: string;
      otherPartyName: string;
      patientEmail: string;
      patientPhone: string;
      startFormatted: string;
      consultationTypeLabel?: string;
      locationPhrase?: string;
      address?: string;
      phone?: string;
      requestsUrl?: string;
    },
  ): Promise<boolean> {
    const brandName =
      this.configService.get<string>('MAIL_DEFAULT_NAME') || 'Cliniqo';
    try {
      await this.sendMail({
        templatePath: MailTemplate.AppointmentRequestDoctor,
        context: {
          fullname: data.fullname,
          title: data.title,
          patientName: data.patientName,
          attendeeName: data.attendeeName,
          otherPartyName: data.otherPartyName,
          patientEmail: data.patientEmail,
          patientPhone: data.patientPhone,
          startFormatted: data.startFormatted,
          consultationTypeLabel: data.consultationTypeLabel ?? '',
          locationPhrase: data.locationPhrase ?? '',
          address: data.address ?? '',
          phone: data.phone ?? '',
          requestsUrl: data.requestsUrl ?? '',
        },
        to: email,
        subject: `New appointment request — ${brandName}`,
      });
      return true;
    } catch (error) {
      this.logger.error(
        'Failed to send public appointment request doctor notification:',
        error,
      );
      return false;
    }
  }

  async sendPublicAppointmentRequestPatientConfirmation(
    email: string,
    data: {
      fullname: string;
      title: string;
      practitionerName: string;
      otherPartyName: string;
      startFormatted: string;
      consultationTypeLabel?: string;
      locationPhrase?: string;
      address?: string;
      phone?: string;
    },
  ): Promise<boolean> {
    const brandName =
      this.configService.get<string>('MAIL_DEFAULT_NAME') || 'Cliniqo';
    try {
      const subject = data.practitionerName
        ? `Appointment request received — ${data.practitionerName}`
        : `Appointment request received — ${brandName}`;
      await this.sendMail({
        templatePath: MailTemplate.AppointmentRequestPatient,
        context: {
          fullname: data.fullname,
          title: data.title,
          practitionerName: data.practitionerName,
          otherPartyName: data.otherPartyName,
          startFormatted: data.startFormatted,
          consultationTypeLabel: data.consultationTypeLabel ?? '',
          locationPhrase: data.locationPhrase ?? '',
          address: data.address ?? '',
          phone: data.phone ?? '',
        },
        to: email,
        subject,
      });
      return true;
    } catch (error) {
      this.logger.error(
        'Failed to send public appointment request patient confirmation:',
        error,
      );
      return false;
    }
  }

  async sendAppointmentInvitation(
    email: string,
    appointmentData: {
      fullname: string;
      title: string;
      startFormatted: string;
      otherPartyName?: string;
      locationPhrase?: string;
      practitionerName?: string;
      attendeeName?: string;
      consultationTypeLabel?: string;
      address?: string;
      phone?: string;
      joinUrl?: string;
      rescheduled?: boolean;
      /** Admin / consultation type (etc.) changed, without a time change. */
      updated?: boolean;
      /** Upcoming reminder (~1 hour before start), not a booking confirmation. */
      reminder?: boolean;
    },
  ): Promise<boolean> {
    try {
      let subject: string;
      if (appointmentData.reminder) {
        subject = appointmentData.otherPartyName
          ? `Reminder: appointment with ${appointmentData.otherPartyName} - ${appointmentData.startFormatted}`
          : `Reminder: your appointment - ${appointmentData.startFormatted}`;
      } else if (appointmentData.rescheduled) {
        subject = appointmentData.otherPartyName
          ? `Appointment rescheduled with ${appointmentData.otherPartyName} - ${appointmentData.startFormatted}`
          : `Appointment rescheduled - ${appointmentData.startFormatted}`;
      } else if (appointmentData.updated) {
        subject = appointmentData.otherPartyName
          ? `Appointment updated with ${appointmentData.otherPartyName} - ${appointmentData.startFormatted}`
          : `Appointment updated - ${appointmentData.startFormatted}`;
      } else {
        subject = appointmentData.otherPartyName
          ? `Appointment confirmation with ${appointmentData.otherPartyName} - ${appointmentData.startFormatted}`
          : `Your appointment - ${appointmentData.startFormatted}`;
      }

      await this.sendMail({
        templatePath: MailTemplate.AppointmentInvitation,
        context: {
          fullname: appointmentData.fullname,
          title: appointmentData.title,
          startFormatted: appointmentData.startFormatted,
          otherPartyName: appointmentData.otherPartyName ?? '',
          locationPhrase: appointmentData.locationPhrase ?? '',
          practitionerName: appointmentData.practitionerName ?? '',
          attendeeName: appointmentData.attendeeName ?? '',
          consultationTypeLabel: appointmentData.consultationTypeLabel ?? '',
          address: appointmentData.address ?? '',
          phone: appointmentData.phone ?? '',
          joinUrl: appointmentData.joinUrl ?? '',
          rescheduled: appointmentData.rescheduled ?? false,
          updated: appointmentData.updated ?? false,
          reminder: appointmentData.reminder ?? false,
        },
        to: email,
        subject,
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to send appointment invitation email:', error);
      return false;
    }
  }
}
