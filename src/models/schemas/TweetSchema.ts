import { ObjectId } from 'mongodb';
import { Media, TweetAudience, TweetTypeEnum } from '~/constants/enum';

interface TweetType {
  _id?: ObjectId;
  user_id: ObjectId;
  type: TweetTypeEnum;
  audience: TweetAudience;
  content: string;
  parent_id: null | ObjectId; //  chỉ null khi tweet gốc
  hashtags: ObjectId[];
  mentions: ObjectId[];
  medias: Media[];
  guest_views: number;
  user_views: number;
  created_at?: Date;
  updated_at?: Date;
}

export default class Tweet {
  _id: ObjectId;
  user_id: ObjectId;
  type: TweetTypeEnum;
  audience: TweetAudience;
  content: string;
  parent_id: null | ObjectId; //  chỉ null khi tweet gốc
  hashtags: ObjectId[];
  mentions: ObjectId[];
  medias: Media[];
  guest_views: number;
  user_views: number;
  created_at: Date;
  updated_at: Date;

  constructor(tweet: TweetType) {
    this._id = tweet._id || new ObjectId();
    this.user_id = tweet.user_id || new ObjectId();
    this.type = tweet.type || TweetTypeEnum.Tweet;
    this.audience = tweet.audience || TweetAudience.Everyone;
    this.content = tweet.content || '';
    this.parent_id = tweet.parent_id || null; //  chỉ null khi tweet gốc
    this.hashtags = tweet.hashtags || [];
    this.mentions = tweet.mentions || [];
    this.medias = tweet.medias || [];
    this.guest_views = tweet.guest_views || 0;
    this.user_views = tweet.user_views || 0;
    this.created_at = tweet.created_at || new Date();
    this.updated_at = tweet.updated_at || new Date();
  }
}
