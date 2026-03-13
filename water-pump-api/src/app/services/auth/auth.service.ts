import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/app/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel('User') private userModel: Model<User>
  ) { }

  async login(user: User): Promise<{ token: string; id: string } | null> {
    const { login, password } = user;
    const existingUser = await this.userModel.findOne({ login }).exec();

    if (existingUser && await bcrypt.compare(password, existingUser.password)) {
      const token = this.jwtService.sign({ login });
      const id = existingUser._id.toString()
      return { token, id };
    }

    return null;
  }

  async register(user: User): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser = new this.userModel({ ...user, password: hashedPassword });
    return newUser.save();
  }

  async createDefaultAdmin(): Promise<void> {
    const login = this.configService.get<string>('ADMIN_LOGIN') || 'admin';
    const password = this.configService.get<string>('ADMIN_PASSWORD') || 'admin';

    const existingAdmin = await this.userModel.findOne({ login }).exec();
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = new this.userModel({
        login,
        password: hashedPassword,
        role: 'admin',
      });
      await newAdmin.save();
      console.log(`✅ Администратор создан: логин "${login}", пароль "${password}"`);
    } else {
      console.log('ℹ️ Администратор уже существует');
    }
  }

  async findByLogin(login: string): Promise<User | null> {
    return this.userModel.findOne({ login }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }
}
