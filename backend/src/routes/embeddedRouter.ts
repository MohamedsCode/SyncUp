import { NextFunction, Request, Response, Router } from "express";
import {
  derivProjectMembers,
  derivProjectSummary,
  derivProjectTasks,
  getDerivDashboard
} from "../data/derivProject";

const DEMO_PASSWORD = "password123";

const router = Router();

const normalizeToken = (authorization?: string) => authorization?.replace(/^Bearer\s+/i, "") ?? "";

const getCurrentUser = (authorization?: string) => {
  const token = normalizeToken(authorization);
  const tokenUserId = Number(token.replace("embedded:", ""));
  return derivProjectMembers.find((member) => member.id === tokenUserId) ?? derivProjectMembers[0];
};

const requireEmbeddedAuth = (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  if (!normalizeToken(Array.isArray(authorization) ? authorization[0] : authorization)) {
    res.status(401).json({ message: "Authentication required." });
    return;
  }

  next();
};

router.post("/auth/login", (req, res) => {
  const email = String(req.body?.email ?? "").toLowerCase();
  const password = String(req.body?.password ?? "");
  const user = derivProjectMembers.find((member) => member.email.toLowerCase() === email);

  if (!user || password !== DEMO_PASSWORD) {
    res.status(401).json({ message: "Invalid email or password." });
    return;
  }

  res.json({
    token: `embedded:${user.id}`,
    user
  });
});

router.post("/auth/register", (_req, res) => {
  res.status(201).json({
    token: `embedded:${derivProjectMembers[0].id}`,
    user: derivProjectMembers[0]
  });
});

router.get("/auth/me", requireEmbeddedAuth, (req: Request, res: Response) => {
  res.json({ user: getCurrentUser(req.headers.authorization) });
});

router.use(requireEmbeddedAuth);

router.get("/health", (_req, res) => {
  res.json({ status: "ok", mode: "embedded" });
});

router.get("/projects", (_req, res) => {
  res.json({ projects: [derivProjectSummary] });
});

router.post("/projects", (_req, res) => {
  res.status(201).json({ project: derivProjectSummary });
});

router.post("/projects/join", (_req, res) => {
  res.json({ project: derivProjectSummary });
});

router.patch("/projects/:projectId", (_req, res) => {
  res.json({ project: derivProjectSummary });
});

router.get("/projects/:projectId/dashboard", (_req, res) => {
  res.json(getDerivDashboard());
});

router.get("/projects/:projectId/members", (_req, res) => {
  res.json({ members: derivProjectMembers });
});

router.get("/projects/:projectId/tasks", (_req, res) => {
  res.json({ tasks: derivProjectTasks });
});

router.post("/projects/:projectId/tasks", (req, res) => {
  res.status(201).json({
    task: {
      id: Date.now(),
      projectId: derivProjectSummary.id,
      title: req.body?.title ?? "New task",
      description: req.body?.description ?? "",
      deadline: req.body?.deadline ? new Date(req.body.deadline) : new Date(),
      status: "todo",
      priority: req.body?.priority ?? "medium",
      createdAt: new Date(),
      updatedAt: new Date(),
      assignees: derivProjectMembers.filter((member) => req.body?.assigneeIds?.includes(member.id)),
      commentsCount: 0
    }
  });
});

router.patch("/projects/:projectId/tasks/:taskId", (req, res) => {
  const taskId = Number(req.params.taskId);
  const task = derivProjectTasks.find((item) => item.id === taskId) ?? derivProjectTasks[0];
  res.json({
    task: {
      ...task,
      status: req.body?.status ?? task.status,
      updatedAt: new Date()
    }
  });
});

router.delete("/projects/:projectId/tasks/:taskId", (req, res) => {
  res.json({ success: true, deletedTaskId: Number(req.params.taskId) });
});

router.get("/projects/:projectId/tasks/:taskId/comments", (req, res) => {
  const taskId = Number(req.params.taskId);
  res.json({
    comments: [
      {
        id: taskId * 10,
        taskId,
        userId: derivProjectMembers[0].id,
        content: "This task is part of the embedded Deriv project plan.",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: derivProjectMembers[0]
      }
    ]
  });
});

router.post("/projects/:projectId/tasks/:taskId/comments", (req, res) => {
  res.status(201).json({
    comment: {
      id: Date.now(),
      taskId: Number(req.params.taskId),
      userId: derivProjectMembers[0].id,
      content: req.body?.content ?? "",
      createdAt: new Date(),
      updatedAt: new Date(),
      user: derivProjectMembers[0]
    }
  });
});

router.get("/projects/:projectId/files", (_req, res) => {
  res.json({ files: [] });
});

router.post("/projects/:projectId/files", (_req, res) => {
  res.status(201).json({ file: null });
});

router.get("/projects/:projectId/meetings", (_req, res) => {
  res.json({ meetings: [] });
});

router.post("/projects/:projectId/meetings", (_req, res) => {
  res.status(201).json({ meeting: null });
});

router.get("/projects/:projectId/messages", (_req, res) => {
  res.json({
    messages: [
      {
        id: 1,
        projectId: derivProjectSummary.id,
        userId: derivProjectMembers[0].id,
        content: derivProjectSummary.description,
        timestamp: new Date(),
        user: derivProjectMembers[0],
        reactionCount: 0,
        reactedByMe: false
      }
    ]
  });
});

router.post("/projects/:projectId/messages", (req, res) => {
  res.status(201).json({
    message: {
      id: Date.now(),
      projectId: derivProjectSummary.id,
      userId: derivProjectMembers[0].id,
      content: req.body?.content ?? "",
      timestamp: new Date(),
      user: derivProjectMembers[0],
      reactionCount: 0,
      reactedByMe: false
    }
  });
});

router.post("/projects/:projectId/messages/:messageId/reactions/toggle", (req, res) => {
  res.json({
    message: {
      id: Number(req.params.messageId),
      projectId: derivProjectSummary.id,
      userId: derivProjectMembers[0].id,
      content: derivProjectSummary.description,
      timestamp: new Date(),
      user: derivProjectMembers[0],
      reactionCount: 1,
      reactedByMe: true
    }
  });
});

router.get("/projects/:projectId/scheduler/recommendations", (_req, res) => {
  res.json({
    urgency: { score: 0.72, level: "high" },
    slots: [
      {
        dayOfWeek: 2,
        startTime: "10:00",
        endTime: "11:00",
        startDateTime: "2026-06-23T10:00:00.000Z",
        endDateTime: "2026-06-23T11:00:00.000Z",
        overlapMinutes: 180,
        label: "Best fit"
      }
    ]
  });
});

router.get("/availability", (_req, res) => {
  res.json({
    availability: [
      { id: 1, dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
      { id: 2, dayOfWeek: 3, startTime: "14:00", endTime: "17:00" }
    ]
  });
});

router.put("/availability", (_req, res) => {
  res.json({ success: true });
});

router.get("/notifications", (_req, res) => {
  res.json({ notifications: [] });
});

router.patch("/notifications/:notificationId/read", (_req, res) => {
  res.json({ success: true });
});

export { router as embeddedRouter };
