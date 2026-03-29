import { NotificationType } from "@prisma/client";
import { prisma } from "../config/prisma";

export const createNotification = async (
  userId: number,
  type: NotificationType,
  content: string,
  projectId?: number
) => {
  return prisma.notification.create({
    data: {
      userId,
      projectId,
      type,
      content
    }
  });
};

export const createNotifications = async (
  userIds: number[],
  type: NotificationType,
  content: string,
  projectId?: number
) => {
  const uniqueUserIds = [...new Set(userIds)];
  if (!uniqueUserIds.length) {
    return [];
  }

  await prisma.notification.createMany({
    data: uniqueUserIds.map((userId) => ({
      userId,
      projectId,
      type,
      content
    }))
  });

  return uniqueUserIds;
};

export const syncDeadlineNotifications = async (projectId: number) => {
  const now = new Date();
  const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      status: {
        not: "done"
      },
      deadline: {
        gte: now,
        lte: nextDay
      }
    },
    include: {
      assignments: true
    }
  });

  for (const task of tasks) {
    const recipients = task.assignments.map((assignment) => assignment.userId);
    const content = `Task "${task.title}" is due within 24 hours.`;

    for (const userId of recipients) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          projectId,
          type: NotificationType.deadline_soon,
          content
        }
      });

      if (!existing) {
        await createNotification(userId, NotificationType.deadline_soon, content, projectId);
      }
    }
  }
};
