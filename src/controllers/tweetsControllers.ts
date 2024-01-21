import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { param } from 'express-validator';
import path from 'path';
import { TweetTypeEnum } from '~/constants/enum';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import { TweetRequest, getTweetRequest } from '~/models/requests/TweetRequest';
import tweetsService from '~/services/tweetsServices';

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequest>, res: Response) => {
  const result = await tweetsService.createNewTweet(req.body);
  res.status(200).json({
    result,
    message: 'Create new tweet suscess'
  });
};

export const getTweetController = async (req: Request<ParamsDictionary, any, getTweetRequest>, res: Response) => {
  const viewUpdated = await tweetsService.increaseViews(req.body);
  const result = {
    ...req.body.tweet,
    ...viewUpdated
  };
  res.status(200).json({
    result,
    message: 'Get tweet suscess'
  });
};

export const getTweetChildrenController = async (
  req: Request<ParamsDictionary, any, getTweetRequest>,
  res: Response
) => {
  const { id } = req.params;
  const tweet_type = Number(req.query.tweet_type as string) as TweetTypeEnum;
  const limit = Number(req.query.limit as string);
  const page = Number(req.query.page as string);
  const { total_page, result } = await tweetsService.getTweetChildren(id, tweet_type, limit, page);
  res.status(200).json({
    result,
    total_page,
    page,
    limit,
    tweet_type,
    message: 'Get tweet children suscess'
  });
};
