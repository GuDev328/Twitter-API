import { JwtPayload } from 'jsonwebtoken';
import { Media, TweetAudience, TweetTypeEnum } from '~/constants/enum';

export interface TweetRequest {
  decodeAuthorization: JwtPayload;
  type: TweetTypeEnum;
  audience: TweetAudience;
  content: string;
  parent_id: null | string; //  chỉ null khi tweet gốc
  hashtags: string[];
  mentions: string[];
  medias: Media[];
}
