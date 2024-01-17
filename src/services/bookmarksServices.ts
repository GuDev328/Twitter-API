import db from '~/services/databaseServices';
import { config } from 'dotenv';
import { ObjectId } from 'mongodb';
import { BookmarkRequest } from '~/models/requests/BookmarkRequest';
import Bookmark from '~/models/schemas/BookmarkSchema';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';

config();

class BookmarksService {
  constructor() {}

  async bookmark(payload: BookmarkRequest) {
    const checkInDb = await db.bookmarks.findOne({
      user_id: payload.decodeAuthorization.payload.userId,
      tweet_id: new ObjectId(payload.tweet_id)
    });
    if (checkInDb) {
      throw new ErrorWithStatus({
        message: 'Bookmark already exist',
        status: httpStatus.BAD_REQUEST
      });
    }
    const bookmark = new Bookmark({
      user_id: payload.decodeAuthorization.payload.userId,
      tweet_id: new ObjectId(payload.tweet_id)
    });
    const createBookmark = await db.bookmarks.insertOne(bookmark);
    return createBookmark.insertedId;
  }

  async unbookmark(payload: BookmarkRequest) {
    const checkInDb = await db.bookmarks.findOne({
      user_id: payload.decodeAuthorization.payload.userId,
      tweet_id: new ObjectId(payload.tweet_id)
    });
    if (!checkInDb) {
      throw new ErrorWithStatus({
        message: 'Bookmark is not exist',
        status: httpStatus.BAD_REQUEST
      });
    }
    const result = await db.bookmarks.deleteOne({
      user_id: payload.decodeAuthorization.payload.userId,
      tweet_id: new ObjectId(payload.tweet_id)
    });
    return result.deletedCount;
  }
}

const bookmarksService = new BookmarksService();
export default bookmarksService;
