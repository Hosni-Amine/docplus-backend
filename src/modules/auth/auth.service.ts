import { ConfirmReqDTO, ConfirmResDTO, SigninReqDTO, SigninResDTO, SignupReqDTO, SignupResDTO } from '@app/common';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { UserRepository } from '../user/user.repository';
import { v4 as uuidv4 } from 'uuid';
import { Doctor, Patient, Secretary } from '@src/schemas';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { MailingService } from '@src/modules/mailing/mailing.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly mailingService: MailingService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) { }

  async signIn(body: SigninReqDTO): Promise<SigninResDTO> {
    try {
      const current_user = await this.userRepository.findOne({ email: body.login })

      if (!current_user) {
        console.log('Bad Credentials');
        return {
          user: null,
          token: null,
          message: 'Bad Credentials',
          status: 400
        }
      }
      const pwd_matches = await argon.verify(current_user.password, body.password)
      if (!pwd_matches) {
        console.log('Bad Credentials');
        return {
          user: null,
          token: null,
          message: 'Bad Credentials',
          status: 400
        }
      }

      delete current_user.password;

      const payload = {
        id: current_user._id, 
        role: current_user.role,
        fullname: current_user.fullname,
        username: current_user.username,
        email: current_user.email,
      };

      const token = await this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
        expiresIn: this.configService.getOrThrow('JWT_EXPIRY')
      });

      return {
        user: current_user,
        token,
        message: "Logged in successfully!",
        status: 200
      }
    } catch (error) {
      console.log('Error during sign in:', error);
      return {
        user: null,
        token: null,
        message: 'Internal server error',
        status: 500
      }
    }
  }

  async signUp(body: SignupReqDTO): Promise<SignupResDTO> {
    const session = await this.userRepository.startTransaction();
    try {
      const current_user = await this.userRepository.findOne({ email: body.email });
      if (current_user) {
        console.log(`This mail address ${body.email} is already existed!`);
        return {
          user: null,
          message: `This mail address ${body.email} is already existed!`,
          status: 400
        }
      }
      const userByUsername = await this.userRepository.findOne({ username: body.username });
      if (userByUsername) {
        console.log(`This username ${body.username} is already existed!`);
        return {
          user: null,
          message: `This username ${body.username} is already existed!`,
          status: 400
        }
      }

      const hashPassword = await argon.hash(body.password)
      const confirmationToken = uuidv4();

      const saved_user = await this.userRepository.create({
        email: body.email,
        password: hashPassword,
        username: body.username,
        phone_number: body.phoneNumber,
        role: body.role,
        fullname: body.fullname,
        confirmation_token: confirmationToken,
        is_verified: false,
        is_completed: false
      })

      await this.mailingService.sendUserConfirmation(saved_user.email, saved_user.username, saved_user.confirmation_token);
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
      console.log(error);
      return {
        user: null,
        message: 'Error registering user!',
        status: 500
      }
    }
  }

  async confirmUser(body: ConfirmReqDTO): Promise<ConfirmResDTO> {
    const session = await this.userRepository.startTransaction();
    try {
      const current_user = await this.userRepository.findOne({ confirmation_token: body.token });

      if (!current_user) {
        console.log(`This confirmation token ${body.token} doesn't exist!`);
        return {
          user: null,
          message: `This confirmation token ${body.token} doesn't exist!`,
          status: 400
        }
      }

      if (current_user.is_verified) {
        console.log(`This user ${current_user.email} is already verified!`);
        return {
          user: null,
          message: `This user ${current_user.email} is already verified!`,
          status: 400
        }
      }

      const verified_user = await this.userRepository.findOneAndUpdate(
        { confirmation_token: body.token },
        { is_verified: true }
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
      console.log(error);
      return {
        user: null,
        message: 'Error confirming user!',
        status: 500
      }
    }
  }
}
