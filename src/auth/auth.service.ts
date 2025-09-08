import {
  ConfirmUserReqInput,
  ConfirmRes,
  SigninReqInput,
  SigninRes,
} from '@app/common';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { UserRepository } from '@src/user/user.repository';
import { Injectable, Logger } from '@nestjs/common';
import { MailingService } from '@src/mailing/mailing.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly mailingService: MailingService,
    private readonly configService: ConfigService,
  ) {}

  async signIn(body: SigninReqInput): Promise<SigninRes> {
    try {
      const current_user = await this.userRepository.findOne({
        email: body.email,
      });

      if (!current_user) {
        this.logger.error('Bad Credentials');
        return {
          user: null,
          token: null,
          message: 'BAD_CREDENTIALS',
          status: 400,
        };
      }
      if (!current_user.is_verified) {
        this.logger.error('User is not verified');
        return {
          user: null,
          token: null,
          message: 'USER_NOT_VERIFIED',
          status: 400,
        };
      }
      const pwd_matches = await argon.verify(
        current_user.password,
        body.password,
      );
      if (!pwd_matches) {
        this.logger.error('Bad Credentials');
        return {
          user: null,
          token: null,
          message: 'BAD_CREDENTIALS',
          status: 400,
        };
      }

      delete current_user.password;

      const payload = {
        id: current_user._id.toString(),
        role: current_user.role,
        fullname: current_user.fullname,
        email: current_user.email,
      };

      const token = await this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRY'),
        algorithm: 'HS256',
      });

      return {
        user: current_user,
        token,
        message: 'LOGGED_IN_SUCCESSFULLY',
        status: 200,
      };
    } catch (error) {
      this.logger.error('Error during sign in:', error);
      return {
        user: null,
        token: null,
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
      };
    }
  }

  async confirmUser(body: ConfirmUserReqInput): Promise<ConfirmRes> {
    const session = await this.userRepository.startTransaction();
    try {
      const current_user = await this.userRepository.findOne({
        confirmation_token: body.token,
      });
      if (!current_user) {
        this.logger.error(
          `This confirmation token ${body.token} doesn't exist!`,
        );
        return {
          user: null,
          message: `This confirmation token ${body.token} doesn't exist!`,
          status: 400,
        };
      }
      if (current_user.is_verified) {
        this.logger.error(
          `This user ${current_user.email} is already verified!`,
        );
        return {
          user: null,
          message: `This user ${current_user.email} is already verified!`,
          status: 400,
        };
      }

      const hashedPassword = await argon.hash(body.password);

      const verified_user = await this.userRepository.findOneAndUpdate(
        { confirmation_token: body.token },
        {
          $set: {
            is_verified: true,
            password: hashedPassword,
            confirmation_token: null,
            confirmation_token_validity: null,
          },
        },
      );

      this.logger.log(current_user?.email + ' verified successfully');

      await session.commitTransaction();

      delete verified_user.password;
      delete verified_user.isDeleted;

      return {
        user: verified_user,
        message: 'VERIFIED_SUCCESSFULLY',
        status: 200,
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(error);
      return {
        user: null,
        message: 'ERROR_CONFIRMING_USER',
        status: 500,
      };
    }
  }

  async resetPassword(body: ConfirmUserReqInput): Promise<ConfirmRes> {
    const session = await this.userRepository.startTransaction();
    const now = new Date();
    try {
      const current_user = await this.userRepository.findOne({
        confirmation_token: body.token,
        confirmation_token_validity: { $gte: now },
      });

      if (!current_user) {
        this.logger.error(
          `This confirmation token ${body.token} doesn't exist!`,
        );
        return {
          user: null,
          message: `This confirmation token ${body.token} doesn't exist!`,
          status: 400,
        };
      }

      const hashPassword = await argon.hash(body.password);
      const verified_user = await this.userRepository.findOneAndUpdate(
        { confirmation_token: body.token },
        {
          $set: {
            confirmation_token: null,
            confirmation_token_validity: null,
            password: hashPassword,
          },
        },
      );

      await session.commitTransaction();

      delete verified_user.password;
      delete verified_user.isDeleted;

      return {
        user: verified_user,
        message: 'PASSWORD_RESET_SUCCESSFULLY',
        status: 200,
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(error);
      return {
        user: null,
        message: 'ERROR_RESETTING_PASSWORD',
        status: 500,
      };
    }
  }

  async requestResetPassword(email: string): Promise<ConfirmRes> {
    const session = await this.userRepository.startTransaction();
    try {
      const current_user = await this.userRepository.findOne({ email: email });
      if (!current_user) {
        this.logger.error(`This email ${email} doesn't exist!`);
        return {
          user: null,
          message: `THIS_EMAIL_DOES_NOT_EXIST`,
          status: 400,
        };
      }
      const expirationHours = 12;
      const confirmationToken = uuidv4();

      // Update user with new token first
      await this.userRepository.findOneAndUpdate(
        { email: email },
        {
          $set: {
            confirmation_token: confirmationToken,
            is_verified: false,
            confirmation_token_validity: new Date(
              Date.now() + 1000 * 60 * 60 * expirationHours,
            ),
          },
        },
      );

      // Then send email
      const is_sent = await this.mailingService.sendUserResetPassword(
        current_user.email,
        current_user.fullname,
        confirmationToken,
        expirationHours,
      );

      if (!is_sent) {
        this.logger.error(
          `Error sending reset password email to ${current_user.email}!`,
        );
        await session.abortTransaction();
        return {
          user: null,
          message: `ERROR_SENDING_RESET_PASSWORD_EMAIL`,
          status: 500,
        };
      }

      await session.commitTransaction();
      this.logger.log(
        current_user?.email + ' password reset request sent successfully',
      );
      return {
        user: null,
        message: 'PASSWORD_RESET_REQUEST_SENT_SUCCESSFULLY',
        status: 200,
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(error);
      return {
        user: null,
        message: 'ERROR_SENDING_RESET_PASSWORD_EMAIL',
        status: 500,
      };
    }
  }
}
