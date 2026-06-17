import { useAppStore } from "../store/appStore";

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12 1.75V4.25M12 19.75v2.5M4.75 12h-2.5M21.75 12h-2.5M4.93 4.93 6.7 6.7M17.3 17.3l1.77 1.77M17.3 6.7l1.77-1.77M4.93 19.07 6.7 17.3"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M20.1 14.05A8.55 8.55 0 0 1 9.95 3.9a8.9 8.9 0 1 0 10.15 10.15Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

interface ThemeToggleProps {
  compact?: boolean;
}

export const ThemeToggle = ({ compact = false }: ThemeToggleProps) => {
  const themeMode = useAppStore((state) => state.themeMode);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const isDark = themeMode === "dark";

  return (
    <button
      type="button"
      onClick={() => setThemeMode(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`theme-toggle ${compact ? "theme-toggle-compact" : ""}`}
    >
      <span className="theme-toggle-icon-shell">
        <span className={`theme-toggle-icon theme-toggle-sun ${isDark ? "" : "theme-toggle-icon-active"}`}>
          <SunIcon />
        </span>
        <span className={`theme-toggle-icon theme-toggle-moon ${isDark ? "theme-toggle-icon-active" : ""}`}>
          <MoonIcon />
        </span>
      </span>
      <span className="theme-toggle-copy">
        <span className="theme-toggle-label">Theme</span>
        <span className="theme-toggle-value">{isDark ? "Dark" : "Light"}</span>
      </span>
    </button>
  );
};
