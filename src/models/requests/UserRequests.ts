import { JwtPayload } from 'jsonwebtoken';
import User from '../schemas/UserSchema';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  date_of_birth: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface VerifyEmailRequest {
  emailVerifyToken: string;
  decodeEmailVerifyToken: JwtPayload;
}

export interface ResendVerifyEmailRequest {
  decodeAuthorization: JwtPayload;
}

export interface ForgotPasswordRequest {
  email: string;
  user: User;
}

export interface ResetPasswordRequest {
  password: string;
  confirmPassword: string;
  user: User;
}

export interface GetMeRequest {
  decodeAuthorization: JwtPayload;
}
