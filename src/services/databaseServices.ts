import { Collection, Db, MongoClient, ServerApiVersion } from 'mongodb';
import User from '~/models/schemas/UserSchema';
import dotenv from 'dotenv';
import Follower from '~/models/schemas/FollowerSchema';
import Bookmark from '~/models/schemas/BookmarkSchema';
import Hashtag from '~/models/schemas/HashtagSchema';
import Like from '~/models/schemas/LikeSchema';
import { RefreshToken } from '~/models/schemas/RefreshTokenSchema';
import Tweet from '~/models/schemas/TweetSchema';
import Conversation from '~/models/schemas/ConversationSchema';
dotenv.config();
const uri = process.env.MONGODB_URI;

class DatabaseServices {
  private client: MongoClient;
  private db: Db;
  constructor() {
    this.client = new MongoClient(uri!);
    this.db = this.client.db(process.env.DB_NAME);
  }

  async connect() {
    try {
      await this.client.connect();
      await this.db.command({ ping: 1 });
      console.log('Successfully connected to MongoDB!');
    } catch (e) {
      console.log(e);
    }
  }

  async indexUsersCollection() {
    if (!db.users.indexExists('username_text')) {
      await db.users.createIndex({ username: 'text' });
    }
    if (!db.users.indexExists('email_1')) {
      await db.users.createIndex({ email: 1 });
    }
  }

  async indexTweetsCollection() {
    if (!db.tweets.indexExists('user_id_1')) {
      await db.tweets.createIndex({ user_id: 1 });
    }
    if (!db.tweets.indexExists('parent_id_1')) {
      await db.tweets.createIndex({ parent_id: 1 });
    }
    if (!db.tweets.indexExists('content_text')) {
      await db.tweets.createIndex({ content: 'text' }, { default_language: 'none' });
    }
  }

  get users(): Collection<User> {
    return this.db.collection('Users');
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection('Bookmarks');
  }
  get followers(): Collection<Follower> {
    return this.db.collection('Followers');
  }
  get hashtags(): Collection<Hashtag> {
    return this.db.collection('Hashtags');
  }
  get likes(): Collection<Like> {
    return this.db.collection('Likes');
  }
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection('RefreshTokens');
  }
  get tweets(): Collection<Tweet> {
    return this.db.collection('Tweets');
  }
  get conversations(): Collection<Conversation> {
    return this.db.collection('Conversations');
  }
}

const db = new DatabaseServices();
export default db;
