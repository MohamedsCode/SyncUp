import { NotificationType, TaskPriority, TaskStatus } from "@prisma/client";
import { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { createNotifications, syncDeadlineNotifications } from "../services/notificationService";
import { HttpError } from "../utils/http";
import { assertProjectMember } from "../utils/projectAccess";

const projectIdSchema = z.object({
  projectId: z.coerce.number()
});

const createTaskSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(1),
  deadline: z.string().datetime(),
  priority: z.nativeEnum(TaskPriority),
  assigneeIds: z.array(z.number()).default([])
});

const createTaskCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000)
});

const updateTaskSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().min(1).optional(),
  deadline: z.string().datetime().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  assigneeIds: z.array(z.number()).optional()
});

const taskInclude = {
  assignments: {
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
  _count: {
    select: {
      comments: true
    }
  }
} as const;

const serializeTask = <T extends { assignments: Array<{ user: { id: number; name: string; email: string } }>; _count: { comments: number } }>(
  task: T
) => ({
  ...task,
  assignees: task.assignments.map((assignment) => assignment.user),
  commentsCount: task._count.comments
});

export const listTasks = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = projectIdSchema.parse(req.params);
  await assertProjectMember(projectId, req.auth!.userId);
  await syncDeadlineNotifications(projectId);

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: taskInclude,
    orderBy: [
      {
        deadline: "asc"
      },
      {
        priority: "desc"
      }
    ]
  });

  res.json({
    tasks: tasks.map(serializeTask)
  });
};

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = projectIdSchema.parse(req.params);
  const payload = createTaskSchema.parse(req.body);
  await assertProjectMember(projectId, req.auth!.userId);

  const projectMembers = await prisma.projectMember.findMany({
    where: { projectId },
    select: { userId: true }
  });
  const memberIds = new Set(projectMembers.map((member) => member.userId));

  if (payload.assigneeIds.some((id) => !memberIds.has(id))) {
    throw new HttpError(400, "All assignees must belong to the project.");
  }

  const task = await prisma.task.create({
    data: {
      projectId,
      title: payload.title,
      description: payload.description,
      deadline: new Date(payload.deadline),
      priority: payload.priority,
      assignments: {
        create: payload.assigneeIds.map((userId) => ({ userId }))
      }
    },
    include: taskInclude
  });

  if (payload.assigneeIds.length) {
    await createNotifications(
      payload.assigneeIds,
      NotificationType.task_assigned,
      `You were assigned to "${task.title}".`,
      projectId
    );
  }

  res.status(201).json({
    task: serializeTask(task)
  });
};

export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = projectIdSchema.parse(req.params);
  const taskId = z.coerce.number().parse(req.params.taskId);
  const payload = updateTaskSchema.parse(req.body);
  await assertProjectMember(projectId, req.auth!.userId);

  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId
    },
    include: {
      assignments: true
    }
  });

  if (!existingTask) {
    throw new HttpError(404, "Task not found.");
  }

  if (payload.assigneeIds) {
    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true }
    });
    const memberIds = new Set(projectMembers.map((member) => member.userId));

    if (payload.assigneeIds.some((id) => !memberIds.has(id))) {
      throw new HttpError(400, "All assignees must belong to the project.");
    }
  }

  const task = await prisma.$transaction(async (transaction) => {
    if (payload.assigneeIds) {
      await transaction.taskAssignment.deleteMany({ where: { taskId } });
      if (payload.assigneeIds.length) {
        await transaction.taskAssignment.createMany({
          data: payload.assigneeIds.map((userId) => ({ taskId, userId }))
        });
      }
    }

    return transaction.task.update({
      where: { id: taskId },
      data: {
        title: payload.title,
        description: payload.description,
        deadline: payload.deadline ? new Date(payload.deadline) : undefined,
        priority: payload.priority,
        status: payload.status
      },
      include: taskInclude
    });
  });

  if (payload.assigneeIds) {
    const previousAssignees = new Set(existingTask.assignments.map((assignment) => assignment.userId));
    const newAssignees = payload.assigneeIds.filter((userId) => !previousAssignees.has(userId));

    if (newAssignees.length) {
      await createNotifications(
        newAssignees,
        NotificationType.task_assigned,
        `You were assigned to "${task.title}".`,
        projectId
      );
    }
  }

  res.json({
    task: serializeTask(task)
  });
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = projectIdSchema.parse(req.params);
  const taskId = z.coerce.number().parse(req.params.taskId);
  await assertProjectMember(projectId, req.auth!.userId);

  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId
    }
  });

  if (!existingTask) {
    throw new HttpError(404, "Task not found.");
  }

  await prisma.task.delete({
    where: {
      id: taskId
    }
  });

  res.json({
    success: true,
    deletedTaskId: taskId
  });
};

export const listTaskComments = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = projectIdSchema.parse(req.params);
  const taskId = z.coerce.number().parse(req.params.taskId);
  await assertProjectMember(projectId, req.auth!.userId);

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId
    },
    select: { id: true }
  });

  if (!task) {
    throw new HttpError(404, "Task not found.");
  }

  const comments = await prisma.taskComment.findMany({
    where: { taskId },
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
      createdAt: "asc"
    }
  });

  res.json({ comments });
};

export const createTaskComment = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = projectIdSchema.parse(req.params);
  const taskId = z.coerce.number().parse(req.params.taskId);
  const payload = createTaskCommentSchema.parse(req.body);
  const userId = req.auth!.userId;
  await assertProjectMember(projectId, userId);

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId
    },
    include: {
      assignments: true
    }
  });

  if (!task) {
    throw new HttpError(404, "Task not found.");
  }

  const isAssigned = task.assignments.some((assignment) => assignment.userId === userId);
  if (!isAssigned) {
    throw new HttpError(403, "Only teammates assigned to this task can add comments.");
  }

  const comment = await prisma.taskComment.create({
    data: {
      taskId,
      userId,
      content: payload.content
    },
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

  res.status(201).json({ comment });
};
