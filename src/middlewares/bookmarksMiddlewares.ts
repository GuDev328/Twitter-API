import { Request, Response, NextFunction } from 'express';
import { body, checkSchema } from 'express-validator';
import { ObjectId } from 'mongodb';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import db from '~/services/databaseServices';
import { validate } from '~/utils/validation';

export const bookmarkValidator = validate(
  checkSchema({
    tweet_id: {
      isString: { errorMessage: 'Tweet id must be a string' },
      custom: {
        options: async (value: string, { req }) => {
          if (!ObjectId.isValid(value)) {
            throw new ErrorWithStatus({
              status: httpStatus.UNPROCESSABLE_ENTITY,
              message: 'Tweet id is not valid'
            });
          }
          return true;
        }
      }
    }
  })
);
