import { Request } from 'express';
import path from 'path';
import db from '~/services/databaseServices';
import { config } from 'dotenv';
import { TweetRequest, getTweetRequest } from '~/models/requests/TweetRequest';
import Tweet from '~/models/schemas/TweetSchema';
import { ObjectId } from 'mongodb';
import { stringArrayToObjectIdArray } from '~/utils/common';
import Hashtag from '~/models/schemas/HashtagSchema';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import { TweetTypeEnum } from '~/constants/enum';
config();

class TweetsService {
  constructor() {}

  async getHashtagsId(hashtags: string[]) {
    const hashtagsId: ObjectId[] = [];
    hashtags.map(async (tag) => {
      if (tag.startsWith('#')) {
        tag = tag.replace('#', '');
      }
      const tagInDb = await db.hashtags.findOne({ name: tag });
      if (tagInDb) {
        hashtagsId.push(tagInDb._id);
      } else {
        const createTag = await db.hashtags.insertOne(new Hashtag({ name: tag }));
        hashtagsId.push(createTag.insertedId);
      }
    });
    return hashtagsId;
  }

  async createNewTweet(payload: TweetRequest) {
    const tweet = new Tweet({
      user_id: payload.decodeAuthorization.payload.userId,
      type: payload.type,
      audience: payload.audience,
      content: payload.content,
      parent_id: payload.parent_id ? new ObjectId(payload.parent_id) : null, //  chỉ null khi tweet gốc
      hashtags: await this.getHashtagsId(payload.hashtags),
      mentions: payload.mentions.map((tag) => new ObjectId(tag)),
      medias: payload.medias,
      guest_views: 0,
      user_views: 0
    });
    const createTweet = await db.tweets.insertOne(tweet);
    return createTweet.insertedId;
  }

  async increaseViews(payload: getTweetRequest) {
    const inc = payload.decodeAuthorization ? { user_views: 1 } : { guest_views: 1 };
    const result = await db.tweets.findOneAndUpdate(
      { _id: new ObjectId(payload.tweet._id) },
      { $inc: inc, $currentDate: { updated_at: true } },
      { returnDocument: 'after', projection: { user_views: 1, guest_views: 1, updated_at: 1 } }
    );
    return result;
  }

  async getTweetChildren(tweet_id: string, tweet_type: TweetTypeEnum, limit: number, page: number, isUser: boolean) {
    const result = await db.tweets
      .aggregate<Tweet>([
        {
          $match: {
            parent_id: new ObjectId(tweet_id),
            type: tweet_type
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
                    $eq: ['$$item.type', TweetTypeEnum.Retweet]
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
                    $eq: ['$$item.type', TweetTypeEnum.Comment]
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
                    $eq: ['$$item.type', TweetTypeEnum.QuoteTweet]
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
        },
        {
          $skip: limit * (page - 1)
        },
        {
          $limit: limit
        }
      ])
      .toArray();
    const ids = result.map((tweet) => tweet._id as ObjectId);
    const inc = isUser ? { user_views: 1 } : { guest_views: 1 };
    const dateUpdate = new Date();
    await db.tweets.updateMany(
      {
        _id: {
          $in: ids
        }
      },
      {
        $inc: inc,
        $set: { updated_at: dateUpdate }
      }
    );

    result.forEach((tweet) => {
      tweet.updated_at = dateUpdate;
      if (isUser) {
        tweet.user_views += 1;
      } else {
        tweet.guest_views += 1;
      }
    });

    const total = await db.tweets.countDocuments({
      parent_id: new ObjectId(tweet_id),
      type: tweet_type
    });

    return { total_page: Math.ceil(total / limit), result };
  }

  async getNewsFeed(userId: string, limit: number, page: number) {
    const listFollower = await db.followers
      .find(
        { user_id: new ObjectId(userId) },
        {
          projection: {
            followed_user_id: 1,
            _id: 0
          }
        }
      )
      .toArray();
    const listUserId = listFollower.map((follower) => follower.followed_user_id);
    listUserId.push(new ObjectId(userId));

    const [result, count] = await Promise.all([
      db.tweets
        .aggregate<Tweet>([
          {
            $match: {
              user_id: {
                $in: listUserId
              }
            }
          },
          {
            $lookup: {
              from: 'Users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'user.twitter_circle': {
                        $in: [new ObjectId(userId)]
                      }
                    }
                  ]
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'user._id': {
                        $in: [new ObjectId(userId)]
                      }
                    }
                  ]
                }
              ]
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
                      $eq: ['$$item.type', TweetTypeEnum.Retweet]
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
                      $eq: ['$$item.type', TweetTypeEnum.Comment]
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
                      $eq: ['$$item.type', TweetTypeEnum.QuoteTweet]
                    }
                  }
                }
              }
            }
          },
          {
            $project: {
              tweet_child: 0,
              user: {
                password: 0,
                created_at: 0,
                emailVerifyToken: 0,
                forgotPasswordToken: 0,
                updated_at: 0,
                twitter_circle: 0
              }
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
          }
        ])
        .toArray(),
      db.tweets
        .aggregate([
          {
            $match: {
              user_id: {
                $in: listUserId
              }
            }
          },
          {
            $lookup: {
              from: 'Users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'user.twitter_circle': {
                        $in: [new ObjectId(userId)]
                      }
                    }
                  ]
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'user._id': {
                        $in: [new ObjectId(userId)]
                      }
                    }
                  ]
                }
              ]
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
                      $eq: ['$$item.type', TweetTypeEnum.Retweet]
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
                      $eq: ['$$item.type', TweetTypeEnum.Comment]
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
                      $eq: ['$$item.type', TweetTypeEnum.QuoteTweet]
                    }
                  }
                }
              }
            }
          },
          {
            $project: {
              tweet_child: 0,
              user: {
                password: 0,
                created_at: 0,
                emailVerifyToken: 0,
                forgotPasswordToken: 0,
                updated_at: 0,
                twitter_circle: 0
              }
            }
          },
          {
            $count: 'total'
          }
        ])
        .toArray()
    ]);
    const listTweetId = result.map((item) => item._id);
    const date = new Date();
    await db.tweets.updateMany(
      {
        _id: { $in: listTweetId }
      },
      {
        $inc: { user_views: 1 },
        $set: { updated_at: date }
      }
    );
    result.forEach((item) => {
      (item.user_views += 1), (item.updated_at = date);
    });
    return { total_page: Math.ceil(count[0]?.total / limit), result };
  }
}

const tweetsService = new TweetsService();
export default tweetsService;
