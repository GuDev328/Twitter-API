import { Request, Response, NextFunction } from 'express';
import { body, checkSchema } from 'express-validator';
import { request } from 'http';
import { JwtPayload } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { TokenType, UserVerifyStatus } from '~/constants/enum';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import db from '~/services/databaseServices';
import usersService from '~/services/usersServices';
import { verifyToken } from '~/utils/jwt';
import { validate } from '~/utils/validation';

export const accessTokenValidator = validate(
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
              req.body.decodeAuthorization = decodeAuthorization;
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

export const refreshTokenValidator = validate(
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
              req.body.decodeRefreshToken = decodeRefreshToken;
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

export const loginValidator = validate(
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

export const registerValidator = validate(
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
      username: {
        notEmpty: {
          errorMessage: 'Missing required username'
        },
        trim: true,
        custom: {
          options: async (value: string) => {
            const result = await usersService.checkUsernameExists(value);
            if (result) {
              throw new Error('Username already exists');
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

export const verifyEmailValidator = validate(
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

export const forgotPasswordValidator = validate(
  checkSchema({
    email: {
      isEmail: { errorMessage: 'Must be a valid email' },
      trim: true,
      notEmpty: { errorMessage: 'Missing required email' },
      custom: {
        options: async (value, { req }) => {
          const user = await usersService.checkEmailExists(value);
          if (!user) {
            throw new ErrorWithStatus({
              status: httpStatus.NOT_FOUND,
              message: 'User not found'
            });
          }
          req.body.user = user;
          return true;
        }
      }
    }
  })
);

export const verifyForgotPasswordValidator = validate(
  checkSchema(
    {
      forgotPasswordToken: {
        notEmpty: {
          errorMessage: 'forgotPasswordToken is required'
        },
        custom: {
          options: async (value: string, { req }) => {
            const forgotPasswordToken = req.body.forgotPasswordToken;
            const decodeForgotPasswordToken = await verifyToken(forgotPasswordToken);
            if (decodeForgotPasswordToken.payload.type !== TokenType.FogotPasswordToken) {
              throw new ErrorWithStatus({
                message: 'Type of token is not valid',
                status: 401
              });
            }

            const user = await db.users.findOne({ _id: new ObjectId(decodeForgotPasswordToken.payload.userId) });
            if (!user) {
              throw new ErrorWithStatus({
                status: httpStatus.UNAUTHORIZED,
                message: 'User not found'
              });
            }
            if (value !== user.forgotPasswordToken) {
              throw new ErrorWithStatus({
                status: httpStatus.UNAUTHORIZED,
                message: 'forgotPasswordToken do not match'
              });
            }
            req.body.user = user;
            return true;
          }
        }
      }
    },
    ['body']
  )
);

export const resetPasswordValidator = validate(
  checkSchema({
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
    }
  })
);

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.body.decodeAuthorization.payload;
  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorWithStatus({
        message: 'User not Verified',
        status: httpStatus.FORBIDDEN
      })
    );
  }
  next();
};

export const updateMeValidator = validate(
  checkSchema({
    name: {
      optional: true,
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
    date_of_birth: {
      optional: true,
      isISO8601: { options: { strict: true, strictSeparator: true } }
    },
    bio: {
      optional: true,
      isString: { errorMessage: 'Bio must be a string' },
      isLength: {
        options: { min: 1, max: 200 },
        errorMessage: 'Length of bio must be between 1 and 200'
      }
    },
    location: {
      optional: true,
      isString: { errorMessage: 'Location must be a string' }
    },
    website: {
      optional: true,
      isURL: { errorMessage: 'Website must be a URL' }
    },
    username: {
      optional: true,
      isString: { errorMessage: 'Username must be a string' },
      isLength: {
        options: { min: 1, max: 25 },
        errorMessage: 'Length of username must be between 1 and 200'
      },
      custom: {
        options: async (value: string) => {
          const result = await usersService.checkUsernameExists(value);
          if (result) {
            throw new Error('Username already exists');
          }
          return true;
        }
      }
    },
    avatar: {
      optional: true,
      isURL: { errorMessage: 'Avatar must be a URL' },
      trim: true
    },
    cover_photo: {
      optional: true,
      isURL: { errorMessage: 'Cover photo must be a URL' },
      trim: true
    }
  })
);

export const followValidator = validate(
  checkSchema({
    userId: {
      notEmpty: { errorMessage: 'userId must not be empty' },
      custom: {
        options: async (value, { req }) => {
          const user = await usersService.checkUserIdExists(value);
          if (!user) {
            throw new ErrorWithStatus({
              status: httpStatus.NOT_FOUND,
              message: 'User not found'
            });
          }
          return true;
        }
      }
    }
  })
);

export const unfollowValidator = validate(
  checkSchema({
    userId: {
      notEmpty: { errorMessage: 'userId must not be empty' },
      custom: {
        options: async (value, { req }) => {
          const user = await usersService.checkUserIdExists(value);
          if (!user) {
            throw new ErrorWithStatus({
              status: httpStatus.NOT_FOUND,
              message: 'User not found'
            });
          }
          return true;
        }
      }
    }
  })
);

export const changePasswordValidator = validate(
  checkSchema({
    oldPassword: {
      notEmpty: {
        errorMessage: 'Missing required password'
      },
      trim: true
    },
    newPassword: {
      notEmpty: {
        errorMessage: 'Missing required new password'
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
          if (value !== req.body.newPassword) {
            throw new Error('Passwords do not match');
          }
          return true;
        }
      }
    }
  })
);
