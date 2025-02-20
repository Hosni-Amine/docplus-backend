import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'node:fs/promises';
import Handlebars from 'handlebars';

const customHandlebars = Handlebars.create();
export enum MailTemplate {
    Confirmation = 'confirmation.hbs',
    ResetPassword = 'reset-password.hbs',
/*     
    ResetPasswordConfirmed = 'reset-password-confirmed.hbs',
    NewUser = 'new-user.hbs',
    NewTicket = 'new-ticket.hbs',
    NewTicketAffected = 'new-ticket-affected.hbs',
    NoClosedReminder = 'no-closed-reminder.hbs',
    NoClosedReminderAdmin = 'no-closed-reminder-admin.hbs',
    ExpertiseReminder = 'expertise-reminder.hbs',
    TicketClosed = 'ticket-closed.hbs',
    TicketsImported = 'tickets-imported.hbs',
    ExpertiseReminderAdmin = 'expertise-reminder-admin.hbs',
    ExpertiseReport = 'expertise-report.hbs',
    TicketsReport = 'tickets-report.hbs',
    Notification = 'notification.hbs',
    TicketTest = 'ticket-test.hbs', */
  }


@Injectable()
export class MailingService {
    private readonly transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailingService.name);

    constructor(private readonly configService: ConfigService) {
        this.transporter = this.createTransporter();
        this.customHandlebars = customHandlebars;
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
                rejectUnauthorized: false
            },
            pool: true,
            maxConnections: 1,
            rateDelta: 20000,
            rateLimit: 5
        });
    }

    private customHandlebars: typeof Handlebars;

    async sendMail({
        templatePath,
        context,
        ...mailOptions
      }: nodemailer.SendMailOptions & {
        templatePath?: MailTemplate;
        context?: Record<string, unknown>;
      }): Promise<void> {
        let html: string | undefined;
    
        const template = await fs.readFile('templates/' + templatePath, 'utf-8');
        try {
          if (templatePath) {
            html = this.customHandlebars.compile(template, {
              strict: true,
            })(
              {
                ...context,
                /* today: new Date(),
                lockImage:
                  this.configService.get('BASE_URL_BACK') +
                  'public-assets/images/image-1.png',
                logoUrl: this.configService.get('BASE_URL_FRONT') + 'fp-logo/logo.png',
                naLogo:
                  this.configService.get('BASE_URL_BACK') +
                  'public-assets/images/na-logo-white.png', */
              },
              { allowProtoPropertiesByDefault: true },
            );
          }
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
            "Sending email\nSubject: " +
              mailOptions.subject +
              '\nList of recipients: ' +
              recipients,
          );
          if(this.configService.get('NODE_ENV') !== 'developement') {
          await this.transporter.sendMail({
            ...mailOptions,
            from: mailOptions.from
              ? mailOptions.from
              : `"${this.configService.get('MAIL_DEFAULT_NAME', {
                  infer: true,
                })}" <${this.configService.get('MAIL_DEFAULT_EMAIL', {
                  infer: true,
                })}>`,
            html: mailOptions.text ? mailOptions.text : html,
          });
        }else{
          this.logger.log("send mail to : " + mailOptions.to + " with subject : " + mailOptions.subject);
        }
        } catch (e) {
          this.logger.error(e.message);
        }
      }

    async sendUserConfirmation(email: string, fullname: string, token: string): Promise<void> {
        try {
            this.sendMail({
                templatePath: MailTemplate.Confirmation,
                context: {
                  fullname,
                  url:
                    this.configService.get<string>('FRONTEND_URL') +
                    'confirm/' + 
                    token +
                    '?email=' +
                    email,
                },
                to: email,
                subject: "Votre compte a été créer et vous devez l'activer",
              });
            this.logger.log('Confirmation email sent successfully to: '+email);
        } catch (error) {
            this.logger.error('Failed to send confirmation email:', error);
        }
    }

    async sendUserResetPassword(email: string, fullname: string, token: string): Promise<void> {
      try {
          this.sendMail({
              templatePath: MailTemplate.ResetPassword,
              context: {
                fullname,
                url:
                  this.configService.get<string>('FRONTEND_URL') +
                  'confirm/' + 
                  token +
                  '?email=' +
                  email,
              },
              to: email,
              subject: "Réinitialiser votre mot de passe",
            });
          this.logger.log('Reset password email sent successfully to: '+email);
      } catch (error) {
          this.logger.error('Failed to send reset password email:', error);
      }
  }
}
