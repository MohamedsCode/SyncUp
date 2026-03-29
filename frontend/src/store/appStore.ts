import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Notification, ProjectSummary } from "../types";

interface AppState {
  projects: ProjectSummary[];
  selectedProjectId: number | null;
  notifications: Notification[];
  setProjects: (projects: ProjectSummary[]) => void;
  setSelectedProjectId: (projectId: number | null) => void;
  setNotifications: (notifications: Notification[]) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      projects: [],
      selectedProjectId: null,
      notifications: [],
      setProjects: (projects) =>
        set((state) => ({
          projects,
          selectedProjectId:
            state.selectedProjectId && projects.some((project) => project.id === state.selectedProjectId)
              ? state.selectedProjectId
              : projects[0]?.id ?? null
        })),
      setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
      setNotifications: (notifications) => set({ notifications }),
      reset: () => set({ projects: [], selectedProjectId: null, notifications: [] })
    }),
    {
      name: "syncup-app"
    }
  )
);
