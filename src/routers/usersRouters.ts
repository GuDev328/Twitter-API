import { Router } from 'express';
import {
  forgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  verifyEmailController,
  verifyForgotPasswordController
} from '~/controllers/usersControllers';
import {
  accessTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  verifyEmailValidator,
  verifyForgotPasswordValidator
} from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/login', loginValidator, catchError(loginController));
router.post('/register', registerValidator, catchError(registerController));
router.post('/logout', accessTokenValidator, refreshTokenValidator, catchError(logoutController));
router.post('/verify-email', accessTokenValidator, verifyEmailValidator, catchError(verifyEmailController));
router.post('/resend-verify-email', accessTokenValidator, catchError(resendVerifyEmailController));
router.post('/forgot-password', forgotPasswordValidator, catchError(forgotPasswordController));
router.post('/verify-forgot-password', verifyForgotPasswordValidator, catchError(verifyForgotPasswordController));
router.post(
  '/reset-password',
  resetPasswordValidator,
  verifyForgotPasswordValidator,
  catchError(resetPasswordController)
);
router.post('/get-me', accessTokenValidator, catchError(getMeController));

export default router;
