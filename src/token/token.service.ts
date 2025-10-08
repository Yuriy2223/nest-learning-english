import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Token, TokenDocument } from './schemas/token.schema';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class TokensService {
  constructor(@InjectModel(Token.name) private tokenModel: Model<TokenDocument>) {}

  async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.tokenModel
      .findOneAndUpdate({ userId }, { refreshToken: hashedToken }, { upsert: true, new: true })
      .exec();
  }

  async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const tokenDoc = await this.tokenModel.findOne({ userId }).exec();
    if (!tokenDoc || !tokenDoc.refreshToken) {
      return false;
    }
    return bcrypt.compare(refreshToken, tokenDoc.refreshToken);
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await this.tokenModel.findOneAndUpdate({ userId }, { $unset: { refreshToken: '' } }).exec();
  }

  async createResetPasswordToken(userId: string): Promise<string> {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const expiresAt = new Date(Date.now() + 3600000);

    await this.tokenModel
      .findOneAndUpdate(
        { userId },
        {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: expiresAt,
        },
        { upsert: true, new: true },
      )
      .exec();

    return resetToken;
  }

  async validateResetPasswordToken(userId: string, resetToken: string): Promise<boolean> {
    const tokenDoc = await this.tokenModel.findOne({ userId }).exec();
    if (
      !tokenDoc ||
      !tokenDoc.resetPasswordToken ||
      !tokenDoc.resetPasswordExpires ||
      tokenDoc.resetPasswordExpires < new Date()
    ) {
      return false;
    }
    return bcrypt.compare(resetToken, tokenDoc.resetPasswordToken);
  }

  async removeResetPasswordToken(userId: string): Promise<void> {
    await this.tokenModel
      .findOneAndUpdate(
        { userId },
        { $unset: { resetPasswordToken: '', resetPasswordExpires: '' } },
      )
      .exec();
  }

  async createEmailVerificationToken(userId: string): Promise<string> {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(verificationToken, 10);
    const expiresAt = new Date(Date.now() + 86400000);

    await this.tokenModel
      .findOneAndUpdate(
        { userId },
        {
          emailVerificationToken: hashedToken,
          emailVerificationExpires: expiresAt,
        },
        { upsert: true, new: true },
      )
      .exec();

    return verificationToken;
  }

  async validateEmailVerificationToken(
    userId: string,
    verificationToken: string,
  ): Promise<boolean> {
    const tokenDoc = await this.tokenModel.findOne({ userId }).exec();
    if (
      !tokenDoc ||
      !tokenDoc.emailVerificationToken ||
      !tokenDoc.emailVerificationExpires ||
      tokenDoc.emailVerificationExpires < new Date()
    ) {
      return false;
    }
    return bcrypt.compare(verificationToken, tokenDoc.emailVerificationToken);
  }

  async removeEmailVerificationToken(userId: string): Promise<void> {
    await this.tokenModel
      .findOneAndUpdate(
        { userId },
        { $unset: { emailVerificationToken: '', emailVerificationExpires: '' } },
      )
      .exec();
  }
}
