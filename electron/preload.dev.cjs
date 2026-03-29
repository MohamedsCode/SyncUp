const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("syncupDesktop", {
  getApiBaseUrl: () => process.env.SYNCUP_API_URL ?? "http://localhost:4000",
  getPlatform: () => process.platform
});
