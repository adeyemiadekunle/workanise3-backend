import { Task, TaskStatus } from "@prisma/client";
import prisma from "../db";
import createLogger from "../utils/logger";

const logger = createLogger("TaskService");

class TaskService {
  async createTask(
    task: Omit<Task, "id" | "createdAt" | "updatedAt" | "completedAt">
  ): Promise<Task> {
    logger.logInfo(`Creating new task`);
    return prisma.task.create({
      data: {
        ...task,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      },
    });
  }

  async getTaskById(id: string): Promise<Task | null> {
    logger.logInfo(`Fetching task with ID: ${id}`);
    return prisma.task.findUnique({
      where: { id },
    });
  }

  async updateTask(
    id: string,
    updatedTask: Partial<Task>
  ): Promise<Task | null> {
    logger.logInfo(`Updating task with ID: ${id}`);
    return prisma.task.update({
      where: { id },
      data: {
        ...updatedTask,
        updatedAt: new Date(),
      },
    });
  }

  async deleteTask(id: string): Promise<boolean> {
    logger.logInfo(`Deleting task with ID: ${id}`);
    const deletedTask = await prisma.task.delete({
      where: { id },
    });
    return !!deletedTask;
  }

  async getAllTasks(): Promise<Task[]> {
    logger.logInfo(`Fetching all tasks`);
    return prisma.task.findMany();
  }

  async performTask(id: string, userId: string): Promise<Task | null> {
    logger.logInfo(`Performing task with ID: ${id} for user: ${userId}`);
    const task = await this.getTaskById(id);
    if (
      !task ||
      task.taskStatus !== TaskStatus.CLAIMED ||
      task.userId !== userId
    ) {
      return null;
    }

    return prisma.task.update({
      where: { id },
      data: {
        taskStatus: TaskStatus.COMPLETED,
        updatedAt: new Date(),
      },
    });
  }

  async claimTaskPoints(id: string, userId: string): Promise<number | null> {
    logger.logInfo(`Claiming points for task with ID: ${id} by user: ${userId}`);
    const task = await this.getTaskById(id);

    if (
      !task ||
      task.taskStatus !== TaskStatus.COMPLETED ||
      task.userId !== userId
    ) {
      return null;
    }

    // Use a transaction to ensure both task update and user balance update are atomic
    const updatedTask = await prisma.$transaction(async (prisma) => {
      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          taskStatus: TaskStatus.CLAIMED,
          updatedAt: new Date(),
        },
      });

      // Credit the points to the user's balance
      await prisma.user.update({
        where: { id: userId },
        data: {
          balance: {
            increment: updatedTask.points,
          },
        },
      });

      return updatedTask;
    });

    return updatedTask.points;
  }

  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    logger.logInfo(`Fetching tasks with status: ${status}`);
    return prisma.task.findMany({
      where: { taskStatus: status },
    });
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    logger.logInfo(`Fetching tasks for user: ${userId}`);
    return prisma.task.findMany({
      where: { userId },
    });
  }

  async getTasksByCategory(category: string): Promise<Task[]> {
    logger.logInfo(`Fetching tasks for category: ${category}`);
    return prisma.task.findMany({
      where: { category },
    });
  }
}

export default new TaskService();
