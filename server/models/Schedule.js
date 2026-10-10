import mongoose from 'mongoose';
import { jsonPlugin } from './plugins.js';

const ScheduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
    source: { type: String, enum: ['user', 'ai', 'demo'], default: 'user' },
  },
  { timestamps: true }
);
ScheduleSchema.plugin(jsonPlugin);
export const Schedule = mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);
