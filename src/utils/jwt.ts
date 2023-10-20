import jwt, { SignOptions } from 'jsonwebtoken';
import { resolve } from 'path';

export const signToken = (payload: any, jwtOptions?: SignOptions) => {
  return new Promise<string>((resolve, reject) => {
    const privateKey = process.env.JWT_SECRET_KEY as string | 'gudevisowner';
    const options = jwtOptions ? jwtOptions : ({ algorithm: 'HS256' } as SignOptions);
    jwt.sign(payload, privateKey, options, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token as string);
      }
    });
  });
};
