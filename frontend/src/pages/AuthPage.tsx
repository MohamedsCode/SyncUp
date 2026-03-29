import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";
import syncupLogo from "../assets/syncup-logo.png";
import { useAuthStore } from "../store/authStore";
import { User } from "../types";

type Mode = "login" | "register";

export const AuthPage = () => {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        mode === "login"
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password };

      const data = await apiRequest<{ token: string; user: User }>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setSession(data.token, data.user);
      navigate("/");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to continue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-8 text-frost">
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="flex justify-center pb-8">
          <img src={syncupLogo} alt="SyncUp logo" className="h-28 w-auto object-contain drop-shadow-[0_0_30px_rgba(139,92,246,0.35)] md:h-36" />
        </div>

        <div className="grid min-h-[calc(100vh-12rem)] items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="glass-panel page-enter overflow-hidden p-8 md:p-10">
            <div className="max-w-xl">
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-electric">
                Intelligent Team Coordination
              </span>
              <h1 className="panel-title mt-6 font-display text-5xl font-semibold tracking-tight text-frost">
                SyncUp turns busy student teams into one clear workflow.
              </h1>
              <p className="mt-5 text-lg leading-8 text-muted">
                Plan tasks, align availability, surface urgency, and move from scattered messages to one premium
                workspace with momentum built in.
              </p>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {[
                  ["Task Flow", "Kanban planning with urgency glow, assignees, and clean ownership."],
                  ["Meeting Intel", "Smart slot recommendations ranked by shared availability and pressure."],
                  ["Team Signal", "Project chat, notifications, and one view of what matters now."]
                ].map(([title, text]) => (
                  <div key={title} className="glass-subpanel rounded-[24px] p-4 transition-transform duration-150 ease-glass hover:-translate-y-0.5">
                    <p className="font-display text-lg font-semibold text-frost">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="glass-panel page-enter p-8 md:p-10">
            <div className="glass-subpanel flex rounded-full p-1">
              {(["login", "register"] as Mode[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setMode(item)}
                  className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold capitalize transition-all duration-200 ease-glass ${
                    mode === item
                      ? "bg-gradient-to-r from-electric to-violet text-white shadow-glow"
                      : "text-muted hover:text-frost"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <form className="mt-8 space-y-4" onSubmit={submit}>
              {mode === "register" ? (
                <div>
                  <label className="text-sm font-medium text-frost/90">Full name</label>
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="soft-input mt-2 w-full rounded-2xl px-4 py-3"
                    placeholder="Khalid Hamad"
                    required
                  />
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium text-frost/90">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="soft-input mt-2 w-full rounded-2xl px-4 py-3"
                  placeholder="team@university.edu"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-frost/90">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="soft-input mt-2 w-full rounded-2xl px-4 py-3"
                  placeholder="At least 8 characters"
                  required
                />
              </div>

              {error ? (
                <p className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="glow-button w-full rounded-2xl px-4 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Working..." : mode === "login" ? "Sign in to SyncUp" : "Create account"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};
