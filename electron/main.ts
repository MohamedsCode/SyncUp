import path from "path";
import net from "net";
import fs from "fs";
import os from "os";
import { BrowserWindow, app, dialog, ipcMain } from "electron";

let mainWindow: BrowserWindow | null = null;
let stopBackendServer: (() => Promise<void>) | null = null;

const startupLogPath = path.join(os.tmpdir(), "syncup-startup.log");
const logStartup = (message: string) => {
  if (!app.isPackaged) {
    return;
  }

  fs.appendFileSync(startupLogPath, `[${new Date().toISOString()}] ${message}\n`);
};

const canListenOnPort = (port: number) =>
  new Promise<boolean>((resolve) => {
    const probe = net.createServer();

    probe.once("error", () => {
      resolve(false);
    });

    probe.once("listening", () => {
      probe.close(() => resolve(true));
    });

    probe.listen(port);
  });

const findAvailablePort = async (preferredPort: number) => {
  for (let port = preferredPort; port < preferredPort + 50; port += 1) {
    if (await canListenOnPort(port)) {
      return port;
    }
  }

  return new Promise<number>((resolve, reject) => {
    const probe = net.createServer();

    probe.once("error", reject);
    probe.once("listening", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : preferredPort;
      probe.close(() => resolve(port));
    });

    probe.listen(0);
  });
};

const createMainWindow = async () => {
  logStartup("createMainWindow:start");
  const preloadPath = app.isPackaged
    ? path.join(__dirname, "preload.js")
    : path.join(__dirname, "preload.dev.cjs");
  if (app.isPackaged) {
    const apiPort = await findAvailablePort(Number(process.env.PORT ?? "4000"));
    process.env.PORT = String(apiPort);
    process.env.SYNCUP_API_URL = `http://localhost:${apiPort}`;
    process.env.SYNCUP_EMBEDDED_DATA = "1";
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? "syncup-packaged-demo-secret";
  } else {
    process.env.SYNCUP_API_URL = process.env.SYNCUP_API_URL ?? `http://localhost:${process.env.PORT ?? "4000"}`;
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#00000000",
    frame: false,
    transparent: true,
    resizable: true,
    hasShadow: true,
    autoHideMenuBar: true,
    title: "SyncUp",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on("maximize", () => {
    mainWindow?.webContents.send("window:maximized-change", true);
  });

  mainWindow.on("unmaximize", () => {
    mainWindow?.webContents.send("window:maximized-change", false);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  try {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL;
    if (devServerUrl) {
      await mainWindow.loadURL(devServerUrl);
      mainWindow.webContents.openDevTools({ mode: "detach" });
      return;
    }

    const appPath = app.getAppPath();
    logStartup(`appPath:${appPath}`);
    const backendEntry = path.join(appPath, "backend", "dist", "server.js");
    logStartup(`backendEntry:${backendEntry}`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const backendModule = require(backendEntry) as {
      startServer: () => Promise<unknown>;
      stopServer: () => Promise<void>;
    };

    await backendModule.startServer();
    logStartup("backend:startServer:ok");
    stopBackendServer = backendModule.stopServer;

    await mainWindow.loadFile(path.join(appPath, "frontend", "dist", "index.html"));
    logStartup("frontend:loadFile:ok");
  } catch (error) {
    const message = error instanceof Error ? `${error.message}\n\n${error.stack ?? ""}` : String(error);
    logStartup(`error:${message}`);
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

const getSenderWindow = (event: Electron.IpcMainInvokeEvent | Electron.IpcMainEvent) =>
  BrowserWindow.fromWebContents(event.sender);

ipcMain.handle("window:minimize", (event) => {
  getSenderWindow(event)?.minimize();
});

ipcMain.handle("window:toggle-maximize", (event) => {
  const window = getSenderWindow(event);
  if (!window) {
    return false;
  }

  if (window.isMaximized()) {
    window.unmaximize();
  } else {
    window.maximize();
  }

  return window.isMaximized();
});

ipcMain.handle("window:close", (event) => {
  getSenderWindow(event)?.close();
});

ipcMain.handle("window:is-maximized", (event) => getSenderWindow(event)?.isMaximized() ?? false);

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
