import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailingService {
    constructor(
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService
    ) { }

    async sendUserConfirmation(email: string, username: string, token: string): Promise<void> {
        /* const url = `${this.configService.get('FRONTEND_URL')}/auth/confirm/${token}`;
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Welcome! Confirm Your Email',
                template: 'confirmation',
                context: {
                    username,
                    url
                }
            });
            console.log('Confirmation email sent successfully to:', email);
        } catch (error) {
            console.error('Failed to send confirmation email:', error);
            throw error;
        } */
    }
}
