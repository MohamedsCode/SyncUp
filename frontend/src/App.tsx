import { ReactNode, Suspense, lazy, startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { apiRequest } from "./api/client";
import { LoadingState } from "./components/LoadingState";
import { WindowTitleBar } from "./components/layout/WindowTitleBar";
import { useAppStore } from "./store/appStore";
import { useAuthStore } from "./store/authStore";
import { Notification, ProjectSummary, User } from "./types";

const AuthPage = lazy(() => import("./pages/AuthPage").then((module) => ({ default: module.AuthPage })));
const AppShell = lazy(() => import("./components/layout/AppShell").then((module) => ({ default: module.AppShell })));
const AvailabilityPage = lazy(() =>
  import("./pages/AvailabilityPage").then((module) => ({ default: module.AvailabilityPage }))
);
const ChatPage = lazy(() => import("./pages/ChatPage").then((module) => ({ default: module.ChatPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const FeaturesPage = lazy(() => import("./pages/FeaturesPage").then((module) => ({ default: module.FeaturesPage })));
const FileSharingPage = lazy(() =>
  import("./pages/FileSharingPage").then((module) => ({ default: module.FileSharingPage }))
);
const MeetingsPage = lazy(() => import("./pages/MeetingsPage").then((module) => ({ default: module.MeetingsPage })));
const SchedulerPage = lazy(() => import("./pages/SchedulerPage").then((module) => ({ default: module.SchedulerPage })));
const TasksPage = lazy(() => import("./pages/TasksPage").then((module) => ({ default: module.TasksPage })));

export interface AppLayoutContext {
  selectedProjectId: number | null;
  projects: ProjectSummary[];
  refreshProjects: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return children;
};

const AppLayout = () => {
  const logout = useAuthStore((state) => state.logout);
  const resetAppStore = useAppStore((state) => state.reset);
  const projects = useAppStore((state) => state.projects);
  const notifications = useAppStore((state) => state.notifications);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const setProjects = useAppStore((state) => state.setProjects);
  const setNotifications = useAppStore((state) => state.setNotifications);
  const setSelectedProjectId = useAppStore((state) => state.setSelectedProjectId);
  const [loading, setLoading] = useState(true);

  const refreshProjects = useCallback(async () => {
    const data = await apiRequest<{ projects: ProjectSummary[] }>("/projects");
    startTransition(() => setProjects(data.projects));
  }, [setProjects]);

  const refreshNotifications = useCallback(async () => {
    const data = await apiRequest<{ notifications: Notification[] }>("/notifications");
    startTransition(() => setNotifications(data.notifications));
  }, [setNotifications]);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        await Promise.all([refreshProjects(), refreshNotifications()]);
      } catch (error) {
        console.error(error);
        resetAppStore();
        logout();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, [logout, refreshNotifications, refreshProjects, resetAppStore]);

  const contextValue = useMemo<AppLayoutContext>(
    () => ({
      selectedProjectId,
      projects,
      refreshProjects,
      refreshNotifications
    }),
    [selectedProjectId, projects, refreshProjects, refreshNotifications]
  );

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <LoadingState label="Loading your workspace..." />
      </div>
    );
  }

  return (
    <AppShell
      projects={projects}
      selectedProjectId={selectedProjectId}
      notifications={notifications}
      outletContext={contextValue}
      onSelectProject={setSelectedProjectId}
      onCreateProject={async (name) => {
        await apiRequest("/projects", {
          method: "POST",
          body: JSON.stringify({ name })
        });
        await refreshProjects();
      }}
      onJoinProject={async (code) => {
        await apiRequest("/projects/join", {
          method: "POST",
          body: JSON.stringify({ code })
        });
        await refreshProjects();
      }}
      onUpdateProjectDeadline={async (projectId, deadline) => {
        await apiRequest(`/projects/${projectId}`, {
          method: "PATCH",
          body: JSON.stringify({ deadline })
        });
        await refreshProjects();
      }}
      onLogout={() => {
        resetAppStore();
        logout();
      }}
      onNotificationRead={async (notificationId) => {
        await apiRequest(`/notifications/${notificationId}/read`, {
          method: "PATCH"
        });
        await refreshNotifications();
      }}
    />
  );
};

const App = () => {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const resetAppStore = useAppStore((state) => state.reset);
  const themeMode = useAppStore((state) => state.themeMode);
  const hasWindowControls = Boolean((window.syncupDesktop ?? window.syncuDesktop)?.windowControls);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", themeMode === "dark");
    document.body.classList.toggle("dark", themeMode === "dark");
  }, [themeMode]);

  useEffect(() => {
    let active = true;

    const hydrateSession = async () => {
      if (!token) {
        return;
      }

      try {
        const data = await apiRequest<{ user: User }>("/auth/me");
        if (active) {
          setUser(data.user);
        }
      } catch {
        if (active) {
          resetAppStore();
          logout();
        }
      }
    };

    hydrateSession();
    return () => {
      active = false;
    };
  }, [logout, resetAppStore, setUser, token]);

  return (
    <div className={hasWindowControls ? "app-viewport desktop-window-root" : "app-viewport"}>
      <WindowTitleBar />
      <Suspense fallback={<LoadingState label="Loading..." />}>
        <Routes>
          <Route path="/auth" element={token ? <Navigate to="/" replace /> : <AuthPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="files" element={<FileSharingPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="meetings" element={<MeetingsPage />} />
            <Route path="scheduler" element={<SchedulerPage />} />
            <Route path="availability" element={<AvailabilityPage />} />
          </Route>
          <Route path="*" element={<Navigate to={token ? "/" : "/auth"} replace />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default App;
