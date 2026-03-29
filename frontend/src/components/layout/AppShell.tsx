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
    <div className="relative min-h-screen text-frost">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1680px] gap-6 p-4 md:p-6">
        <div className="glass-panel fixed inset-x-4 top-4 z-20 p-4 xl:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={syncupLogo} alt="SyncUp logo" className="h-12 w-auto object-contain drop-shadow-[0_0_18px_rgba(139,92,246,0.35)]" />
              <div>
                <p className="font-display text-xl font-semibold panel-title">SyncUp</p>
                <p className="text-xs text-muted">{unreadCount} unread notifications</p>
              </div>
            </div>
            <button onClick={onLogout} className="ghost-button rounded-2xl px-4 py-2 text-sm font-medium text-frost">
              Sign out
            </button>
          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-2 text-sm font-medium transition-colors duration-150 ease-glass ${
                    isActive
                      ? "glow-button text-white"
                      : "ghost-button text-muted hover:text-frost"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <aside className="glass-panel hidden w-[324px] shrink-0 p-5 xl:flex xl:flex-col">
          <div className="flex justify-center pt-2">
            <img src={syncupLogo} alt="SyncUp logo" className="h-40 w-auto object-contain drop-shadow-[0_0_26px_rgba(139,92,246,0.34)]" />
          </div>

          <div className="glass-subpanel mt-4 rounded-[24px] p-4">
            <label className="text-xs uppercase tracking-[0.28em] text-muted">Workspace</label>
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
          </div>

          <nav className="mt-5 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-medium transition-colors duration-150 ease-glass ${
                    isActive
                      ? "bg-gradient-to-r from-electric/90 to-violet/90 text-white shadow-violet"
                      : "ghost-button text-muted hover:text-frost"
                  }`
                }
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[11px] tracking-[0.24em]">
                  {item.short}
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="glass-subpanel mt-5 rounded-[24px] p-4">
            <form className="space-y-3" onSubmit={submitCreate}>
              <div>
                <label className="text-xs uppercase tracking-[0.28em] text-muted">Create Project</label>
                <input
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="Operating Systems Team"
                  className="soft-input mt-3 w-full rounded-2xl px-4 py-3 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={busyAction === "create"}
                className="glow-button w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyAction === "create" ? "Creating..." : "Create Project"}
              </button>
            </form>

            <form className="mt-4 space-y-3" onSubmit={submitJoin}>
              <div>
                <label className="text-xs uppercase tracking-[0.28em] text-muted">Join With Code</label>
                <input
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  placeholder="AB12CD"
                  className="soft-input mt-3 w-full rounded-2xl px-4 py-3 text-sm uppercase"
                />
              </div>
              <button
                type="submit"
                disabled={busyAction === "join"}
                className="ghost-button w-full rounded-2xl px-4 py-3 text-sm font-semibold text-frost disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyAction === "join" ? "Joining..." : "Join Project"}
              </button>
            </form>
          </div>

          <div className="glass-subpanel mt-5 flex-1 rounded-[24px] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.28em] text-muted">Notifications</p>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-frost/80">{unreadCount}</span>
            </div>
            <div className="mt-4 space-y-3">
              {notifications.slice(0, 5).map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => onNotificationRead(notification.id)}
                  className={`w-full rounded-[20px] border p-3 text-left transition-colors duration-150 ease-glass ${
                    notification.isRead
                      ? "border-white/8 bg-white/5 text-muted hover:bg-white/8"
                      : "border-electric/25 bg-gradient-to-r from-electric/20 to-violet/20 text-frost shadow-glow"
                  }`}
                >
                  <p className="text-sm font-medium">{notification.content}</p>
                  <p className="mt-2 text-xs text-muted">{formatDateTime(notification.createdAt)}</p>
                </button>
              ))}
              {notifications.length === 0 ? <p className="text-sm text-muted">No notifications yet.</p> : null}
            </div>
          </div>

          <button onClick={onLogout} className="ghost-button mt-5 rounded-2xl px-4 py-3 text-sm font-semibold text-frost">
            Sign out
          </button>
        </aside>

        <main className="flex-1 pt-[132px] xl:pt-0">
          <div className="glass-panel mb-6 hidden items-center justify-between gap-6 px-6 py-5 xl:flex">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.28em] text-muted">Current workspace</p>
              <h1 className="panel-title mt-2 font-display text-3xl font-semibold text-frost">
                {selectedProject?.name ?? "No project selected"}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="datetime-input-wrap min-w-[280px]">
                  <input
                    type="datetime-local"
                    value={deadlineInput}
                    onChange={(event) => setDeadlineInput(event.target.value)}
                    disabled={!selectedProjectId || deadlineBusy}
                    className="soft-input datetime-input w-full rounded-2xl px-4 py-3 text-sm disabled:opacity-60"
                  />
                </div>
                <button
                  type="button"
                  onClick={saveProjectDeadline}
                  disabled={!selectedProjectId || deadlineBusy}
                  className="glow-button rounded-2xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {deadlineBusy ? "Saving..." : "Save deadline"}
                </button>
                <button
                  type="button"
                  onClick={clearProjectDeadline}
                  disabled={!selectedProjectId || deadlineBusy || !deadlineInput}
                  className="ghost-button rounded-2xl px-4 py-3 text-sm font-semibold text-frost disabled:opacity-60"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="glass-subpanel rounded-2xl px-4 py-3 text-sm">
                <span className="text-muted">Notifications</span>
                <span className="ml-3 rounded-full bg-gradient-to-r from-electric to-violet px-2.5 py-1 text-xs font-semibold text-white">
                  {unreadCount}
                </span>
              </div>
              <div className="glass-subpanel flex items-center gap-3 rounded-2xl px-4 py-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-electric to-violet text-sm font-semibold text-white shadow-violet">
                  {profileInitials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-frost">{user?.name ?? "SyncUp Member"}</p>
                  <p className="text-xs text-muted">{user?.email ?? "Student workspace"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="page-enter">
            <Outlet context={outletContext} />
          </div>
        </main>
      </div>
    </div>
  );
};
