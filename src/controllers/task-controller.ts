// task controller

import { Request, Response } from 'express';
import TaskService from '../services/task-service';
import { AuthenticatedRequest } from '../types';
import createLogger from '../utils/logger';
import { TaskStatus } from '@prisma/client';


const logger = createLogger('TaskController');

export class TaskController {
  async createTask(req: Request, res: Response): Promise<void> {

    try {
      const { title, description, points, url, category, taskType, requirements } = req.body;
      const task = await TaskService.createTask({
        title,
        description,
        points,
        url,
        category,
        taskType,
        requirements,
        taskStatus: TaskStatus.AVAILABLE,
        userId: (req as AuthenticatedRequest).user.id
      });
      res.status(201).json(task);
    } catch (error) {
      logger.logError('Error in createTask:', error as Error);
      res.status(400).json({ error: 'Failed to create task' });
    }
  }

  async getTaskById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const task = await TaskService.getTaskById(id);
      if (task) {
        res.json(task);
      } else {
        res.status(404).json({ message: 'Task not found' });
      }
    } catch (error) {
      logger.logError('Error in getTaskById:', error as Error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, points, url, category, taskType, requirements, taskStatus } = req.body;
      const updatedTask = await TaskService.updateTask(id, {
        title,
        description,
        points,
        url,
        category,
        taskType,
        requirements,
        taskStatus
      });
      if (updatedTask) {
        res.json(updatedTask);
      } else {
        res.status(404).json({ message: 'Task not found' });
      }
    } catch (error) {
      logger.logError('Error in updateTask:', error as Error);
      res.status(400).json({ error: 'Failed to update task' });
    }
  }

  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await TaskService.deleteTask(id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: 'Task not found' });
      }
    } catch (error) {
      logger.logError('Error in deleteTask:', error as Error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async claimTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as AuthenticatedRequest).user.id;
      const claimedPoints = await TaskService.claimTaskPoints(id, userId);
      if (claimedPoints !== null) {
        res.json({ points: claimedPoints });
      } else {
        res.status(404).json({ message: 'Task not found or not eligible for claiming' });
      }
    } catch (error) {
      logger.logError('Error in claimTask:', error as Error);
      res.status(400).json({ error: 'Failed to claim task' });
    }
  }

  async performTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as AuthenticatedRequest).user.id;
      const performedTask = await TaskService.performTask(id, userId);
      if (performedTask) {
        res.json(performedTask);
      } else {
        res.status(404).json({ message: 'Task not found or not eligible for performing' });
      }
    } catch (error) {
      logger.logError('Error in performTask:', error as Error);
      res.status(400).json({ error: 'Failed to perform task' });
    }
  }

  async getAllTasks(req: Request, res: Response): Promise<void> {
    try {
      const tasks = await TaskService.getAllTasks();
      res.json(tasks);
    } catch (error) {
      logger.logError('Error in getAllTasks:', error as Error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getTasksByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.query as { category: string };
      const tasks = await TaskService.getTasksByCategory(category);
      res.json(tasks);
    } catch (error) {
      logger.logError('Error in getTasksByCategory:', error as Error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
