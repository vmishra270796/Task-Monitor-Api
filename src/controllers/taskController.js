import { log } from 'node:console';
import { Task } from '../models/Task.js';
import { recordTaskAudit, getTaskAudits } from '../services/auditService.js';
import { TASK_STATUSES } from '../utils/constants.js';
import { diffObjects } from '../utils/diff.js';
export const createTask = async (req, res) => {
  const { title, description, status = 'To Do', dueDate, priority } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  if (!TASK_STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  // position: max + 1 within the status column
  const last = await Task.find({ status }).sort({ position: -1 }).limit(1);
  const position = last[0]?.position + 1 || 0;

  const task = await Task.create({
    title,
    description,
    status,
    position,
    createdBy: req.user.id,
    dueDate,
    priority
  });

  await recordTaskAudit({
    taskId: task._id,
    action: 'create',
    actorId: req.user.id,
    changes: diffObjects(null,task.toObject() )
  });

  req.io.emit('task:create', serializeTask(task)); // broadcast
  res.status(201).json(serializeTask(task));
};

export const getTasks = async (req, res) => {
  const tasks = await Task.find({}).populate('createdBy', 'name email role avatarUrl').sort({ status: 1, position: 1 });
  res.json(tasks.map(serializeTask));
};

export const getTaskHistory = async (req, res) => {
  const { id } = req.params;
  const audits = await getTaskAudits(id);
  res.json(audits);
};

export const updateTask = async (req, res) => {
  const { id } = req.params;
  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  // Authorization: owner or admin
  const isAdmin = req.user.role === 'admin';
  const isOwner = task.createdBy.toString() === req.user.id;
  if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Not allowed' });

  const before = task.toObject();
  const allowed = ['title', 'description', 'status', 'dueDate', 'priority'];
  for (const key of allowed) {
    if (key in req.body) task[key] = req.body[key];
  }

  // If status changed, put task at end of new column
  if ('status' in req.body && req.body.status !== before.status) {
    const last = await Task.find({ status: task.status }).sort({ position: -1 }).limit(1);
    task.position = last[0]?.position + 1 || 0;
  }

  await task.save();

  await recordTaskAudit({
    taskId: task._id,
    action: 'update',
    actorId: req.user.id,
    changes: diffObjects(before, task.toObject() )
  });

  const serialized = serializeTask(task);
  req.io.emit('task:update', serialized);
  res.json(serialized);
};

export const reorderTask = async (req, res) => {
  // Move/reorder with drag-and-drop; body: { taskId, toStatus, toIndex }
  const { taskId, toStatus, toIndex } = req.body;
  if (!TASK_STATUSES.includes(toStatus)) return res.status(400).json({ message: 'Invalid status' });
  const task = await Task.findById(taskId).populate('createdBy', 'name role');
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const isAdmin = req.user.role === 'admin';
  const isOwner = task.createdBy.toString() === req.user.id;
  if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Not allowed' });

  const before = task.toObject();

  // Reorder algorithm: normalize positions in destination, insert at toIndex
  const destTasks = await Task.find({ status: toStatus }).sort({ position: 1 });
  const without = destTasks.filter(t => t._id.toString() !== taskId);

  const clampedIndex = Math.max(0, Math.min(toIndex, without.length));
  const newOrder = [...without.slice(0, clampedIndex), task, ...without.slice(clampedIndex)];
  for (let i = 0; i < newOrder.length; i++) {
    newOrder[i].position = i;
    if (newOrder[i]._id.toString() === taskId) {
      newOrder[i].status = toStatus;
    }
    await newOrder[i].save();
  }

  await recordTaskAudit({
    taskId: task._id,
    action: 'move',
    actorId: req.user.id,
    changes: diffObjects(before, task.toObject() )
  });

  // Broadcast full column updates (safer for client sync)
  const payload = newOrder.map(serializeTask);
  req.io.emit('task:reorder', { status: toStatus, tasks: payload });
  res.json({ status: toStatus, tasks: payload });
};

export const deleteTask = async (req, res) => {
  const { id } = req.params;
  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const isAdmin = req.user.role === 'admin';
  const isOwner = task.createdBy.toString() === req.user.id;
  if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Not allowed' });

  await task.deleteOne();

  await recordTaskAudit({
    taskId: id,
    action: 'delete',
    actorId: req.user.id,
    changes: diffObjects( null,task)
  });

  req.io.emit('task:delete', { id });
  res.json({ success: true });
};

const serializeTask = (t) => ({
  id: t._id.toString(),
  title: t.title,
  description: t.description,
  status: t.status,
  position: t.position,
  createdBy: typeof t.createdBy === 'object'
    ? { id: t.createdBy._id?.toString?.() || t.createdBy.toString(), name: t.createdBy.name, role: t.createdBy.role }
    : t.createdBy.toString(),
  dueDate: t.dueDate || null,
  priority: t.priority || null,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt
});
