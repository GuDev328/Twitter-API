import { Router } from 'express';
import {
  forgotPasswordController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailController,
  verifyEmailController
} from '~/controllers/usersControllers';
import {
  accessTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  verifyEmailValidator
} from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/login', loginValidator, catchError(loginController));
router.post('/register', registerValidator, catchError(registerController));
router.post('/logout', accessTokenValidator, refreshTokenValidator, catchError(logoutController));
router.post('/verify-email', accessTokenValidator, verifyEmailValidator, catchError(verifyEmailController));
router.post('/resend-verify-email', accessTokenValidator, catchError(resendVerifyEmailController));
router.post('/forgot-password', forgotPasswordValidator, catchError(forgotPasswordController));

export default router;
