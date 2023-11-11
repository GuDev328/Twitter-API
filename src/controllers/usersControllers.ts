import exp from 'constants';
import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import {
  ForgotPasswordRequest,
  GetMeRequest,
  LoginRequest,
  LogoutRequest,
  RegisterRequest,
  ResendVerifyEmailRequest,
  ResetPasswordRequest,
  VerifyEmailRequest
} from '~/models/requests/UserRequests';
import userService from '~/services/usersServices';

export const loginController = async (req: Request<ParamsDictionary, any, LoginRequest>, res: Response) => {
  const result = await userService.login(req.body);
  res.status(200).json({
    result,
    message: 'Login suscess'
  });
};

export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequest>, res: Response) => {
  const result = await userService.register(req.body);
  res.status(200).json({
    result,
    message: 'Register suscess'
  });
};

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutRequest>, res: Response) => {
  const result = await userService.logout(req.body);
  res.status(200).json({
    message: 'Logout suscess'
  });
};

export const verifyEmailController = async (req: Request<ParamsDictionary, any, VerifyEmailRequest>, res: Response) => {
  const result = await userService.verifyEmail(req.body);
  res.status(200).json({
    result,
    message: 'Verify email suscess'
  });
};

export const resendVerifyEmailController = async (
  req: Request<ParamsDictionary, any, ResendVerifyEmailRequest>,
  res: Response
) => {
  const result = await userService.resendVerifyEmail(req.body);
  res.status(200).json({
    result,
    message: 'Resend verify email suscess'
  });
};

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordRequest>,
  res: Response
) => {
  const result = await userService.forgotPassword(req.body);
  res.status(200).json({
    result,
    message: 'Forgot password sucess'
  });
};

export const verifyForgotPasswordController = async (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Verify forgot password sucess'
  });
};

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordRequest>,
  res: Response
) => {
  const result = await userService.resetPassword(req.body);
  res.status(200).json({
    result,
    message: 'Reset password sucess'
  });
};

export const getMeController = async (req: Request<ParamsDictionary, any, GetMeRequest>, res: Response) => {
  const result = await userService.getMe(req.body);
  res.status(200).json({
    result,
    message: 'Get me sucess'
  });
};
