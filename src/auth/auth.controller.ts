import { Body, Controller, Patch, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import {
  SigninReqInput,
  SigninRes,
  ConfirmUserReqInput,
  RequestResetPasswordReqInput,
} from '@app/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signin')
  async signIn(@Body() body: SigninReqInput, @Res() response: Response) {
    const res: SigninRes = await this.authService.signIn(body);
    return response.status(res.status).send({
      ...res,
    });
  }

  @Patch('/reset-password')
  async resetPassword(
    @Body() body: ConfirmUserReqInput,
    @Res() response: Response,
  ) {
    const res = await this.authService.resetPassword(body);
    return response.status(res.status).send({
      ...res,
    });
  }

  @Patch('/confirm')
  async confirmUser(
    @Body() body: ConfirmUserReqInput,
    @Res() response: Response,
  ) {
    console.log(body);
    const res = await this.authService.confirmUser(body);
    return response.status(res.status).send({
      ...res,
    });
  }

  @Post('/request-reset-password')
  async requestResetPassword(
    @Body() body: RequestResetPasswordReqInput,
    @Res() response: Response,
  ) {
    console.log(body);
    const res = await this.authService.requestResetPassword(body.email);
    return response.status(res.status).send({
      ...res,
    });
  }
}
