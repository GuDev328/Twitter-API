import { Collection, Db, MongoClient, ServerApiVersion } from 'mongodb';
import User from '~/models/schemas/UserSchema';
import dotenv from 'dotenv';
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

  get users(): Collection<User> {
    return this.db.collection('Users');
  }
}

const db = new DatabaseServices();
export default db;
