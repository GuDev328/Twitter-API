import { Request } from 'express';
import path from 'path';
import db from '~/services/databaseServices';
import { config } from 'dotenv';
import { TweetRequest } from '~/models/requests/TweetRequest';
import Tweet from '~/models/schemas/TweetSchema';
import { ObjectId } from 'mongodb';
import { stringArrayToObjectIdArray } from '~/utils/common';
import Hashtag from '~/models/schemas/HashtagSchema';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
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
}

const tweetsService = new TweetsService();
export default tweetsService;
