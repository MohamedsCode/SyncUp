import { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

export const listNotifications = async (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.query.projectId ? z.coerce.number().parse(req.query.projectId) : undefined;

  const notifications = await prisma.notification.findMany({
    where: {
      userId: req.auth!.userId,
      projectId
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 30
  });

  res.json({ notifications });
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response) => {
  const notificationId = z.coerce.number().parse(req.params.notificationId);

  const notification = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: req.auth!.userId
    },
    data: {
      isRead: true
    }
  });

  res.json({ success: notification.count > 0 });
};
