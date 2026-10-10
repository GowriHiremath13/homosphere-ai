import mongoose from 'mongoose';
import { jsonPlugin } from './plugins.js';

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 500 },
    priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
    status: { type: String, enum: ['pending', 'in_progress', 'done'], default: 'pending', index: true },
    dueDate: { type: Date, default: null },
    createdBy: { type: String, default: 'tv', maxlength: 40 },
  },
  { timestamps: true }
);
TaskSchema.plugin(jsonPlugin);
export const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
