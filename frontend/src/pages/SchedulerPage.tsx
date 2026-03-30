import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { apiRequest } from "../api/client";
import type { AppLayoutContext } from "../App";
import { SchedulerResponse, SchedulerSlot } from "../types";
import { dayLabel, formatDateTime } from "../utils/format";

export const SchedulerPage = () => {
  const { selectedProjectId, refreshNotifications } = useOutletContext<AppLayoutContext>();
  const [recommendations, setRecommendations] = useState<SchedulerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const findTimes = async () => {
    if (!selectedProjectId) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<SchedulerResponse>(`/projects/${selectedProjectId}/scheduler/recommendations`);
      setRecommendations(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to compute meeting slots.");
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async (slot: SchedulerSlot) => {
    if (!selectedProjectId) {
      return;
    }

    setBookingId(slot.startDateTime);
    try {
      await apiRequest(`/projects/${selectedProjectId}/meetings`, {
        method: "POST",
        body: JSON.stringify({
          startDatetime: slot.startDateTime,
          endDatetime: slot.endDateTime
        })
      });
      await refreshNotifications();
      await findTimes();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to schedule meeting.");
    } finally {
      setBookingId(null);
    }
  };

  if (!selectedProjectId) {
    return <div className="glass-panel page-enter p-6 text-sm text-muted">Select a project to run the scheduler.</div>;
  }

  const urgencyScore = recommendations ? Math.max(0, Math.min(1, recommendations.urgency.score)) : 0;
  const urgencyPercent = Math.max(12, Math.round(urgencyScore * 100));
  const urgencyBarClass =
    recommendations?.urgency.level === "high"
      ? "from-warning via-[#f97316] to-danger"
      : recommendations?.urgency.level === "medium"
        ? "from-warning to-[#f97316]"
        : "from-[#22c55e] to-[#16a34a]";

  return (
    <div className="page-enter space-y-6">
      <section className="glass-panel overflow-hidden p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-electric/20 bg-electric/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-electric">
              Urgency-Aware Scheduler
            </span>
            <h1 className="panel-title mt-4 font-display text-4xl font-semibold tracking-tight text-frost">Find common time with context.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
              SyncUp looks at overlapping weekly availability, checks deadline pressure, and recommends the best meeting
              windows for the project.
            </p>
          </div>
          <button
            onClick={findTimes}
            disabled={loading}
            className="glow-button rounded-[24px] px-6 py-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Finding..." : "Find Common Time"}
          </button>
        </div>
      </section>

      {error ? <p className="glass-panel p-4 text-sm text-danger">{error}</p> : null}

      {recommendations ? (
        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="glass-panel p-6">
            <h2 className="panel-title font-display text-2xl font-semibold text-frost">Urgency Snapshot</h2>
            <div className="glass-subpanel mt-5 rounded-[24px] p-5">
              <p className="text-sm text-muted">Urgency level</p>
              <p className="mt-2 font-display text-4xl font-semibold capitalize text-frost">{recommendations.urgency.level}</p>
              <div className="mt-4">
                <div className="h-3 overflow-hidden rounded-full bg-white/8">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${urgencyBarClass} transition-all duration-300 ease-glass`}
                    style={{ width: `${urgencyPercent}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-muted">
                  {recommendations.urgency.level === "high"
                    ? "Long red bar means the team should meet soon."
                    : recommendations.urgency.level === "medium"
                      ? "Medium amber bar means some time pressure is building."
                      : "Short green bar means the project still has breathing room."}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted">
              High urgency favors the earliest viable times. Low urgency leans toward wider overlap windows to maximize
              convenience.
            </p>
          </div>

          <div className="space-y-4">
            {recommendations.slots.map((slot) => (
              <article key={slot.startDateTime} className={`glass-panel p-6 ${slot.label ? "shadow-violet" : ""}`}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-electric">{dayLabel(slot.dayOfWeek)}</p>
                    <h3 className="panel-title mt-2 font-display text-2xl font-semibold text-frost">{formatDateTime(slot.startDateTime)}</h3>
                    <p className="mt-2 text-sm text-muted">
                      1-hour meeting block inside a {slot.overlapMinutes}-minute shared overlap window.
                    </p>
                    {slot.label ? (
                      <p className="mt-3 inline-flex rounded-full bg-gradient-to-r from-electric to-violet px-4 py-2 text-sm font-semibold text-white shadow-glow">
                        {slot.label}
                      </p>
                    ) : null}
                  </div>
                  <button
                    onClick={() => createMeeting(slot)}
                    disabled={bookingId === slot.startDateTime}
                    className="glow-button rounded-[22px] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {bookingId === slot.startDateTime ? "Scheduling..." : "Create meeting"}
                  </button>
                </div>
              </article>
            ))}
            {recommendations.slots.length === 0 ? (
              <div className="glass-panel p-6 text-sm text-muted">
                No 1-hour overlap was found across the whole team. Ask teammates to add more weekly availability.
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <div className="glass-panel p-6 text-sm text-muted">
          Run the scheduler to generate the top 3 recommended slots for your current project.
        </div>
      )}
    </div>
  );
};
