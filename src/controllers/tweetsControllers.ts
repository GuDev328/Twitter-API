import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { param } from 'express-validator';
import path from 'path';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import { TweetRequest } from '~/models/requests/TweetRequest';
import tweetsService from '~/services/tweetsServices';

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequest>, res: Response) => {
  const result = await tweetsService.createNewTweet(req.body);
  res.status(200).json({
    result,
    message: 'Create new tweet suscess'
  });
};

export const getTweetController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = req.body.tweet;
  res.status(200).json({
    result,
    message: 'Get tweet suscess'
  });
};
