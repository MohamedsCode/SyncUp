export {};

declare global {
  interface SyncUpWindowControls {
    minimize: () => Promise<void>;
    toggleMaximize: () => Promise<boolean>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
  }

  interface Window {
    syncuDesktop?: {
      getApiBaseUrl: () => string;
      getPlatform: () => string;
      windowControls?: SyncUpWindowControls;
    };
    syncupDesktop?: {
      getApiBaseUrl: () => string;
      getPlatform: () => string;
      windowControls?: SyncUpWindowControls;
    };
  }
}
