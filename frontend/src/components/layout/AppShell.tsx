import { FormEvent, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import type { AppLayoutContext } from "../../App";
import syncupLogo from "../../assets/syncup-logo.png";
import { useAuthStore } from "../../store/authStore";
import { Notification, ProjectSummary } from "../../types";
import { formatDateTime } from "../../utils/format";

interface AppShellProps {
  projects: ProjectSummary[];
  selectedProjectId: number | null;
  notifications: Notification[];
  outletContext: AppLayoutContext;
  onSelectProject: (projectId: number) => void;
  onCreateProject: (name: string) => Promise<void>;
  onJoinProject: (code: string) => Promise<void>;
  onUpdateProjectDeadline: (projectId: number, deadline: string | null) => Promise<void>;
  onLogout: () => void;
  onNotificationRead: (notificationId: number) => Promise<void>;
}

const navItems = [
  { to: "/", label: "Dashboard", short: "DB" },
  { to: "/tasks", label: "Tasks", short: "TK" },
  { to: "/files", label: "File Sharing", short: "FS" },
  { to: "/chat", label: "Chat", short: "CH" },
  { to: "/meetings", label: "Meetings", short: "MT" },
  { to: "/scheduler", label: "Scheduler", short: "SC" },
  { to: "/availability", label: "Availability", short: "AV" }
];

export const AppShell = ({
  projects,
  selectedProjectId,
  notifications,
  outletContext,
  onSelectProject,
  onCreateProject,
  onJoinProject,
  onUpdateProjectDeadline,
  onLogout,
  onNotificationRead
}: AppShellProps) => {
  const user = useAuthStore((state) => state.user);
  const [projectName, setProjectName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busyAction, setBusyAction] = useState<"create" | "join" | null>(null);
  const [deadlineInput, setDeadlineInput] = useState("");
  const [deadlineBusy, setDeadlineBusy] = useState(false);

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.isRead).length, [notifications]);
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );
  const profileInitials = useMemo(
    () =>
      (user?.name ?? "SU")
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase(),
    [user?.name]
  );

  useEffect(() => {
    if (!selectedProject?.deadline) {
      setDeadlineInput("");
      return;
    }

    const date = new Date(selectedProject.deadline);
    const pad = (value: number) => value.toString().padStart(2, "0");
    setDeadlineInput(
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
    );
  }, [selectedProject?.deadline, selectedProject?.id]);

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!projectName.trim()) {
      return;
    }

    setBusyAction("create");
    try {
      await onCreateProject(projectName.trim());
      setProjectName("");
    } finally {
      setBusyAction(null);
    }
  };

  const submitJoin = async (event: FormEvent) => {
    event.preventDefault();
    if (!joinCode.trim()) {
      return;
    }

    setBusyAction("join");
    try {
      await onJoinProject(joinCode.trim());
      setJoinCode("");
    } finally {
      setBusyAction(null);
    }
  };

  const saveProjectDeadline = async () => {
    if (!selectedProjectId) {
      return;
    }

    setDeadlineBusy(true);
    try {
      await onUpdateProjectDeadline(selectedProjectId, deadlineInput ? new Date(deadlineInput).toISOString() : null);
    } finally {
      setDeadlineBusy(false);
    }
  };

  const clearProjectDeadline = async () => {
    if (!selectedProjectId) {
      return;
    }

    setDeadlineBusy(true);
    try {
      setDeadlineInput("");
      await onUpdateProjectDeadline(selectedProjectId, null);
    } finally {
      setDeadlineBusy(false);
    }
  };

  return (
    <div className="app-shell-background min-h-screen text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1720px] gap-6 px-4 py-4 md:px-6 md:py-6">
        <div className="sticky-glass fixed inset-x-4 top-4 z-30 rounded-3xl p-4 xl:hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={syncupLogo}
                alt="SyncUp logo"
                width="500"
                height="500"
                decoding="async"
                className="h-12 w-auto shrink-0 object-contain"
              />
              <div className="min-w-0">
                <p className="panel-title truncate text-lg font-semibold">SyncUp</p>
                <p className="truncate text-xs text-muted-foreground">
                  {selectedProject?.name ?? "Select a workspace"} - {unreadCount} unread
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onLogout} className="ghost-button rounded-2xl px-4 py-2 text-sm font-semibold">
                Sign out
              </button>
            </div>
          </div>

          <div className="mt-4 glass-subpanel rounded-3xl p-3">
            <select
              value={selectedProjectId ?? ""}
              onChange={(event) => {
                if (event.target.value) {
                  onSelectProject(Number(event.target.value));
                }
              }}
              className="soft-input w-full rounded-2xl px-4 py-3 text-sm"
            >
              {projects.length === 0 ? <option value="">No projects yet</option> : null}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive
                    ? "glow-button rounded-2xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap"
                    : "ghost-button rounded-2xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <aside className="glass-panel hidden h-[calc(100vh-3rem)] w-[330px] shrink-0 overflow-hidden rounded-[2rem] xl:sticky xl:top-6 xl:flex xl:flex-col">
          <div className="px-6 pt-6">
            <div className="flex justify-center">
              <img
                src={syncupLogo}
                alt="SyncUp logo"
                width="500"
                height="500"
                decoding="async"
                className="h-40 w-auto object-contain"
              />
            </div>
          </div>

          <div className="scrollbar-hidden flex-1 space-y-5 overflow-y-auto px-6 py-6">
            <section className="glass-subpanel rounded-3xl p-4">
              <div className="flex items-center justify-between">
                <p className="stat-label">Workspace</p>
                {selectedProject?.code ? (
                  <span className="status-pill status-pill-primary font-mono text-[0.68rem] tracking-[0.22em]">
                    {selectedProject.code}
                  </span>
                ) : null}
              </div>
              <select
                value={selectedProjectId ?? ""}
                onChange={(event) => {
                  if (event.target.value) {
                    onSelectProject(Number(event.target.value));
                  }
                }}
                className="soft-input mt-3 w-full rounded-2xl px-4 py-3 text-sm"
              >
                {projects.length === 0 ? <option value="">No projects yet</option> : null}
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </section>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
                >
                  <span className="nav-link-badge">{item.short}</span>
                  <span className="text-sm font-semibold">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <section className="glass-subpanel rounded-3xl p-4">
              <div className="space-y-4">
                <div>
                  <p className="stat-label">Create Project</p>
                  <form className="mt-3 space-y-3" onSubmit={submitCreate}>
                    <input
                      value={projectName}
                      onChange={(event) => setProjectName(event.target.value)}
                      placeholder="Operating Systems Team"
                      className="soft-input w-full rounded-2xl px-4 py-3 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={busyAction === "create"}
                      className="glow-button w-full rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
                    >
                      {busyAction === "create" ? "Creating..." : "Create Workspace"}
                    </button>
                  </form>
                </div>

                <div className="border-t border-border/70 pt-4">
                  <p className="stat-label">Join With Code</p>
                  <form className="mt-3 space-y-3" onSubmit={submitJoin}>
                    <input
                      value={joinCode}
                      onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                      placeholder="AB12CD"
                      className="soft-input w-full rounded-2xl px-4 py-3 text-sm uppercase"
                    />
                    <button
                      type="submit"
                      disabled={busyAction === "join"}
                      className="ghost-button w-full rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
                    >
                      {busyAction === "join" ? "Joining..." : "Join Workspace"}
                    </button>
                  </form>
                </div>
              </div>
            </section>

            <section className="glass-subpanel rounded-3xl p-4">
              <div className="flex items-center justify-between">
                <p className="stat-label">Notifications</p>
                <span className="status-pill status-pill-accent">{unreadCount}</span>
              </div>
              <div className="mt-4 space-y-3">
                {notifications.slice(0, 5).map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => onNotificationRead(notification.id)}
                    className={`w-full rounded-3xl border px-4 py-3 text-left ${notification.isRead
                      ? "border-border/70 bg-card/65 text-muted-foreground hover:border-accent/30 hover:bg-accent/10 hover:text-foreground"
                      : "border-accent/30 bg-accent/12 text-foreground shadow-glow"
                      }`}
                  >
                    <p className="text-sm font-semibold">{notification.content}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(notification.createdAt)}</p>
                  </button>
                ))}
                {notifications.length === 0 ? (
                  <div className="empty-panel text-sm">No notifications yet. New activity will appear here.</div>
                ) : null}
              </div>
            </section>
          </div>

          <div className="border-t border-border/70 px-6 py-5">
            <div className="glass-subpanel flex items-center justify-between rounded-3xl p-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-violet">
                  {profileInitials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{user?.name ?? "SyncUp Member"}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email ?? "Student workspace"}</p>
                </div>
              </div>
              <button onClick={onLogout} className="ghost-button rounded-2xl px-3 py-2 text-xs font-semibold">
                Sign out
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 pt-[12rem] xl:pt-0">
          <header className="glass-panel mb-5 rounded-[2rem] px-5 py-4 md:px-6 md:py-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="page-kicker">Current Workspace</span>
                  {selectedProject?.code ? (
                    <span className="status-pill status-pill-primary font-mono text-[0.68rem] tracking-[0.22em]">
                      {selectedProject.code}
                    </span>
                  ) : null}
                  <span className="status-pill status-pill-accent">{projects.length} projects</span>
                  <span className="status-pill status-pill-primary">{unreadCount} unread</span>
                </div>

                <h1 className="panel-title mt-4 text-3xl font-bold text-balance md:text-[2.35rem]">
                  {selectedProject?.name ?? "Choose a workspace to begin"}
                </h1>

                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="glass-subpanel rounded-2xl px-3 py-2">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Project deadline
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {selectedProject?.deadline ? formatDateTime(selectedProject.deadline) : "Not set yet"}
                    </p>
                  </div>
                </div>
              </div>

              <section className="glass-subpanel w-full rounded-[1.5rem] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="stat-label">Project Deadline</p>
                  </div>
                  <span className="status-pill status-pill-accent whitespace-nowrap">Editable</span>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <div className="datetime-input-wrap">
                    <input
                      type="datetime-local"
                      value={deadlineInput}
                      onChange={(event) => setDeadlineInput(event.target.value)}
                      disabled={!selectedProjectId || deadlineBusy}
                      className="soft-input datetime-input w-full rounded-2xl px-4 py-3 text-sm disabled:opacity-60"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={saveProjectDeadline}
                      disabled={!selectedProjectId || deadlineBusy}
                      className="glow-button rounded-2xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                    >
                      {deadlineBusy ? "Saving..." : "Save Deadline"}
                    </button>
                    <button
                      type="button"
                      onClick={clearProjectDeadline}
                      disabled={!selectedProjectId || deadlineBusy || !deadlineInput}
                      className="ghost-button rounded-2xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </header>

          <div className="page-enter">
            <Outlet context={outletContext} />
          </div>
        </main>
      </div>
    </div>
  );
};
