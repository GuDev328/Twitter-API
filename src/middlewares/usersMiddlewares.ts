import { Request, Response, NextFunction } from 'express';
import { checkSchema } from 'express-validator';
import db from '~/services/databaseServices';
import usersService from '~/services/usersServices';
import { validate } from '~/utils/validation';

const loginValidator = validate(
  checkSchema({
    email: {
      isEmail: true,
      trim: true,
      notEmpty: true
    },
    password: {
      trim: true,
      notEmpty: true
    }
  })
);

const registerValidator = validate(
  checkSchema({
    name: {
      isLength: { options: { min: 1, max: 100 } },
      isString: true,
      notEmpty: true,
      trim: true
    },
    email: {
      notEmpty: true,
      isEmail: true,
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
      notEmpty: true,
      trim: true,
      isLength: { options: { min: 6, max: 50 } }
    },
    confirmPassword: {
      notEmpty: true,
      trim: true,
      isLength: { options: { min: 6, max: 50 } },
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
