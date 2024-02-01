import { Router } from 'express';
import {
  changePasswordController,
  followController,
  forgotPasswordController,
  getMeController,
  loginController,
  loginGoogleController,
  logoutController,
  refreshTokenController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  setUserCircleController,
  unfollowController,
  updateMeController,
  verifyEmailController,
  verifyForgotPasswordController
} from '~/controllers/usersControllers';
import { filterMiddleware } from '~/middlewares/commonMiddlewares';
import {
  accessTokenValidator,
  changePasswordValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  setUserCirclesValidator,
  unfollowValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyEmailValidator,
  verifyForgotPasswordValidator
} from '~/middlewares/usersMiddlewares';
import { UpdateMeRequest } from '~/models/requests/UserRequests';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/login', loginValidator, catchError(loginController));
router.get('/oauth/google', catchError(loginGoogleController));
router.post('/register', registerValidator, catchError(registerController));
router.post('/logout', accessTokenValidator, refreshTokenValidator, catchError(logoutController));
router.post('/refresh-token', refreshTokenValidator, catchError(refreshTokenController));
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
router.get('/get-me', accessTokenValidator, catchError(getMeController));
router.patch(
  '/update-me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeRequest>([
    'decodeAuthorization',
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'
  ]),
  catchError(updateMeController)
);

router.post('/follow', accessTokenValidator, verifiedUserValidator, followValidator, catchError(followController));
router.post(
  '/unfollow',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  catchError(unfollowController)
);

router.post('/change-password', accessTokenValidator, changePasswordValidator, catchError(changePasswordController));
router.post(
  '/set-circle',
  accessTokenValidator,
  verifiedUserValidator,
  setUserCirclesValidator,
  catchError(setUserCircleController)
);

export default router;
