import { AuditLog } from '../models/AuditLog.js';

export const recordTaskAudit = async ({ taskId, action, actorId, changes }) => {
  await AuditLog.create({
    entityType: 'Task',
    entityId: taskId,
    action,
    actor: actorId,
    changes
  });
};

export const getTaskAudits = async (taskId) => {
  return AuditLog.find({ entityId: taskId }).populate('actor', 'name email role').sort({ timestamp: -1 });
};
