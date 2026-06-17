export const DERIV_PROJECT_ID = 250625;

export const derivProjectDeadline = new Date("2026-06-25T19:00:00.000Z");

export const derivProjectMembers = [
  { id: 9001, name: "mohamed", email: "mohamed@deriv-project.local", role: "owner" },
  { id: 9002, name: "sultan", email: "sultan@deriv-project.local", role: "member" },
  { id: 9003, name: "afft", email: "afft@deriv-project.local", role: "member" },
  { id: 9004, name: "ahmed", email: "ahmed@deriv-project.local", role: "member" }
];

const member = (name: string) => {
  const found = derivProjectMembers.find((item) => item.name === name);
  if (!found) {
    throw new Error(`Unknown Deriv project member: ${name}`);
  }
  return found;
};

const taskDate = (day: number, hour = 14) => new Date(Date.UTC(2026, 5, day, hour));

export const derivProjectTasks = [
  {
    id: 9101,
    projectId: DERIV_PROJECT_ID,
    title: "Outlining project",
    description: "Define the AI-first client project scope, users, constraints, and success criteria.",
    deadline: taskDate(6),
    status: "done",
    priority: "high",
    createdAt: taskDate(1, 9),
    updatedAt: taskDate(6, 16),
    assignees: [member("mohamed"), member("sultan"), member("afft")],
    commentsCount: 2
  },
  {
    id: 9102,
    projectId: DERIV_PROJECT_ID,
    title: "Client requirement mapping",
    description: "Turn client expectations into clear functional requirements and AI-assisted workflows.",
    deadline: taskDate(8),
    status: "done",
    priority: "high",
    createdAt: taskDate(1, 10),
    updatedAt: taskDate(8, 15),
    assignees: [member("mohamed"), member("afft"), member("ahmed")],
    commentsCount: 1
  },
  {
    id: 9103,
    projectId: DERIV_PROJECT_ID,
    title: "AI architecture planning",
    description: "Plan the AI-first system architecture, model touchpoints, data flow, and client-facing outputs.",
    deadline: taskDate(10),
    status: "in_progress",
    priority: "high",
    createdAt: taskDate(2, 9),
    updatedAt: taskDate(10, 13),
    assignees: [member("mohamed"), member("sultan"), member("afft"), member("ahmed")],
    commentsCount: 4
  },
  {
    id: 9104,
    projectId: DERIV_PROJECT_ID,
    title: "Prototype user flow",
    description: "Build the first client journey from intake to AI-supported project output.",
    deadline: taskDate(12),
    status: "in_progress",
    priority: "medium",
    createdAt: taskDate(3, 11),
    updatedAt: taskDate(12, 12),
    assignees: [member("sultan"), member("afft")],
    commentsCount: 1
  },
  {
    id: 9105,
    projectId: DERIV_PROJECT_ID,
    title: "Completing first draft",
    description: "Complete the first usable draft of the client project with core AI-assisted features connected.",
    deadline: taskDate(14),
    status: "in_progress",
    priority: "high",
    createdAt: taskDate(4, 10),
    updatedAt: taskDate(14, 9),
    assignees: [member("mohamed"), member("sultan"), member("ahmed")],
    commentsCount: 3
  },
  {
    id: 9106,
    projectId: DERIV_PROJECT_ID,
    title: "Internal review and QA",
    description: "Review the first draft for bugs, unclear flows, missing requirements, and client-readiness gaps.",
    deadline: taskDate(16),
    status: "todo",
    priority: "medium",
    createdAt: taskDate(5, 9),
    updatedAt: taskDate(5, 9),
    assignees: [member("mohamed"), member("afft"), member("ahmed")],
    commentsCount: 0
  },
  {
    id: 9107,
    projectId: DERIV_PROJECT_ID,
    title: "Client feedback integration",
    description: "Apply client feedback and refine the AI-first project experience before final delivery.",
    deadline: taskDate(18),
    status: "todo",
    priority: "high",
    createdAt: taskDate(6, 11),
    updatedAt: taskDate(6, 11),
    assignees: [member("sultan"), member("afft"), member("ahmed")],
    commentsCount: 0
  },
  {
    id: 9108,
    projectId: DERIV_PROJECT_ID,
    title: "Prepare project presentation",
    description: "Create the slide deck showing the problem, AI-first approach, build process, and final outcome.",
    deadline: taskDate(20),
    status: "todo",
    priority: "medium",
    createdAt: taskDate(7, 10),
    updatedAt: taskDate(7, 10),
    assignees: [member("mohamed"), member("sultan"), member("afft"), member("ahmed")],
    commentsCount: 0
  },
  {
    id: 9109,
    projectId: DERIV_PROJECT_ID,
    title: "Prepare project report",
    description: "Write the final report covering requirements, architecture, AI usage, testing, and delivery notes.",
    deadline: taskDate(21),
    status: "todo",
    priority: "medium",
    createdAt: taskDate(7, 12),
    updatedAt: taskDate(7, 12),
    assignees: [member("mohamed"), member("afft"), member("ahmed")],
    commentsCount: 0
  },
  {
    id: 9110,
    projectId: DERIV_PROJECT_ID,
    title: "Final testing and polish",
    description: "Run final checks, improve interface details, and make sure the client handoff feels complete.",
    deadline: taskDate(23),
    status: "todo",
    priority: "high",
    createdAt: taskDate(8, 9),
    updatedAt: taskDate(8, 9),
    assignees: [member("mohamed"), member("sultan"), member("afft"), member("ahmed")],
    commentsCount: 0
  },
  {
    id: 9111,
    projectId: DERIV_PROJECT_ID,
    title: "Project delivery",
    description: "Package and deliver the completed AI-first client project, presentation, and report by the deadline.",
    deadline: derivProjectDeadline,
    status: "todo",
    priority: "high",
    createdAt: taskDate(9, 10),
    updatedAt: taskDate(9, 10),
    assignees: [member("mohamed"), member("sultan"), member("afft"), member("ahmed")],
    commentsCount: 0
  }
] as const;

