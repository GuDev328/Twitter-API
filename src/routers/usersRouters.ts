import { Router } from 'express';
import usersMiddlewares from '~/middlewares/usersMiddlewares';
import usersController from '~/controllers/usersControllers';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/login', usersMiddlewares.loginValidator, catchError(usersController.loginController));
router.post('/register', usersMiddlewares.registerValidator, catchError(usersController.registerController));
export default router;
