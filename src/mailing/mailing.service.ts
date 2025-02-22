import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'node:fs/promises';
import Handlebars from 'handlebars';

const customHandlebars = Handlebars.create();
export enum MailTemplate {
    Confirmation = 'confirmation.hbs',
    ResetPassword = 'reset-password.hbs',
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
          if(this.configService.get('NODE_ENV') !== 'development') {
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

    async sendUserConfirmation(email: string, fullname: string, token: string, expirationHours: number): Promise<void> {
        try {
            this.sendMail({
                templatePath: MailTemplate.Confirmation,
                context: {
                  fullname,
                  expirationHours,
                  url:
                    this.configService.get<string>('FRONTEND_URL') +
                    'confirm/' + '?token=' +token,
                },
                to: email,
                subject: "Votre compte a été créer et vous devez l'activer",
              });
            this.logger.log('Confirmation email sent successfully to: '+email);
        } catch (error) {
            this.logger.error('Failed to send confirmation email:', error);
        }
    }

    async sendUserResetPassword(email: string, fullname: string, token: string,expirationHours:number): Promise<boolean> {
      try {
          this.sendMail({
              templatePath: MailTemplate.ResetPassword,
              context: {
                expirationHours,
                fullname,
                url:
                  this.configService.get<string>('FRONTEND_URL') +
                  'reset-password/?token=' + token,
              },
              to: email,
              subject: "Réinitialiser votre mot de passe",
            });
          this.logger.log('Reset password email sent successfully to: '+email);
          return true;
      } catch (error) {
          this.logger.error('Failed to send reset password email:', error);
          return false;
      }
  }
}