export const derivProjectSummary = {
  id: DERIV_PROJECT_ID,
  name: "Deriv Project",
  code: "DERIV25",
  description: "An AI-first project to build a client project.",
  deadline: derivProjectDeadline,
  memberCount: derivProjectMembers.length,
  completionRate: Math.round(
    (derivProjectTasks.filter((task) => task.status === "done").length / derivProjectTasks.length) * 100
  ),
  nextMeeting: null,
  members: derivProjectMembers
};

export const isDerivProjectId = (projectId: number) => projectId === DERIV_PROJECT_ID;

export const getDerivDashboard = () => {
  const now = new Date();
  const dueSoonThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const completedTasks = derivProjectTasks.filter((task) => task.status === "done").length;
  const overdueTasks = derivProjectTasks.filter((task) => task.deadline < now && task.status !== "done");
  const dueSoonTasks = derivProjectTasks.filter(
    (task) => task.deadline >= now && task.deadline <= dueSoonThreshold && task.status !== "done"
  );

  return {
    project: {
      id: derivProjectSummary.id,
      name: derivProjectSummary.name,
      code: derivProjectSummary.code,
      description: derivProjectSummary.description,
      deadline: derivProjectSummary.deadline
    },
    stats: {
      totalTasks: derivProjectTasks.length,
      completedTasks,
      completionRate: derivProjectSummary.completionRate,
      overdueCount: overdueTasks.length,
      dueSoonCount: dueSoonTasks.length,
      meetingCount: 0,
      memberCount: derivProjectMembers.length
    },
    dueSoonTasks,
    overdueTasks,
    upcomingMeetings: [],
    members: derivProjectMembers,
    activity: derivProjectTasks.slice(0, 6).map((task) => ({
      type: "task",
      timestamp: task.updatedAt,
      text: `Task planned: ${task.title}`
    }))
  };
};
