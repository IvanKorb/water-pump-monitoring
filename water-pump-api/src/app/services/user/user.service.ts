import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/app/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) { }

  async getUsers(): Promise<User[]> {
    return this.userModel.find({ role: { $ne: 'admin' } }).exec();
  }

  async createUser(user: User): Promise<User> {
    const existingUser = await this.userModel.findOne({ login: user.login });
    if (existingUser) {
      throw new HttpException('Пользователь с таким логином уже существует.', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser = new this.userModel({
      ...user,
      password: hashedPassword
    });

    return newUser.save();
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const existingUser = await this.userModel.findById(id).exec();

    if (!existingUser) {
      throw new HttpException('Пользователь не найден.', HttpStatus.NOT_FOUND);
    }
    if (user.password && user.password.trim() !== '') {
      user.password = await bcrypt.hash(user.password, 10);
    } else {
      delete user.password;
    }

    Object.assign(existingUser, user);

    return existingUser.save();
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userModel.findByIdAndUpdate(id, { password: hashedPassword }).exec();
  }

  async deleteUser(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new HttpException('Пользователь не найден.', HttpStatus.NOT_FOUND);
    }
  }
}
