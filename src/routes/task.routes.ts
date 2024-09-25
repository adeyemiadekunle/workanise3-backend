// task routes

import { Router } from 'express';
import { TaskController } from '../controllers/task-controller';

const taskController = new TaskController();
const router = Router();

router.post('/', taskController.createTask);
router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.get('/category', taskController.getTasksByCategory);
export default router;

