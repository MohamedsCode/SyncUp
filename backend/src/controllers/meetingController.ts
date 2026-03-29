import { NotificationType } from "@prisma/client";
import { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { createNotifications } from "../services/notificationService";
import { getMeetingRecommendations } from "../services/schedulerService";
import { HttpError } from "../utils/http";
import { assertProjectMember } from "../utils/projectAccess";

const projectIdSchema = z.object({
  projectId: z.coerce.number()
});

const createMeetingSchema = z.object({
  startDatetime: z.string().datetime(),
  endDatetime: z.string().datetime()
});

export const listMeetings = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = projectIdSchema.parse(req.params);
  await assertProjectMember(projectId, req.auth!.userId);

  const meetings = await prisma.meeting.findMany({
    where: { projectId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    },
    orderBy: {
      startDatetime: "asc"
    }
  });

  res.json({
    meetings: meetings.map((meeting) => ({
      ...meeting,
      participants: meeting.participants.map((participant) => participant.user)
    }))
  });
};

export const getRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = projectIdSchema.parse(req.params);
  await assertProjectMember(projectId, req.auth!.userId);

  const recommendations = await getMeetingRecommendations(projectId);
  res.json(recommendations);
};

export const createMeeting = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = projectIdSchema.parse(req.params);
  const payload = createMeetingSchema.parse(req.body);
  await assertProjectMember(projectId, req.auth!.userId);

  const startDatetime = new Date(payload.startDatetime);
  const endDatetime = new Date(payload.endDatetime);

  if (endDatetime <= startDatetime) {
    throw new HttpError(400, "Meeting end time must be after start time.");
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    select: { userId: true }
  });

  const meeting = await prisma.meeting.create({
    data: {
      projectId,
      startDatetime,
      endDatetime,
      participants: {
        create: members.map((member) => ({
          userId: member.userId
        }))
      }
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  });

  await createNotifications(
    members.map((member) => member.userId),
    NotificationType.meeting_scheduled,
    `A meeting was scheduled for ${startDatetime.toLocaleString()}.`,
    projectId
  );

  res.status(201).json({
    meeting: {
      ...meeting,
      participants: meeting.participants.map((participant) => participant.user)
    }
  });
};
