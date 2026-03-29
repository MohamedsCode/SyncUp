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
      <div className="glass-panel page-enter p-8">
        <h1 className="panel-title font-display text-3xl font-semibold text-frost">Create or join a project to get started</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
          The dashboard comes alive once your team has a workspace. Use the sidebar to create a new project or join
          with a unique code.
        </p>
      </div>
    );
  }

  if (loading && !dashboard) {
    return <LoadingState label="Loading project dashboard..." />;
  }

  if (error) {
    return <div className="glass-panel page-enter p-6 text-sm text-danger">{error}</div>;
  }

  if (!dashboard) {
    return null;
  }

  const completionRate = Math.max(0, Math.min(100, dashboard.stats.completionRate));

  return (
    <div className="page-enter space-y-6">
      <section className="glass-panel overflow-hidden p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-electric/20 bg-electric/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-electric">
              Project Dashboard
            </span>
            <h1 className="panel-title mt-4 font-display text-4xl font-semibold tracking-tight text-frost">{dashboard.project.name}</h1>
            <p className="mt-3 text-sm text-muted">
              Team code <span className="font-semibold text-frost">{dashboard.project.code}</span> with{" "}
              {dashboard.stats.memberCount} members collaborating in one place.
            </p>
          </div>
          <div className="glass-subpanel min-w-[240px] rounded-[24px] px-5 py-4 text-frost">
            <p className="text-sm text-muted">Completion</p>
            <p className="panel-title mt-2 font-display text-4xl font-semibold">{completionRate}%</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-electric via-cyan to-violet shadow-glow transition-all duration-500 ease-glass"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.22em] text-muted">Completed task progress</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Tasks", dashboard.stats.totalTasks],
            ["Due Soon", dashboard.stats.dueSoonCount],
            ["Overdue", dashboard.stats.overdueCount],
            ["Meetings", dashboard.stats.meetingCount]
          ].map(([label, value], index) => (
            <div key={label} className="glass-subpanel rounded-[24px] p-5 transition-transform duration-150 ease-glass hover:-translate-y-0.5">
              <p className="text-sm text-muted">{label}</p>
              <p className={`mt-2 font-display text-3xl font-semibold ${index === 1 ? "text-warning" : index === 2 ? "text-danger" : "text-frost"}`}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between">
            <h2 className="panel-title font-display text-2xl font-semibold text-frost">Focus Queue</h2>
            <span className="text-sm text-muted">Tasks nearest to action</span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="glass-subpanel rounded-[24px] border border-danger/20 p-4">
              <p className="text-sm font-semibold text-danger">Overdue</p>
              <div className="mt-4 space-y-3">
                {dashboard.overdueTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="rounded-2xl border border-danger/15 bg-danger/10 p-3">
                    <p className="font-semibold text-frost">{task.title}</p>
                    <p className="mt-1 text-xs text-muted">{formatDateTime(task.deadline)}</p>
                  </div>
                ))}
                {dashboard.overdueTasks.length === 0 ? <p className="text-sm text-muted">No overdue tasks.</p> : null}
              </div>
            </div>

            <div className="glass-subpanel rounded-[24px] border border-warning/20 p-4">
              <p className="text-sm font-semibold text-warning">Due in 24 hours</p>
              <div className="mt-4 space-y-3">
                {dashboard.dueSoonTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="rounded-2xl border border-warning/15 bg-warning/10 p-3">
                    <p className="font-semibold text-frost">{task.title}</p>
                    <p className="mt-1 text-xs text-muted">{formatDateTime(task.deadline)}</p>
                  </div>
                ))}
                {dashboard.dueSoonTasks.length === 0 ? <p className="text-sm text-muted">Nothing urgent right now.</p> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="panel-title font-display text-2xl font-semibold text-frost">Team Pulse</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {dashboard.members.map((member) => (
              <span key={member.id} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-frost/85">
                {member.name}
              </span>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            {dashboard.activity.map((item, index) => (
              <div key={`${item.type}-${index}`} className="glass-subpanel rounded-[20px] p-4 transition-transform duration-150 ease-glass hover:-translate-y-0.5">
                <p className="text-sm font-semibold capitalize text-frost">{item.type}</p>
                <p className="mt-2 text-sm text-muted">{item.text}</p>
                <p className="mt-2 text-xs text-muted/80">{formatDateTime(item.timestamp)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
