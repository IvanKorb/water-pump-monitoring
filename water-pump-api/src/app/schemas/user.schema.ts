import { Schema, Document } from 'mongoose';

export interface User extends Document {
  login: string;
  password: string;
  name?: string;
  role?: string;
  dateCreate?: string;
}

export const UserSchema = new Schema({
  login: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  role: { type: String, default: 'user' },
  dateCreate: { type: Number, default: Date.now }
});