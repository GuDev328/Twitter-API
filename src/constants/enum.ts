export enum UserVerifyStatus {
  Unverified,
  Verified,
  Banned
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  FogotPasswordToken,
  VerifyEmailToken
}

export interface Media {
  url: string;
  type: MediaType; // video, image
}
export enum MediaType {
  Image,
  Video,
  VideoHLS
}
export enum TweetAudience {
  Everyone, // 0
  TwitterCircle // 1
}
export enum TweetTypeEnum {
  Tweet,
  Retweet,
  Comment,
  QuoteTweet
}
