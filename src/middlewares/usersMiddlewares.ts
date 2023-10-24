import { Request, Response, NextFunction } from 'express';
import { checkSchema } from 'express-validator';
import { request } from 'http';
import { ErrorWithStatus } from '~/models/Errors';
import db from '~/services/databaseServices';
import usersService from '~/services/usersServices';
import { validate } from '~/utils/validation';

const loginValidator = validate(
  checkSchema({
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
  })
);

const registerValidator = validate(
  checkSchema({
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
  })
);

export default { loginValidator, registerValidator };
