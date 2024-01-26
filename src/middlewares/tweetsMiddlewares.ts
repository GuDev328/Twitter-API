import { Request, Response, NextFunction } from 'express';
import { body, checkSchema } from 'express-validator';
import { request } from 'http';
import { JwtPayload } from 'jsonwebtoken';
import { isEmpty } from 'lodash';
import { ObjectId } from 'mongodb';
import { TokenType, TweetAudience, TweetTypeEnum, MediaType, UserVerifyStatus, Media } from '~/constants/enum';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import Tweet from '~/models/schemas/TweetSchema';
import db from '~/services/databaseServices';
import usersService from '~/services/usersServices';
import { numberEnumtoArray } from '~/utils/common';
import { verifyToken } from '~/utils/jwt';
import { validate } from '~/utils/validation';

const TweetTypes = numberEnumtoArray(TweetTypeEnum);
const TweetAudienceTypes = numberEnumtoArray(TweetAudience);
const MediaTypes = numberEnumtoArray(MediaType);

export const createTweetValidator = validate(
  checkSchema({
    type: {
      custom: {
        options: async (value: string, { req }) => {
          if (!TweetTypes.includes(parseInt(value))) {
            throw new ErrorWithStatus({
              status: httpStatus.UNPROCESSABLE_ENTITY,
              message: 'Tweet type is not valid'
            });
          }
          return true;
        }
      }
    },
    audience: {
      custom: {
        options: async (value: string, { req }) => {
          if (!TweetAudienceTypes.includes(parseInt(value))) {
            throw new ErrorWithStatus({
              status: httpStatus.UNPROCESSABLE_ENTITY,
              message: 'Audience type is not valid'
            });
          }
          return true;
        }
      }
    },
    content: {
      isString: { errorMessage: 'Tweet content must be a string' },
      custom: {
        options: async (value: string, { req }) => {
          const type = req.body.type as TweetTypeEnum;
          if (type === TweetTypeEnum.Retweet) {
            if (value !== '') {
              throw new ErrorWithStatus({
                status: httpStatus.UNPROCESSABLE_ENTITY,
                message: 'Tweet content must be empty for Retweet'
              });
            }
          } else if (
            (type === TweetTypeEnum.QuoteTweet || type === TweetTypeEnum.Comment || type === TweetTypeEnum.Tweet) &&
            isEmpty(req.body.mentions) &&
            isEmpty(req.body.hashtags) &&
            value === ''
          ) {
            throw new ErrorWithStatus({
              status: httpStatus.UNPROCESSABLE_ENTITY,
              message: 'Missing required content'
            });
          }
          return true;
        }
      }
    },
    parent_id: {
      custom: {
        options: async (value: string, { req }) => {
          const type = req.body.type as TweetTypeEnum;
          if (type === TweetTypeEnum.Retweet || type === TweetTypeEnum.Comment || type === TweetTypeEnum.QuoteTweet) {
            const parent_id = req.body.parent_id;
            if (parent_id) {
              const parentTweet = await db.tweets.findOne({ _id: new ObjectId(parent_id) });
              if (!parentTweet) {
                throw new ErrorWithStatus({
                  status: httpStatus.NOT_FOUND,
                  message: 'Parent tweet not found'
                });
              }
            } else {
              throw new ErrorWithStatus({
                status: httpStatus.UNPROCESSABLE_ENTITY,
                message: 'Missing parent tweet id'
              });
            }
          } else if (type === TweetTypeEnum.Tweet) {
            const parent_id = req.body.parent_id;
            if (parent_id) {
              throw new ErrorWithStatus({
                status: httpStatus.UNPROCESSABLE_ENTITY,
                message: 'Parent_id must be null for tweet type'
              });
            }
          }
          return true;
        }
      }
    },
    hashtags: {
      isArray: { errorMessage: 'Hashtags must be an array' },
      custom: {
        options: async (value: string[], { req }) => {
          if (!value.every((hashtag) => typeof hashtag === 'string')) {
            throw new ErrorWithStatus({
              message: 'Hashtags must be an array of strings',
              status: httpStatus.UNPROCESSABLE_ENTITY
            });
          }
        }
      }
    },
    mentions: {
      isArray: { errorMessage: 'mentions must be an array' },
      custom: {
        options: async (value: string[], { req }) => {
          if (!value.every((mention) => ObjectId.isValid(mention))) {
            throw new ErrorWithStatus({
              message: 'mentions must be an array of string ObjectId',
              status: httpStatus.UNPROCESSABLE_ENTITY
            });
          }
        }
      }
    },
    medias: {
      isArray: { errorMessage: 'medias must be an array' },
      custom: {
        options: async (value: Media[], { req }) => {
          if (
            !value.every((media) => {
              return typeof media.url === 'string' && MediaTypes.includes(media.type);
            })
          ) {
            throw new ErrorWithStatus({
              message: 'Media must be an array of object with MediaType',
              status: httpStatus.UNPROCESSABLE_ENTITY
            });
          }
        }
      }
    }
  })
);

