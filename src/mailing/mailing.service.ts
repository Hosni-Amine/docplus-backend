import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'node:fs/promises';
import Handlebars from 'handlebars';

const customHandlebars = Handlebars.create();
export enum MailTemplate {
  WelcomeEmail = 'welcome-email.hbs',
  OtpCodeEmail = 'otp-code-email.hbs',
  RequestCreated = 'request-created.hbs',
  RequestCompleted = 'request-completed.hbs',
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
            : `"${this.configService.get('MAIL_DEFAULT_NAME', {
                infer: true,
              })}" <${this.configService.get('MAIL_DEFAULT_EMAIL', {
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
      throw e;
    }
  }

  async sendWelcomeEmail(email: string, fullname: string): Promise<boolean> {
    try {
      await this.sendMail({
        templatePath: MailTemplate.WelcomeEmail,
        context: {
          fullname,
          url: this.configService.get<string>('FRONTEND_URL') + 'signin',
        },
        to: email,
        subject: 'Bienvenue sur DocPlus',
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
    try {
      await this.sendMail({
        templatePath: MailTemplate.OtpCodeEmail,
        context: {
          fullname,
          otpCode,
          expirationMinutes,
        },
        to: email,
        subject: 'Code de vérification - DocPlus',
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to send OTP code email:', error);
      return false;
    }
  }

  async sendRequestCreatedNotification(
    email: string,
    validatorName: string,
    requestData: {
      reference: string;
      title: string;
      demandeurName: string;
      requestTypeName: string;
      createdAt: string;
      requestUrl: string;
    },
  ): Promise<boolean> {
    try {
      await this.sendMail({
        templatePath: MailTemplate.RequestCreated,
        context: {
          validatorName,
          reference: requestData.reference,
          title: requestData.title,
          demandeurName: requestData.demandeurName,
          requestTypeName: requestData.requestTypeName,
          createdAt: requestData.createdAt,
          requestUrl: requestData.requestUrl,
        },
        to: email,
        subject: `Nouvelle demande - ${requestData.reference}`,
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to send request created notification:', error);
      return false;
    }
  }

  async sendRequestCompletedNotification(
    email: string,
    fullname: string,
    requestData: {
      reference: string;
      title: string;
      requestTypeName: string;
      completedAt: string;
      requestUrl: string;
    },
  ): Promise<boolean> {
    try {
      await this.sendMail({
        templatePath: MailTemplate.RequestCompleted,
        context: {
          fullname,
          reference: requestData.reference,
          title: requestData.title,
          requestTypeName: requestData.requestTypeName,
          completedAt: requestData.completedAt,
          requestUrl: requestData.requestUrl,
        },
        to: email,
        subject: `Votre demande est terminée - ${requestData.reference}`,
      });
      this.logger.log(
        'Request completed notification email sent successfully to: ' + email,
      );
      return true;
    } catch (error) {
      this.logger.error(
        'Failed to send request completed notification email:',
        error,
      );
      return false;
    }
  }
}
