import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import {
  RequestOtpReqInput,
  RequestOtpRes,
  VerifyOtpReqInput,
  VerifyOtpRes,
} from './dto/auth.args';
import { AuthGuard } from '../guards';
import { CurrentUser } from '../decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Request a one-time login code for an email address.
   * Input: { email }
   * Output 200: { otp_confirmation_token, message: 'OTP_SENT_SUCCESSFULLY', status: 200 }
   * Output 429: { message: 'TOO_MANY_REQUESTS', status: 429 }
   * Output 500: { message: 'ERROR_SENDING_OTP_EMAIL_TRY_AGAIN' | 'INTERNAL_SERVER_ERROR', status: 500 }
   */
  @Post('/request-otp')
  async requestOtp(
    @Body() body: RequestOtpReqInput,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const res: RequestOtpRes = await this.authService.requestOtp(
      body,
      request.ip || 'unknown',
    );
    return response.status(res.status).send({
      ...res,
    });
  }

  /**
   * Verify the one-time code and return a JWT.
   * Input: { email, otp_confirmation_token, otp_code }
   * Output 200: { token, message: 'LOGGED_IN_SUCCESSFULLY', status: 200 }
   * Output 400: { message: 'OTP_VALIDATION_FAILED', status: 400 }
   * Output 429: { message: 'TOO_MANY_REQUESTS', status: 429 }
   * Output 500: { message: 'INTERNAL_SERVER_ERROR', status: 500 }
   */
  @Post('/verify-otp')
  async verifyOtp(
    @Body() body: VerifyOtpReqInput,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const res: VerifyOtpRes = await this.authService.verifyOtp(
      body,
      request.ip || 'unknown',
    );
    return response.status(res.status).send({
      ...res,
    });
  }

  /**
   * Revoke the caller's current JWT.
   * Input: Authorization: Bearer <token>
   * Output 200: { message: 'LOGGED_OUT_SUCCESSFULLY', status: 200 }
   * Output 404: { message: 'USER_NOT_FOUND', status: 404 }
   */
  @UseGuards(AuthGuard)
  @Post('/logout')
  async logout(@CurrentUser() user: { id: string }, @Res() response: Response) {
    const res = await this.authService.logout(user.id);
    return response.status(res.status).send({
      ...res,
    });
  }
}