export const tweetIdValidator = validate(
  checkSchema({
    id: {
      isString: { errorMessage: 'tweetId must be a string' },
      custom: {
        options: async (value: string, { req }) => {
          if (!ObjectId.isValid(value)) {
            throw new ErrorWithStatus({
              status: httpStatus.UNPROCESSABLE_ENTITY,
              message: 'tweetId is not valid'
            });
          }
          const tweet = (
            await db.tweets
              .aggregate<Tweet>([
                {
                  $match: {
                    _id: new ObjectId(value)
                  }
                },
                {
                  $lookup: {
                    from: 'Hashtags',
                    localField: 'hashtags',
                    foreignField: '_id',
                    as: 'hashtags'
                  }
                },
                {
                  $lookup: {
                    from: 'Users',
                    localField: 'mentions',
                    foreignField: '_id',
                    as: 'mentions'
                  }
                },
                {
                  $addFields: {
                    mentions: {
                      $map: {
                        input: '$mentions',
                        as: 'mention',
                        in: {
                          _id: '$$mention._id',
                          name: '$$mention.name',
                          email: '$$mention.email',
                          username: '$$mention.username',
                          avatar: '$$mention.avatar'
                        }
                      }
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'Bookmarks',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'bookmarks'
                  }
                },
                {
                  $lookup: {
                    from: 'Likes',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'likes'
                  }
                },
                {
                  $lookup: {
                    from: 'Tweets',
                    localField: '_id',
                    foreignField: 'parent_id',
                    as: 'tweet_child'
                  }
                },
                {
                  $addFields: {
                    bookmarks: {
                      $size: '$bookmarks'
                    },
                    likes: {
                      $size: '$likes'
                    },
                    retweet: {
                      $size: {
                        $filter: {
                          input: '$tweet_child',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', 1]
                          }
                        }
                      }
                    },
                    comment: {
                      $size: {
                        $filter: {
                          input: '$tweet_child',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', 2]
                          }
                        }
                      }
                    },
                    quote_tweet: {
                      $size: {
                        $filter: {
                          input: '$tweet_child',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', 3]
                          }
                        }
                      }
                    }
                  }
                },
                {
                  $project: {
                    tweet_child: 0
                  }
                }
              ])
              .toArray()
          )[0];
          if (!tweet) {
            throw new ErrorWithStatus({
              status: httpStatus.NOT_FOUND,
              message: 'Tweet not found'
            });
          }
          req.body.tweet = tweet;
          return true;
        }
      }
    }
  })
);

export const audienceValidator = async (req: Request, res: Response, next: NextFunction) => {
  const { tweet } = req.body as { tweet: Tweet };
  if (tweet.audience === TweetAudience.TwitterCircle) {
    if (!req.body.decodeAuthorization) {
      throw new ErrorWithStatus({
        status: httpStatus.UNAUTHORIZED,
        message: 'Missing authorization'
      });
    }

    const author = await db.users.findOne({ _id: new ObjectId(tweet.user_id) });
    if (!author || author.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        status: httpStatus.NOT_FOUND,
        message: 'User not found'
      });
    }

    const userId = req.body.decodeAuthorization.payload.userId;
    const authorCircle = author.twitter_circle;
    const isInTweetCircle = authorCircle?.some((userCircleId) => userCircleId.equals(userId));
    if (!author._id.equals(userId)) {
      if (!isInTweetCircle) {
        throw new ErrorWithStatus({
          status: httpStatus.FORBIDDEN,
          message: 'User not in tweet circle'
        });
      }
    }
  }
  next();
};

export const getTweetChildrenValidator = validate(
  checkSchema({
    tweet_type: {
      isIn: { options: [TweetTypeEnum], errorMessage: 'Invalid tweet type' }
    },
    limit: {
      isNumeric: { errorMessage: 'Limit is a number' },
      custom: {
        options: (value: number) => {
          const num = Number(value);
          if (num > 50 || num < 1) {
            throw new Error('Limit must be between 1 and 50');
          }
          return true;
        }
      }
    },
    page: {
      isNumeric: { errorMessage: 'Page must is a number' },
      custom: {
        options: (value: number) => {
          const num = Number(value);
          if (num < 1) {
            throw new Error('Page cannot be less than 1');
          }
          return true;
        }
      }
    }
  })
);

export const getNewFeedsValidator = validate(
  checkSchema({
    limit: {
      isNumeric: { errorMessage: 'Limit is a number' },
      custom: {
        options: (value: number) => {
          const num = Number(value);
          if (num > 50 || num < 1) {
            throw new Error('Limit must be between 1 and 50');
          }
          return true;
        }
      }
    },
    page: {
      isNumeric: { errorMessage: 'Page must is a number' },
      custom: {
        options: (value: number) => {
          const num = Number(value);
          if (num < 1) {
            throw new Error('Page cannot be less than 1');
          }
          return true;
        }
      }
    }
  })
);
