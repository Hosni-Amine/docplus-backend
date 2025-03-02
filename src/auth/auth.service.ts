import { ConfirmReqDTO, ConfirmResDTO, SigninReqDTO, SigninResDTO } from '@app/common';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { UserRepository } from '@src/user/user.repository';
import { Injectable, Logger } from '@nestjs/common';
import { MailingService } from '@src/mailing/mailing.service';
import { v4 as uuidv4 } from 'uuid';  

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly mailingService: MailingService
  ) { }

  async signIn(body: SigninReqDTO): Promise<SigninResDTO> {
    try {
      const current_user = await this.userRepository.findOne({ email: body.login })

      if (!current_user) {
        this.logger.error('Bad Credentials');
        return {
          user: null,
          token: null,
          message: 'Bad Credentials',
          status: 400
        }
      }
      console.log(current_user.is_verified)
      if (!current_user.is_verified) {
        this.logger.error('User is not verified');
        return {
          user: null,
          token: null,
          message: 'User is not verified',
          status: 400
        }
      }
      const pwd_matches = await argon.verify(current_user.password, body.password)
      if (!pwd_matches) {
        this.logger.error('Bad Credentials');
        return {
          user: null,
          token: null,
          message: 'Bad Credentials',
          status: 400
        }
      }

      delete current_user.password;

      const payload = {
        id: current_user._id.toString(), 
        role: current_user.role,
        fullname: current_user.fullname,
        email: current_user.email,
      };

      const token = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRY,
        algorithm: 'HS256'
      });
       
      return {
        user: current_user,
        token,
        message: "Logged in successfully!",
        status: 200
      }
    } catch (error) {
      this.logger.error('Error during sign in:', error);
      return {
        user: null,
        token: null,
        message: 'Internal server error',
        status: 500
      }
    }
  }

  async confirmUser(body: ConfirmReqDTO): Promise<ConfirmResDTO> {
    const session = await this.userRepository.startTransaction();
    try {
      const current_user = await this.userRepository.findOne({ confirmation_token: body.token });
      console.log(current_user)
      if (!current_user) {
        this.logger.error(`This confirmation token ${body.token} doesn't exist!`);
        return {
          user: null, 
          message: `This confirmation token ${body.token} doesn't exist!`,
          status: 400
        }
      }

      if (current_user.is_verified) {
        this.logger.error(`This user ${current_user.email} is already verified!`);
        return {
          user: null,
          message: `This user ${current_user.email} is already verified!`,
          status: 400
        }
      }

      const hashedPassword = await argon.hash(body.password);

      const verified_user = await this.userRepository.findOneAndUpdate(
        { confirmation_token: body.token },
        {
          $set: {
            is_verified: true,
            password: hashedPassword,
            confirmation_token: null,
            confirmation_token_validity: null
          }
        }
      )

      await session.commitTransaction();

      delete verified_user.password;
      delete verified_user.isDeleted;

      return {
        user: verified_user,
        message: "Verified successfully!",
        status: 200
      }
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(error);
      return {
        user: null,
        message: 'Error confirming user!',
        status: 500
      }
    }
  }

  async resetPassword(body: ConfirmReqDTO): Promise<ConfirmResDTO> {
    const session = await this.userRepository.startTransaction();
    const now = new Date();
    try {
      const current_user = await this.userRepository.findOne({ 
        confirmation_token: body.token, 
        confirmation_token_validity: { $gte: now } 
      });

      if (!current_user) {
        this.logger.error(`This confirmation token ${body.token} doesn't exist!`);
        return {
          user: null, 
          message: `This confirmation token ${body.token} doesn't exist!`,
          status: 400
        }
      }

      const hashPassword = await argon.hash(body.password)
      const verified_user = await this.userRepository.findOneAndUpdate(
        { confirmation_token: body.token },
        {
          $set: {
            confirmation_token: null,
            confirmation_token_validity: null,
            password: hashPassword
          }
        }
      )

      await session.commitTransaction();

      delete verified_user.password;
      delete verified_user.isDeleted;

      return {
        user: verified_user,
        message: "Password reset successfully!",
        status: 200
      }
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(error);
      return {
        user: null,
        message: 'Error resetting password!',
        status: 500
      }
    }
  }

  async requestResetPassword(email: string): Promise<ConfirmResDTO> {
    try {
      const current_user = await this.userRepository.findOne({ email: email });
      if (!current_user) {
        this.logger.error(`This email ${email} doesn't exist!`);
        return {
          user: null, 
          message: `This email ${email} doesn't exist!`,
          status: 400
        }
      }
      const expirationHours = 12;
      const is_sent = await this.mailingService.sendUserResetPassword(current_user.email, current_user.fullname, current_user.confirmation_token,expirationHours);
      if (!is_sent) {
        this.logger.error(`Error sending reset password email to ${current_user.email}!`);
        return {
          user: null,
          message: `Error sending reset password email to ${current_user.email}!`,
          status: 500
        }
      }
      const confirmationToken = uuidv4();
      await this.userRepository.findOneAndUpdate(
        { email: email },
        {
          $set: {
            confirmation_token: confirmationToken,
            confirmation_token_validity: new Date(Date.now() + 1000 * 60 * 60 * expirationHours)
          }
        }
      )
      return {
        user: null,
        message: "Password reset request sent successfully!",
        status: 200
      }
    } catch (error) {
      this.logger.error(error);
      return {
        user: null,
        message: 'Error sending reset password email!',
        status: 500
      }
    }
  }

  /* async signUp(body: SignupReqDTO): Promise<SignupResDTO> {
    const session = await this.userRepository.startTransaction();
    try {
      const current_user = await this.userRepository.findOne({ email: body.email });
      if (current_user) {
        this.logger.error(`This mail address ${body.email} is already existed!`);
        return {
          user: null,
          message: `This mail address ${body.email} is already existed!`,
          status: 400
        }
      }

      const hashPassword = await argon.hash(body.password)
      const confirmationToken = uuidv4();

      const saved_user = await this.userRepository.create({
        ...body,
        password: hashPassword,
        confirmation_token: confirmationToken,
        is_verified: false,
        is_completed: false
      })
 
      await this.mailingService.sendUserConfirmation(saved_user.email, saved_user.fullname, saved_user.confirmation_token);
      await session.commitTransaction();

      delete saved_user.password;
      delete saved_user.isDeleted;

      return {
        user: saved_user,
        message: "Registered successfully!",
        status: 201
      }
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(error);
      return {
        user: null,
        message: 'Error registering user!',
        status: 500
      }
    }
  } */
}
