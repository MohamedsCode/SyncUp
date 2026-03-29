import { NotificationType } from "@prisma/client";
import { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { createNotifications } from "../services/notificationService";
import { HttpError } from "../utils/http";
import { assertProjectMember } from "../utils/projectAccess";

const projectIdSchema = z.object({
  projectId: z.coerce.number()
});

const createMessageSchema = z.object({
  content: z.string().min(1).max(2000)
});

const normalizeHandle = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const messageInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  reactions: {
    select: {
      userId: true
    }
  }
} as const;

const serializeMessage = <
  T extends {
    reactions: Array<{ userId: number }>;
  }
>(
  message: T,
  currentUserId: number
) => ({
  ...message,
  reactionCount: message.reactions.length,
  reactedByMe: message.reactions.some((reaction) => reaction.userId === currentUserId)
});

export const listMessages = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = projectIdSchema.parse(req.params);
  const userId = req.auth!.userId;
  await assertProjectMember(projectId, userId);

  const messages = await prisma.message.findMany({
    where: { projectId },
    include: messageInclude,
    orderBy: {
      timestamp: "asc"
    },
    take: 150
  });

  res.json({ messages: messages.map((message) => serializeMessage(message, userId)) });
};

export const createMessage = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = projectIdSchema.parse(req.params);
  const payload = createMessageSchema.parse(req.body);
  const userId = req.auth!.userId;
  await assertProjectMember(projectId, userId);

  const message = await prisma.message.create({
    data: {
      projectId,
      userId,
      content: payload.content
    },
    include: messageInclude
  });

  const mentionedHandles = [...payload.content.matchAll(/@([a-zA-Z0-9_.-]+)/g)].map((match) =>
    normalizeHandle(match[1])
  );

  if (mentionedHandles.length) {
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const recipients = members
      .filter((member) => {
        const nameTokens = member.user.name.split(" ").map(normalizeHandle);
        const emailHandle = normalizeHandle(member.user.email.split("@")[0]);
        return mentionedHandles.some((handle) => nameTokens.includes(handle) || emailHandle === handle);
      })
      .map((member) => member.user.id)
      .filter((mentionedUserId) => mentionedUserId !== userId);

    if (recipients.length) {
      await createNotifications(
        recipients,
        NotificationType.mention,
        `${message.user.name} mentioned you in project chat.`,
        projectId
      );
    }
  }

  res.status(201).json({ message: serializeMessage(message, userId) });
};

export const toggleMessageReaction = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = projectIdSchema.parse(req.params);
  const messageId = z.coerce.number().parse(req.params.messageId);
  const userId = req.auth!.userId;
  await assertProjectMember(projectId, userId);

  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      projectId
    },
    include: messageInclude
  });

  if (!message) {
    throw new HttpError(404, "Message not found.");
  }

  const existingReaction = message.reactions.find((reaction) => reaction.userId === userId);

  if (existingReaction) {
    await prisma.messageReaction.delete({
      where: {
        messageId_userId: {
          messageId,
          userId
        }
      }
    });
  } else {
    await prisma.messageReaction.create({
      data: {
        messageId,
        userId
      }
    });
  }

  const updatedMessage = await prisma.message.findUniqueOrThrow({
    where: { id: messageId },
    include: messageInclude
  });

  res.json({
    message: serializeMessage(updatedMessage, userId)
  });
};
