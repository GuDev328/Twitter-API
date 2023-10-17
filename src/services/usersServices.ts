import User from '~/models/schemas/UserSchema';
import db from '~/services/databaseServices';

class UsersService {
  constructor() {}
  async login(payload: { email: string; password: string }) {}

  async register(payload: { email: string; password: string }) {
    const { email, password } = payload;
    const result = await db.users.insertOne(
      new User({
        email,
        password
      })
    );
    return result;
  }
}

const usersService = new UsersService();
export default usersService;
