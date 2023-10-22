import express, { Router, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import usersRouters from '~/routers/usersRouters';
import db from './services/databaseServices';

const app = express();
dotenv.config();
db.connect();

const router = Router();
app.use(express.json());
app.use('/users', usersRouters);
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({
    error: err.message
  });
});
const port = 3030;
app.listen(port, () => console.log('API-Twitter server is running port: ' + port));
