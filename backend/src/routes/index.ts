import { Router } from "express";
import { getAvailability, saveAvailability } from "../controllers/availabilityController";
import { login, me, register } from "../controllers/authController";
import { downloadSharedFile, listSharedFiles, uploadSharedFile } from "../controllers/fileController";
import { createMeeting, getRecommendations, listMeetings } from "../controllers/meetingController";
import { createMessage, listMessages, toggleMessageReaction } from "../controllers/messageController";
import { listNotifications, markNotificationRead } from "../controllers/notificationController";
import { createProject, getDashboard, getProjectMembers, joinProject, listProjects, updateProject } from "../controllers/projectController";
import { createTask, createTaskComment, deleteTask, listTaskComments, listTasks, updateTask } from "../controllers/taskController";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/http";

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.post("/auth/register", asyncHandler(register));
router.post("/auth/login", asyncHandler(login));
router.get("/auth/me", requireAuth, asyncHandler(me));

router.get("/projects", requireAuth, asyncHandler(listProjects));
router.post("/projects", requireAuth, asyncHandler(createProject));
router.post("/projects/join", requireAuth, asyncHandler(joinProject));
router.patch("/projects/:projectId", requireAuth, asyncHandler(updateProject));
router.get("/projects/:projectId/dashboard", requireAuth, asyncHandler(getDashboard));
router.get("/projects/:projectId/members", requireAuth, asyncHandler(getProjectMembers));

router.get("/projects/:projectId/tasks", requireAuth, asyncHandler(listTasks));
router.post("/projects/:projectId/tasks", requireAuth, asyncHandler(createTask));
router.patch("/projects/:projectId/tasks/:taskId", requireAuth, asyncHandler(updateTask));
router.delete("/projects/:projectId/tasks/:taskId", requireAuth, asyncHandler(deleteTask));
router.get("/projects/:projectId/tasks/:taskId/comments", requireAuth, asyncHandler(listTaskComments));
router.post("/projects/:projectId/tasks/:taskId/comments", requireAuth, asyncHandler(createTaskComment));
router.get("/projects/:projectId/files", requireAuth, asyncHandler(listSharedFiles));
router.post("/projects/:projectId/files", requireAuth, asyncHandler(uploadSharedFile));
router.get("/projects/:projectId/files/:fileId/download", requireAuth, asyncHandler(downloadSharedFile));

router.get("/availability", requireAuth, asyncHandler(getAvailability));
router.put("/availability", requireAuth, asyncHandler(saveAvailability));

router.get("/projects/:projectId/scheduler/recommendations", requireAuth, asyncHandler(getRecommendations));
router.get("/projects/:projectId/meetings", requireAuth, asyncHandler(listMeetings));
router.post("/projects/:projectId/meetings", requireAuth, asyncHandler(createMeeting));

router.get("/projects/:projectId/messages", requireAuth, asyncHandler(listMessages));
router.post("/projects/:projectId/messages", requireAuth, asyncHandler(createMessage));
router.post("/projects/:projectId/messages/:messageId/reactions/toggle", requireAuth, asyncHandler(toggleMessageReaction));

router.get("/notifications", requireAuth, asyncHandler(listNotifications));
router.patch("/notifications/:notificationId/read", requireAuth, asyncHandler(markNotificationRead));
