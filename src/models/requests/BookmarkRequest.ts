import { JwtPayload } from 'jsonwebtoken';
import { Media, TweetAudience, TweetTypeEnum } from '~/constants/enum';

export interface BookmarkRequest {
  decodeAuthorization: JwtPayload;
  tweet_id: string;
}
