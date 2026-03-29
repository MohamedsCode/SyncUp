import { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { syncDeadlineNotifications } from "../services/notificationService";
import { HttpError } from "../utils/http";
import { assertProjectMember } from "../utils/projectAccess";

const createProjectSchema = z.object({
  name: z.string().min(2).max(80)
});

const joinProjectSchema = z.object({
  code: z.string().min(4).max(12)
});

const projectIdSchema = z.object({
  projectId: z.coerce.number()
});

const updateProjectSchema = z.object({
  deadline: z.string().datetime().nullable().optional()
});

const generateCode = () =>
  Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();

export const listProjects = async (req: AuthenticatedRequest, res: Response) => {
  const projects = await prisma.project.findMany({
    where: {
      members: {
        some: {
          userId: req.auth!.userId
        }
      }
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      tasks: true,
      meetings: {
        orderBy: {
          startDatetime: "asc"
        },
        take: 3
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  res.json({
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      code: project.code,
      deadline: project.deadline,
      memberCount: project.members.length,
      completionRate: project.tasks.length
        ? Math.round((project.tasks.filter((task) => task.status === "done").length / project.tasks.length) * 100)
        : 0,
      nextMeeting: project.meetings[0] ?? null,
      members: project.members.map((member) => member.user)
    }))
  });
};

export const createProject = async (req: AuthenticatedRequest, res: Response) => {
  const payload = createProjectSchema.parse(req.body);
  let code = generateCode();

  while (await prisma.project.findUnique({ where: { code } })) {
    code = generateCode();
  }

  const project = await prisma.project.create({
    data: {
      name: payload.name,
      code,
      members: {
        create: {
          userId: req.auth!.userId,
          role: "owner"
        }
      }
    }
  });

  res.status(201).json({ project });
};

export const joinProject = async (req: AuthenticatedRequest, res: Response) => {
  const payload = joinProjectSchema.parse(req.body);
  const project = await prisma.project.findUnique({
    where: { code: payload.code.toUpperCase() }
  });

  if (!project) {
    throw new HttpError(404, "Project code not found.");
  }

  await prisma.projectMember.upsert({
    where: {
      userId_projectId: {
        userId: req.auth!.userId,
        projectId: project.id
      }
    },
    update: {},
    create: {
      userId: req.auth!.userId,
      projectId: project.id
    }
  });

  res.json({ project });
};

export const getProjectMembers = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = projectIdSchema.parse(req.params);
  await assertProjectMember(projectId, req.auth!.userId);

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
    },
    orderBy: {
      joinedAt: "asc"
    }
  });

  res.json({
    members: members.map((member) => ({
      ...member.user,
      role: member.role
    }))
  });
};

export const updateProject = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = projectIdSchema.parse(req.params);
  const payload = updateProjectSchema.parse(req.body);
  await assertProjectMember(projectId, req.auth!.userId);

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      deadline: payload.deadline === undefined ? undefined : payload.deadline ? new Date(payload.deadline) : null
    }
  });

  res.json({ project });
};

export const getDashboard = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = projectIdSchema.parse(req.params);
  await assertProjectMember(projectId, req.auth!.userId);
  await syncDeadlineNotifications(projectId);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      tasks: {
        include: {
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          deadline: "asc"
        }
      },
      meetings: {
        orderBy: {
          startDatetime: "asc"
        }
      },
      messages: {
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          timestamp: "desc"
        },
        take: 6
      }
    }
  });

  if (!project) {
    throw new HttpError(404, "Project not found.");
  }

  const now = new Date();
  const dueSoonThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const completedTasks = project.tasks.filter((task) => task.status === "done").length;
  const overdueTasks = project.tasks.filter((task) => task.deadline < now && task.status !== "done");
  const dueSoonTasks = project.tasks.filter(
    (task) => task.deadline >= now && task.deadline <= dueSoonThreshold && task.status !== "done"
  );

  const activity = [
    ...project.messages.map((message) => ({
      type: "message",
      timestamp: message.timestamp,
      text: `${message.user.name}: ${message.content}`
    })),
    ...project.tasks.slice(0, 5).map((task) => ({
      type: "task",
      timestamp: task.updatedAt,
      text: `Task updated: ${task.title}`
    })),
    ...project.meetings.slice(0, 5).map((meeting) => ({
      type: "meeting",
      timestamp: meeting.createdAt,
      text: `Meeting scheduled for ${meeting.startDatetime.toLocaleString()}`
    }))
  ]
    .sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime())
    .slice(0, 8);

  res.json({
    project: {
      id: project.id,
      name: project.name,
      code: project.code,
      deadline: project.deadline
    },
    stats: {
      totalTasks: project.tasks.length,
      completedTasks,
      completionRate: project.tasks.length ? Math.round((completedTasks / project.tasks.length) * 100) : 0,
      overdueCount: overdueTasks.length,
      dueSoonCount: dueSoonTasks.length,
      meetingCount: project.meetings.length,
      memberCount: project.members.length
    },
    dueSoonTasks,
    overdueTasks,
    upcomingMeetings: project.meetings.filter((meeting) => meeting.startDatetime >= now).slice(0, 5),
    members: project.members.map((member) => member.user),
    activity
  });
};
