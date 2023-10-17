import { Request, Response, NextFunction } from 'express';
import userService from '~/services/usersServices';
const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = userService.login({ email, password });

    res.status(200).json({
      message: 'Login suscess'
    });
  } catch (error) {
    res.status(400).json({
      message: 'Login fail',
      error
    });
  }
};

const registerController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = userService.register({ email, password });

    res.status(200).json({
      message: 'Register suscess'
    });
  } catch (error) {
    res.status(400).json({
      message: 'Register fail',
      error
    });
  }
};
export default {
  loginController: loginController,
  registerController: registerController
};
