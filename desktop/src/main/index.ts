import { app, BrowserWindow, nativeTheme, protocol } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";
import { registerIpcHandlers } from "./ipc-handlers";
import { resolveDeepLink } from "./auth-window";

// Register custom protocol for OAuth deep link
protocol.registerSchemesAsPrivileged([
  { scheme: "com.nightstand.app", privileges: { secure: true, standard: true } },
]);

// Single-instance lock — pass deep-link URL to the first instance on Windows
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    title: "Nightstand",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: "#f7f2e8",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  // Load app
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  // Send theme updates to renderer
  nativeTheme.on("updated", () => {
    mainWindow?.webContents.send("theme:changed", nativeTheme.shouldUseDarkColors);
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// macOS: OS routes the custom protocol URL here
app.on("open-url", (event, url) => {
  event.preventDefault();
  resolveDeepLink(url);
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Windows: second instance is launched with the deep-link URL in argv
app.on("second-instance", (_event, argv) => {
  const deepLinkUrl = argv.find((arg) => arg.startsWith("com.nightstand.app://"));
  if (deepLinkUrl) {
    resolveDeepLink(deepLinkUrl);
  }
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
