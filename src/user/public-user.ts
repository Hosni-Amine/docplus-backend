import { User } from './entities/user.entity';

const PRIVATE_USER_FIELDS = [
  'otp_code',
  'otp_expires_at',
  'otp_confirmation_token',
  'otp_attempts',
  'tokenVersion',
] as const;

/**
 * Return a user object without OTP secrets or the token version.
 */
export function toPublicUser<T extends Partial<User> | null | undefined>(
  user: T,
): T {
  if (!user) {
    return user;
  }

  const copy = { ...user };
  for (const field of PRIVATE_USER_FIELDS) {
    delete copy[field];
  }
  return copy;
}
