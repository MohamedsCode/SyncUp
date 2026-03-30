import { ReactNode, startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { apiRequest } from "./api/client";
import { LoadingState } from "./components/LoadingState";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { AuthPage } from "./pages/AuthPage";
import { AvailabilityPage } from "./pages/AvailabilityPage";
import { ChatPage } from "./pages/ChatPage";
import { FileSharingPage } from "./pages/FileSharingPage";
import { MeetingsPage } from "./pages/MeetingsPage";
import { SchedulerPage } from "./pages/SchedulerPage";
import { TasksPage } from "./pages/TasksPage";
import { useAppStore } from "./store/appStore";
import { useAuthStore } from "./store/authStore";
import { Notification, ProjectSummary, User } from "./types";

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
  const [checkingSession, setCheckingSession] = useState(Boolean(token));

  useEffect(() => {
    let active = true;

    const hydrateSession = async () => {
      if (!token) {
        setCheckingSession(false);
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
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    };

    hydrateSession();
    return () => {
      active = false;
    };
  }, [logout, resetAppStore, setUser, token]);

  if (checkingSession) {
    return (
      <div className="min-h-screen p-6">
        <LoadingState label="Restoring your session..." />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={token ? <Navigate to="/" replace /> : <AuthPage />} />
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
  );
};

export default App;
