import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createTask, getTasks, updateTask, deleteTask, reorderTask, getTaskHistory } from '../controllers/taskController.js';

const router = Router();

router.get('/', getTasks); // public read
router.get('/:id/history', authenticate, getTaskHistory);

router.post('/', authenticate, createTask);
router.put('/:id', authenticate, updateTask);
router.delete('/:id', authenticate, deleteTask);

// Drag-and-drop reorder/move
router.post('/reorder', authenticate, reorderTask);

export default router;
