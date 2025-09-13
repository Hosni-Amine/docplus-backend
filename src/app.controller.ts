import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
// import { MailTemplate } from './mailing/mailing.service';
// import { Response } from 'express';
// import * as fs from 'node:fs/promises';
// import * as Handlebars from 'handlebars';

@Controller('app')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // @Get('testEmail')
  // async testConfirmationEmail(@Res() res: Response) {
  //   const customHandlebars = Handlebars.create();

  //   const template = await fs.readFile(
  //     /* 'templates/' + MailTemplate.ResetPassword, */
  //     'templates/' + MailTemplate.AccountConfirmation,
  //     'utf8',
  //   );

  //   const html = customHandlebars.compile(template, {
  //     strict: true,
  //   })(
  //     {
  //       fullname: 'amine',
  //       expirationHours: '12',
  //       url:
  //         'https://www.google.com' +
  //         'confirm/' +
  //         'token' +
  //         '?email=' +
  //         'amine@gmail.com',
  //     },
  //     { allowProtoPropertiesByDefault: true },
  //   );
  //   res.status(HttpStatus.OK).send(html);
  //   /* try {
  //       this.mailingService.sendMail({
  //           templatePath: MailTemplate.Confirmation,
  //           context: {
  //             fullname: 'amine',
  //             url:
  //               'https://www.google.com' +
  //               'confirm/' +
  //               'token' +
  //               '?email=' +
  //               'amine@gmail.com',
  //           },
  //           to: 'amine.hosni02@gmail.com',
  //           subject: "Votre compte a été créer et vous devez l'activer",
  //         });
  //       console.log('Confirmation email sent successfully to: '+'amine.hosni02@gmail.com');
  //     } catch (error) {
  //       console.log('Failed to send confirmation email:', error);
  //     } */
  // }
}
