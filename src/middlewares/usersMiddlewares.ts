import { Request, Response, NextFunction } from 'express';
import { body, checkSchema } from 'express-validator';
import { request } from 'http';
import { JwtPayload } from 'jsonwebtoken';
import { TokenType } from '~/constants/enum';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import db from '~/services/databaseServices';
import usersService from '~/services/usersServices';
import { verifyToken } from '~/utils/jwt';
import { validate } from '~/utils/validation';

const accessTokenValidator = validate(
  checkSchema(
    {
      authorization: {
        notEmpty: {
          errorMessage: 'authorization is required'
        },
        custom: {
          options: async (value: string, { req }) => {
            const accessToken = value.split(' ')[1];
            if (accessToken === '') {
              throw new ErrorWithStatus({
                message: 'Access token is required',
                status: 401
              });
            } else {
              const decodeAuthorization = await verifyToken(accessToken);
              req.decodeAuthorization = decodeAuthorization;
              if (decodeAuthorization.payload.type !== TokenType.AccessToken) {
                throw new ErrorWithStatus({
                  message: 'Type of token is not valid',
                  status: 401
                });
              }

              return true;
            }
          }
        }
      }
    },
    ['headers']
  )
);

const refreshTokenValidator = validate(
  checkSchema(
    {
      refreshToken: {
        notEmpty: {
          errorMessage: 'refreshToken is required'
        },
        custom: {
          options: async (value: string, { req }) => {
            const refreshToken = req.body.refreshToken;
            try {
              const [decodeRefreshToken, checkInDB] = await Promise.all([
                verifyToken(refreshToken),
                db.refreshTokens.findOne({ token: refreshToken })
              ]);
              if (!checkInDB) {
                throw new ErrorWithStatus({
                  message: 'Refresh token is not exist',
                  status: httpStatus.UNAUTHORIZED
                });
              }
              req.decodeRefreshToken = decodeRefreshToken;
              if (decodeRefreshToken.payload.type !== TokenType.RefreshToken) {
                throw new ErrorWithStatus({
                  message: 'Type of token is not valid',
                  status: 401
                });
              }
            } catch (e: any) {
              throw new ErrorWithStatus({
                message: e.message,
                status: httpStatus.UNAUTHORIZED
              });
            }
            return true;
          }
        }
      }
    },
    ['body']
  )
);

const loginValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: 'This is not a valid email'
        },
        trim: true,
        notEmpty: {
          errorMessage: 'Missing required email'
        }
      },
      password: {
        trim: true,
        notEmpty: {
          errorMessage: 'Missing required password'
        }
      }
    },
    ['body']
  )
);

const registerValidator = validate(
  checkSchema(
    {
      name: {
        isLength: {
          options: { min: 1, max: 100 },
          errorMessage: 'Length of name must be between 1 and 100'
        },
        isString: true,
        notEmpty: {
          errorMessage: 'Missing required name'
        },
        trim: true
      },
      email: {
        notEmpty: {
          errorMessage: 'Missing required email'
        },
        isEmail: {
          errorMessage: 'This is not a valid email'
        },
        trim: true,
        custom: {
          options: async (value: string) => {
            const result = await usersService.checkEmailExists(value);
            if (result) {
              throw new Error('Email already exists');
            }
            return true;
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: 'Missing required password'
        },
        trim: true,
        isLength: {
          options: { min: 6, max: 50 },
          errorMessage: 'Length of password must be from 6 to 50'
        }
      },
      confirmPassword: {
        notEmpty: {
          errorMessage: 'Missing required confirm password'
        },
        trim: true,
        isLength: {
          options: { min: 6, max: 50 },
          errorMessage: 'Length of confirm password must be from 6 to 50'
        },
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error('Passwords do not match');
            }
            return true;
          }
        }
      },
      date_of_birth: {
        isISO8601: { options: { strict: true, strictSeparator: true } }
      }
    },
    ['body']
  )
);

const verifyEmailValidator = validate(
  checkSchema({
    emailVerifyToken: {
      custom: {
        options: async (value: string, { req }) => {
          const emailVerifyToken = req.body.emailVerifyToken;
          if (!emailVerifyToken) {
            throw new ErrorWithStatus({
              message: 'Email verify token is required',
              status: 401
            });
          }

          const decodeEmailVerifyToken = await verifyToken(emailVerifyToken);
          req.body.decodeEmailVerifyToken = decodeEmailVerifyToken;
          if (decodeEmailVerifyToken.payload.type !== TokenType.VerifyEmailToken) {
            throw new ErrorWithStatus({
              message: 'Type of token is not valid',
              status: 401
            });
          }

          return true;
        }
      }
    }
  })
);

export default {
  verifyEmailValidator,
  loginValidator,
  registerValidator,
  accessTokenValidator,
  refreshTokenValidator
};
