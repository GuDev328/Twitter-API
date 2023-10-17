import { Router } from 'express';
import usersMiddlewares from '~/middlewares/usersMiddlewares';
import usersController from '~/controllers/usersControllers';
const router = Router();

router.post('/login', usersMiddlewares.loginValidator, usersController.loginController);
router.post('/register', usersMiddlewares.loginValidator, usersController.registerController);
export default router;
