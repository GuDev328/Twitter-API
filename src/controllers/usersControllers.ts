import exp from 'constants';
import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { pick } from 'lodash';
import {
  AddUsersToCircleRequest,
  ChangePasswordRequest,
  FollowRequest,
  ForgotPasswordRequest,
  GetMeRequest,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResendVerifyEmailRequest,
  ResetPasswordRequest,
  UnfollowRequest,
  UpdateMeRequest,
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

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenRequest>,
  res: Response
) => {
  const result = await userService.refreshToken(req.body);
  res.status(200).json({
    result,
    message: 'refresh Token suscess'
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

export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeRequest>, res: Response) => {
  const result = await userService.updateMe(req.body);
  res.status(200).json({
    result,
    message: 'Update me sucess'
  });
};

export const followController = async (req: Request<ParamsDictionary, any, FollowRequest>, res: Response) => {
  const result = await userService.follow(req.body);
  res.status(200).json({
    result,
    message: 'Follow sucess'
  });
};

export const unfollowController = async (req: Request<ParamsDictionary, any, UnfollowRequest>, res: Response) => {
  const result = await userService.unfollow(req.body);
  res.status(200).json({
    result,
    message: 'Unfollow sucess'
  });
};

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordRequest>,
  res: Response
) => {
  const result = await userService.changePassword(req.body);
  res.status(200).json({
    result,
    message: 'ChangePassword sucess'
  });
};

export const setUserCircleController = async (
  req: Request<ParamsDictionary, any, AddUsersToCircleRequest>,
  res: Response
) => {
  const result = await userService.setUserCircle(req.body);
  res.status(200).json({
    result,
    message: 'Set Users Circle sucess'
  });
};
