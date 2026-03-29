export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export interface ProjectSummary {
  id: number;
  name: string;
  code: string;
  deadline?: string | null;
  memberCount: number;
  completionRate: number;
  nextMeeting: Meeting | null;
  members: User[];
}

export interface Task {
  id: number;
  projectId: number;
  title: string;
  description: string;
  deadline: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
  assignees: User[];
  commentsCount?: number;
}

export interface TaskComment {
  id: number;
  taskId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface Meeting {
  id: number;
  projectId: number;
  startDatetime: string;
  endDatetime: string;
  createdAt?: string;
  participants?: User[];
}

export interface Message {
  id: number;
  projectId: number;
  userId: number;
  content: string;
  timestamp: string;
  user: User;
  reactionCount: number;
  reactedByMe: boolean;
}

export interface Notification {
  id: number;
  userId: number;
  projectId?: number | null;
  type: "task_assigned" | "deadline_soon" | "meeting_scheduled" | "mention";
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface AvailabilitySlot {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface DashboardData {
  project: {
    id: number;
    name: string;
    code: string;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    overdueCount: number;
    dueSoonCount: number;
    meetingCount: number;
    memberCount: number;
  };
  dueSoonTasks: Task[];
  overdueTasks: Task[];
  upcomingMeetings: Meeting[];
  members: User[];
  activity: Array<{
    type: "message" | "task" | "meeting";
    timestamp: string;
    text: string;
  }>;
}

export interface SchedulerSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDateTime: string;
  endDateTime: string;
  overlapMinutes: number;
  label?: string;
}

export interface SchedulerResponse {
  urgency: {
    score: number;
    level: "low" | "medium" | "high";
  };
  slots: SchedulerSlot[];
}
