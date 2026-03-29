import path from "path";
import { BrowserWindow, app, dialog } from "electron";

let mainWindow: BrowserWindow | null = null;
let stopBackendServer: (() => Promise<void>) | null = null;

const createMainWindow = async () => {
  const preloadPath = app.isPackaged
    ? path.join(__dirname, "preload.js")
    : path.join(__dirname, "preload.dev.cjs");
  process.env.SYNCUP_API_URL = process.env.SYNCUP_API_URL ?? `http://localhost:${process.env.PORT ?? "4000"}`;

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#f5efe6",
    title: "SyncUp",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  try {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL;
    if (devServerUrl) {
      await mainWindow.loadURL(devServerUrl);
      mainWindow.webContents.openDevTools({ mode: "detach" });
      return;
    }

    const appPath = app.getAppPath();
    const backendEntry = path.join(appPath, "backend", "dist", "server.js");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const backendModule = require(backendEntry) as {
      startServer: () => Promise<unknown>;
      stopServer: () => Promise<void>;
    };

    await backendModule.startServer();
    stopBackendServer = backendModule.stopServer;

    await mainWindow.loadFile(path.join(appPath, "frontend", "dist", "index.html"));
  } catch (error) {
    const message = error instanceof Error ? `${error.message}\n\n${error.stack ?? ""}` : String(error);
    console.error("SyncUp desktop startup failed:", error);
    dialog.showErrorBox("SyncUp failed to start", message);
    await mainWindow.loadURL(
      `data:text/html;charset=UTF-8,${encodeURIComponent(`
        <html>
          <body style="font-family: Segoe UI, sans-serif; background: #f5efe6; color: #1f2937; padding: 32px;">
            <h1 style="margin-top: 0;">SyncUp failed to start</h1>
            <p>The desktop app hit a startup error. Please check your MySQL connection and packaged environment.</p>
            <pre style="white-space: pre-wrap; background: white; padding: 16px; border-radius: 12px; overflow: auto;">${message}</pre>
          </body>
        </html>
      `)}`
    );
  }
};

app.whenReady().then(async () => {
  await createMainWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  if (stopBackendServer) {
    await stopBackendServer();
  }
});
