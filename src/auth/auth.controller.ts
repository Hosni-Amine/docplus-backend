import {Body,Controller,Patch,Post,Res} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { SigninReqDTO, SigninResDTO, SignupReqDTO, ConfirmReqDTO } from '@app/common';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @Post('/signin')
  async signIn(@Body() body: SigninReqDTO, @Res() response: Response) {
    const res: SigninResDTO = await this.authService.signIn(body);
    return response.status(res.status).send({
      ...res
    });
  }

  @Patch('/reset-password')
  async resetPassword(@Body() body: ConfirmReqDTO, @Res() response: Response) {
    const res = await this.authService.resetPassword(body);
    //NB ; THJIS SHOULD BE LIKE THAT TO SECURE THE STATUS OF THE RESPONSE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    return response.status(res.status).send({
      ...res
    })
  }

  @Patch('/confirm')
  async confirmUser(@Body() body: ConfirmReqDTO, @Res() response: Response) {
      const res = await this.authService.confirmUser(body);
      return response.status(res.status).send({
        ...res
      });
  }

    /* @Post('/signup')
  async signUp(@Body() body: SignupReqDTO, @Res() response: Response) {
    const res = await this.authService.signUp(body);
    return response.status(res.status).send({
      ...res
    })
  } */
}
