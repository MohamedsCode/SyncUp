const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("syncupDesktop", {
  getApiBaseUrl: () => process.env.SYNCUP_API_URL ?? "http://localhost:4000",
  getPlatform: () => process.platform,
  windowControls: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    toggleMaximize: () => ipcRenderer.invoke("window:toggle-maximize"),
    close: () => ipcRenderer.invoke("window:close"),
    isMaximized: () => ipcRenderer.invoke("window:is-maximized"),
    onMaximizedChange: (callback) => {
      const listener = (_event, isMaximized) => callback(isMaximized);
      ipcRenderer.on("window:maximized-change", listener);
      return () => ipcRenderer.removeListener("window:maximized-change", listener);
    }
  }
});
