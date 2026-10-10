import mongoose from 'mongoose';
import { jsonPlugin } from './plugins.js';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Alex', trim: true, maxlength: 60 },
    preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);
UserSchema.plugin(jsonPlugin);
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
