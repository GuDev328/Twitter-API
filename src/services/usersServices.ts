import { RegisterRequest } from '~/models/requests/UserRequests';
import bcrypt from 'bcrypt';
import User from '~/models/schemas/UserSchema';
import db from '~/services/databaseServices';
import { signToken } from '~/utils/jwt';
import { TokenType } from '~/constants/enum';

class UsersService {
  constructor() {}
  signAccessToken(userId: string) {
    return signToken(
      {
        payload: {
          userId,
          type: TokenType.AccessToken
        }
      },
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    );
  }

  signRefreshToken(userId: string) {
    return signToken(
      {
        payload: {
          userId,
          type: TokenType.RefreshToken
        }
      },
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    );
  }

  async login(payload: { email: string; password: string }) {}

  async register(payload: RegisterRequest) {
    const saltRounds = 10;
    payload.password = await bcrypt.hashSync(payload.password, saltRounds);
    const result = await db.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth)
      })
    );
    const userId = result.insertedId.toString();
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(userId),
      this.signRefreshToken(userId)
    ]);
    return {
      accessToken,
      refreshToken
    };
  }

  async checkEmailExists(email: string) {
    const users = await db.users.findOne({ email });
    if (users) {
      return true;
    } else return false;
  }
}

const usersService = new UsersService();
export default usersService;
