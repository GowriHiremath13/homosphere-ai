import mongoose from 'mongoose';
import { jsonPlugin } from './plugins.js';

const AIConversationSchema = new mongoose.Schema({
  message: { type: String, required: true, maxlength: 2000 },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  source: { type: String, enum: ['tv', 'phone', 'system'], default: 'tv' },
  timestamp: { type: Date, default: Date.now, index: true },
});
AIConversationSchema.plugin(jsonPlugin);
export const AIConversation =
  mongoose.models.AIConversation || mongoose.model('AIConversation', AIConversationSchema);
