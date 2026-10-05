import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { ERole } from '../common';
import { UserRepository } from '../user/user.repository';
import { tokenUserFields } from '../user/user.fields';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private userRepository: UserRepository,
  ) {}

  /**
   * Accept the request only when the bearer token is a valid HS256 JWT
   * for an active user whose tokenVersion still matches.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      this.logger.error('No token provided');
      return false;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.getOrThrow('JWT_SECRET'),
        algorithms: ['HS256'],
      });
      const user = await this.userRepository.findOne(
        { _id: payload.id },
        { select: tokenUserFields },
      );
      if (!user || user.isBlocked || user.isDeleted) {
        this.logger.error('User is missing, blocked, or deleted');
        return false;
      }
      if ((payload.tokenVersion ?? -1) !== (user.tokenVersion ?? 0)) {
        this.logger.error('Token has been revoked');
        return false;
      }
      request.user = { id: user._id.toString(), ...user };
    } catch (err: any) {
      this.logger.error(err.message || 'Invalid token');
      return false;
    }
    return true;
  }

  /**
   * Read the bearer token from the Authorization header.
   */
  private extractTokenFromHeader = (request: Request): string | undefined => {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  /**
   * Allow the request when the user's role is one of the roles set on the route.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<ERole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user?.role) {
      return false;
    }
    return requiredRoles.includes(user.role);
  }
}
