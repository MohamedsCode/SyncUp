import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { apiRequest } from "../api/client";
import type { AppLayoutContext } from "../App";
import { LoadingState } from "../components/LoadingState";
import { DashboardData } from "../types";
import { formatDateTime } from "../utils/format";

export const DashboardPage = () => {
  const { selectedProjectId } = useOutletContext<AppLayoutContext>();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedProjectId) {
      setDashboard(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    apiRequest<DashboardData>(`/projects/${selectedProjectId}/dashboard`)
      .then((data) => {
        if (active) {
          setDashboard(data);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load dashboard.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedProjectId]);

  if (!selectedProjectId) {
    return (
      <div className="glass-panel rounded-[2rem] p-8">
        <span className="page-kicker">Workspace Required</span>
        <h1 className="panel-title mt-6 text-3xl font-bold">Create or join a project to unlock your dashboard.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          Once your team has a workspace, SyncUp will surface deadlines, meetings, member activity, and the clearest
          next actions from a single view.
        </p>
      </div>
    );
  }

  if (loading && !dashboard) {
    return <LoadingState label="Loading project dashboard..." />;
  }

  if (error) {
    return (
      <div className="glass-panel rounded-[2rem] p-6 text-sm font-medium text-danger">
        Something blocked the dashboard from loading: {error}
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const completionRate = Math.max(0, Math.min(100, dashboard.stats.completionRate));

  return (
    <div className="space-y-6">
      <section className="glass-panel overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <h1 className="panel-title text-balance text-4xl font-bold tracking-tight md:text-[2.8rem]">
              {dashboard.project.name}
            </h1>
            {dashboard.project.description ? (
              <p className="mt-4 max-w-2xl text-base leading-7 text-foreground">
                {dashboard.project.description}
              </p>
            ) : null}
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              Team code <span className="font-mono text-foreground">{dashboard.project.code}</span> with{" "}
              {dashboard.stats.memberCount} members.
            </p>
          </div>

          <div className="glass-subpanel min-w-[18rem] rounded-[1.75rem] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="stat-label">Completion</p>
                <p className="panel-title mt-3 text-4xl font-bold">{completionRate}%</p>
              </div>
              <span className="status-pill status-pill-primary">On track</span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted/80">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300 ease-glass"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Completed task progress across the current workspace.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="metric-card">
            <p className="stat-label">Tasks</p>
            <p className="mt-3 text-3xl font-bold text-foreground">{dashboard.stats.totalTasks}</p>
          </div>
          <div className="metric-card">
            <p className="stat-label">Due Soon</p>
            <p className="mt-3 text-3xl font-bold text-warning">{dashboard.stats.dueSoonCount}</p>
          </div>
          <div className="metric-card">
            <p className="stat-label">Overdue</p>
            <p className="mt-3 text-3xl font-bold text-danger">{dashboard.stats.overdueCount}</p>
          </div>
          <div className="metric-card">
            <p className="stat-label">Meetings</p>
            <p className="mt-3 text-3xl font-bold text-foreground">{dashboard.stats.meetingCount}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="stat-label">Focus Queue</p>
              <h2 className="panel-title mt-3 text-2xl font-bold">What needs attention next</h2>
            </div>
            <span className="status-pill status-pill-accent">Nearest actions</span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="glass-subpanel rounded-[1.75rem] p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-danger">Overdue</h3>
                <span className="status-pill status-pill-danger">{dashboard.overdueTasks.length}</span>
              </div>
              <div className="mt-4 space-y-3">
                {dashboard.overdueTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="rounded-3xl border border-danger/30 bg-danger/10 p-4">
                    <p className="text-sm font-semibold text-foreground">{task.title}</p>
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">{formatDateTime(task.deadline)}</p>
                  </div>
                ))}
                {dashboard.overdueTasks.length === 0 ? (
                  <div className="empty-panel text-sm">No overdue tasks. The team is clear here.</div>
                ) : null}
              </div>
            </article>

            <article className="glass-subpanel rounded-[1.75rem] p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-warning">Due in 24 hours</h3>
                <span className="status-pill status-pill-warning">{dashboard.dueSoonTasks.length}</span>
              </div>
              <div className="mt-4 space-y-3">
                {dashboard.dueSoonTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="rounded-3xl border border-warning/30 bg-warning/10 p-4">
                    <p className="text-sm font-semibold text-foreground">{task.title}</p>
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">{formatDateTime(task.deadline)}</p>
                  </div>
                ))}
                {dashboard.dueSoonTasks.length === 0 ? (
                  <div className="empty-panel text-sm">Nothing urgent in the next 24 hours.</div>
                ) : null}
              </div>
            </article>
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="stat-label">Team Pulse</p>
              <h2 className="panel-title mt-3 text-2xl font-bold">Live collaboration snapshot</h2>
            </div>
            <span className="status-pill status-pill-primary">{dashboard.members.length} members</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {dashboard.members.map((member) => (
              <span key={member.id} className="status-pill status-pill-primary normal-case tracking-normal">
                {member.name}
              </span>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            {dashboard.activity.map((item, index) => (
              <div key={`${item.type}-${index}`} className="glass-subpanel rounded-[1.5rem] p-4">
                <p className="stat-label capitalize">{item.type}</p>
                <p className="mt-3 text-sm leading-7 text-foreground">{item.text}</p>
                <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.timestamp)}</p>
              </div>
            ))}
            {dashboard.activity.length === 0 ? (
              <div className="empty-panel text-sm">Activity will appear here as teammates create momentum.</div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
};
