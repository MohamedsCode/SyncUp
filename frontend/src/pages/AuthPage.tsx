import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";
import syncupLogo from "../assets/syncup-logo.png";
import { useAuthStore } from "../store/authStore";
import { User } from "../types";

type Mode = "login" | "register";

const productHighlights = [
  {
    title: "Clear task ownership",
    text: "Keep deadlines, assignees, and task comments aligned in one calm workflow."
  },
  {
    title: "Smarter meeting planning",
    text: "Turn availability into practical meeting recommendations with urgency built in."
  },
  {
    title: "Shared team context",
    text: "Chat, files, notifications, and meeting history stay organized in one workspace."
  }
];

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
    <div className="app-shell-background relative min-h-screen overflow-hidden px-4 py-6 text-foreground sm:px-6 md:px-8">
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(18rem,24rem)_minmax(24rem,31rem)] lg:gap-16 xl:gap-20">
          <section className="hidden lg:flex lg:justify-center">
            <img src={syncupLogo} alt="SyncUp logo" className="h-61 w-auto object-contain xl:h-70" />
          </section>

          <section className="glass-panel mx-auto w-full max-w-[31rem] rounded-[2rem] p-6 sm:p-8">
            <div className="text-center">
              <div className="flex justify-center pb-4 lg:hidden">
                <img src={syncupLogo} alt="SyncUp logo" className="h-20 w-auto object-contain" />
              </div>
              <p className="stat-label">Welcome back</p>
              <h2 className="panel-title mt-3 text-2xl font-bold leading-tight sm:text-[1.85rem]">
                {mode === "login" ? "Sign in to continue" : "Create your account"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {mode === "login"
                  ? "Access your projects, deadlines, meetings, and team conversations, all in one place."
                  : "Join your team workspace and start coordinating in one place."}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 rounded-[1.25rem] bg-muted/55 p-1.5">
              {(["login", "register"] as Mode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`rounded-[1rem] px-4 py-2.5 text-sm font-semibold capitalize ${mode === item ? "glow-button" : "ghost-button"
                    }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <form className="mt-6 space-y-4" onSubmit={submit}>
              {mode === "register" ? (
                <div className="space-y-2">
                  <label htmlFor="auth-name" className="block text-sm font-semibold leading-6 text-foreground">
                    Full name
                  </label>
                  <input
                    id="auth-name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="soft-input w-full rounded-2xl px-4 py-3 text-sm"
                    placeholder="Khalid Hamad"
                    autoComplete="name"
                    required
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <label htmlFor="auth-email" className="block text-sm font-semibold leading-6 text-foreground">
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="soft-input w-full rounded-2xl px-4 py-3 text-sm"
                  placeholder="team@university.edu"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="auth-password" className="block text-sm font-semibold leading-6 text-foreground">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="soft-input w-full rounded-2xl px-4 py-3 text-sm"
                  placeholder="At least 8 characters"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                />
              </div>

              {error ? (
                <p
                  aria-live="polite"
                  className="rounded-2xl border border-danger/35 bg-danger/15 px-4 py-3 text-sm font-medium leading-6 text-danger"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="glow-button mt-2 w-full rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-70"
              >
                {loading ? "Working..." : mode === "login" ? "Sign in to SyncUp" : "Create account"}
              </button>

              <p className="text-center text-xs leading-6 text-muted-foreground">
                {mode === "login"
                  ? "Use the same email and password you registered with."
                  : "You can switch to Sign in at any time if you already have an account."}
              </p>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};
