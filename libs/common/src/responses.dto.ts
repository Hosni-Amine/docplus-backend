import { User } from "@src/schemas";

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
/***
 *  User Module
 */
export  interface GetMeResDTO extends IBaseRes {
  user: User;
}
export  interface GetUserResDTO extends IBaseRes {
  user: User;
}