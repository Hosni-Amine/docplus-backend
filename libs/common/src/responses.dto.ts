import { User } from "@src/user/schemas/user.schema";

interface IBaseRes {
  message?: string;
  status?: number;
}

/***
 *  Auth Module
 */
export  interface SigninResDTO extends IBaseRes {
  user: User;
  token: string;
}

export  interface SignupResDTO extends IBaseRes {
  user: User;
}

export  interface ConfirmResDTO extends IBaseRes {
  user: User;
}

export  interface GetUserResDTO extends IBaseRes {
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