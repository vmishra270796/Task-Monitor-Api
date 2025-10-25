import mongoose from 'mongoose';
import { TASK_STATUSES } from '../utils/constants.js';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: TASK_STATUSES, default: 'To Do', index: true },
    position: { type: Number, default: 0, index: true }, // ordering within a column
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date },
    priority: { type: Number, min: 1, max: 5 } // 1=low,5=high
  },
  { timestamps: true }
);

taskSchema.index({ status: 1, position: 1 });

export const Task = mongoose.model('Task', taskSchema);
