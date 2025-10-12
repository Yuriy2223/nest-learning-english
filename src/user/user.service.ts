import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { UserDto } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(email: string, password: string, name?: string): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({
      email,
      password: hashedPassword,
      name,
      roles: ['user'],
      isEmailVerified: false,
    });

    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  async createGoogleUser(
    email: string,
    googleId: string,
    name: string,
    avatar?: string,
  ): Promise<UserDocument> {
    const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
    const user = new this.userModel({
      email,
      password: randomPassword,
      googleId,
      name,
      avatar,
      roles: ['user'],
      isEmailVerified: true,
    });

    return user.save();
  }

  async updateGoogleUser(
    userId: string,
    googleId: string,
    name: string,
    avatar?: string,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { googleId, name, avatar, isEmailVerified: true }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async verifyEmail(userId: string): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { isEmailVerified: true }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userModel.findByIdAndUpdate(userId, { password: hashedPassword }).exec();
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async findAll(): Promise<UserDto[]> {
    const users = await this.userModel.find().exec();
    return users.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      name: u.name,
      avatar: u.avatar,
      roles: u.roles,
      googleId: u.googleId,
      isEmailVerified: u.isEmailVerified,
    }));
  }

  async updateProfile(
    userId: string,
    updateData: { name?: string; avatar?: string },
  ): Promise<UserDto> {
    const user = await this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      roles: user.roles,
      isEmailVerified: user.isEmailVerified,
    };
  }

  async updateRoles(userId: string, roles: string[]): Promise<UserDto> {
    const validRoles = ['user', 'admin', 'moderator'];
    const invalidRoles = roles.filter((role) => !validRoles.includes(role));

    if (invalidRoles.length > 0) {
      throw new ConflictException(`Invalid roles: ${invalidRoles.join(', ')}`);
    }

    const user = await this.userModel.findByIdAndUpdate(userId, { roles }, { new: true }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      roles: user.roles,
      isEmailVerified: user.isEmailVerified,
    };
  }
}
