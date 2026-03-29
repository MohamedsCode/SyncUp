export {};

declare global {
  interface Window {
    syncuDesktop?: {
      getApiBaseUrl: () => string;
      getPlatform: () => string;
    };
    syncupDesktop?: {
      getApiBaseUrl: () => string;
      getPlatform: () => string;
    };
  }
}
