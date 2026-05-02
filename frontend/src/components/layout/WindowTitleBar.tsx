import { useEffect, useMemo, useState } from "react";
import syncupLogo from "../../assets/syncup-logo.png";

const MinimizeIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3.5 8.5h9" />
  </svg>
);

const MaximizeIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M4.5 4.5h7v7h-7z" />
  </svg>
);

const RestoreIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M6.5 4.5h5v5" />
    <path d="M4.5 6.5h5v5h-5z" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" />
  </svg>
);

export const WindowTitleBar = () => {
  const bridge = useMemo(() => window.syncupDesktop ?? window.syncuDesktop, []);
  const controls = bridge?.windowControls;
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("window-is-maximized", isMaximized);
    return () => document.body.classList.remove("window-is-maximized");
  }, [isMaximized]);

  useEffect(() => {
    if (!controls) {
      return undefined;
    }

    let active = true;
    void controls.isMaximized().then((maximized) => {
      if (active) {
        setIsMaximized(maximized);
      }
    });

    const unsubscribe = controls.onMaximizedChange(setIsMaximized);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [controls]);

  if (!controls) {
    return null;
  }

  return (
    <header className="window-titlebar">
      <div className="window-titlebar-brand">
        <img src={syncupLogo} alt="" width="500" height="500" decoding="async" className="window-titlebar-logo" />
        <span className="window-titlebar-name">SyncUp</span>
      </div>

      <div className="window-titlebar-controls">
        <button type="button" className="window-control-button" aria-label="Minimize window" onClick={() => void controls.minimize()}>
          <MinimizeIcon />
        </button>
        <button
          type="button"
          className="window-control-button"
          aria-label={isMaximized ? "Restore window" : "Maximize window"}
          onClick={() => {
            void controls.toggleMaximize().then(setIsMaximized);
          }}
        >
          {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
        </button>
        <button type="button" className="window-control-button window-control-close" aria-label="Close window" onClick={() => void controls.close()}>
          <CloseIcon />
        </button>
      </div>
    </header>
  );
};
