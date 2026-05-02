import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { apiRequest } from "../api/client";
import type { AppLayoutContext } from "../App";
import { LoadingState } from "../components/LoadingState";
import { Meeting } from "../types";
import { formatDateTime } from "../utils/format";

export const MeetingsPage = () => {
  const { selectedProjectId } = useOutletContext<AppLayoutContext>();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedProjectId) {
      setMeetings([]);
      return;
    }

    let active = true;
    setLoading(true);

    apiRequest<{ meetings: Meeting[] }>(`/projects/${selectedProjectId}/meetings`)
      .then((data) => {
        if (active) {
          setMeetings(data.meetings);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load meetings.");
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
    return <div className="glass-panel page-enter p-6 text-sm text-muted-foreground">Select a project to view meetings.</div>;
  }

  if (loading) {
    return <LoadingState label="Loading meetings..." />;
  }

  return (
    <div className="glass-panel page-enter p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="panel-title text-3xl font-semibold text-foreground">Meetings</h1>
          <p className="mt-2 text-sm text-muted-foreground">All scheduled meetings for the selected project.</p>
        </div>
      </div>

      {error ? <p className="mt-4 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p> : null}

      <div className="mt-6 space-y-4">
        {meetings.map((meeting) => (
          <article key={meeting.id} className="glass-subpanel rounded-[24px] p-5 transition-transform duration-150 ease-glass hover:-translate-y-0.5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Meeting</p>
                <h2 className="panel-title mt-2 text-2xl font-semibold text-foreground">{formatDateTime(meeting.startDatetime)}</h2>
                <p className="mt-2 text-sm text-muted-foreground">Ends {formatDateTime(meeting.endDatetime)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {meeting.participants?.map((participant) => (
                  <span key={participant.id} className="rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm font-medium text-foreground">
                    {participant.name}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
        {meetings.length === 0 ? <p className="text-sm text-muted-foreground">No meetings scheduled yet.</p> : null}
      </div>
    </div>
  );
};
