import { User } from '@src/user/entities/user.entity';

interface IBaseRes {
  message?: string;
  status?: number;
}

/***
 *  Auth Module
 */
export interface SigninRes extends IBaseRes {
  user: User;
  token: string;
}

export interface SignupRes extends IBaseRes {
  user: User;
}

export interface ConfirmRes extends IBaseRes {
  user: User;
}

export interface GetUserRes extends IBaseRes {
  user: User;
}

export interface PaginatorInfo {
  count: number;
  currentPage: number;
  perPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}
