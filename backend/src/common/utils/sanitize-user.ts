import { User } from '@prisma/client';

export type SafeUser = Omit<User, 'password' | 'resetToken' | 'resetTokenExp'>;

export function sanitizeUser(user: User): SafeUser {
  const {
    password: _p,
    resetToken: _rt,
    resetTokenExp: _rte,
    ...safe
  } = user;
  return safe;
}
