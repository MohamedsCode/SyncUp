import { Link } from "react-router-dom";
import syncupLogo from "../assets/syncup-logo.png";

const features = [
  { name: "Workspaces", summary: "organize projects, members, codes, and deadlines." },
  { name: "Dashboard", summary: "summarizes tasks, deadlines, meetings, and activity." },
  { name: "Tasks", summary: "create, assign, prioritize, comment on, and track work." },
  { name: "File Sharing", summary: "upload and download team project documents." },
  { name: "Chat", summary: "lets teammates message, mention, and react." },
  { name: "Meetings", summary: "lists scheduled sessions and participants." },
  { name: "Availability", summary: "records weekly free time for each member." },
  { name: "Scheduler", summary: "recommends meeting times from availability and urgency." },
  { name: "Notifications", summary: "alerts teammates about important project updates." }
];

export const FeaturesPage = () => (
  <div className="app-shell-background min-h-screen px-4 py-6 text-foreground sm:px-6 md:px-8">
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center justify-center">
      <section className="glass-panel w-full rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img
              src={syncupLogo}
              alt="SyncUp logo"
              width="500"
              height="500"
              decoding="async"
              className="h-14 w-auto object-contain"
            />
            <div>
              <p className="stat-label">Features</p>
              <h1 className="panel-title mt-1 text-3xl font-bold">What SyncUp offers</h1>
            </div>
          </div>
          <Link to="/auth" className="ghost-button inline-flex rounded-2xl px-4 py-3 text-sm font-semibold">
            Back to login
          </Link>
        </div>

        <div className="mt-7 grid gap-3">
          {features.map((feature) => (
            <p key={feature.name} className="glass-subpanel rounded-2xl px-4 py-3 text-sm leading-6 text-foreground">
              <strong>{feature.name}:</strong> {feature.summary}
            </p>
          ))}
        </div>
      </section>
    </div>
  </div>
);
