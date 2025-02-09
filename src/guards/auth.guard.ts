import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '@src/schemas';
import { Model } from 'mongoose';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      this.logger.error('No token provided');
      return false;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.getOrThrow('JWT_SECRET')
      });
      console.log(payload);
      request.user = payload;
      /* switch ((await this.userModel.findOne({ _id: payload.id })).role) {
        case 'DOCTOR':
          current_user = await current_user.populate('Doctor').exec()
        case 'SECRETARY':
          current_user = await current_user.populate('Secretary').exec()
        case 'PATIENT':
          current_user = await current_user.populate('Patient').exec()
        default:
          current_user = await current_user;
      } */     
    } catch (err) {
      this.logger.error(err.message);
      return false;
    }
    return true;
  }

  private extractTokenFromHeader = (request: Request): string | undefined => {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  };
}
