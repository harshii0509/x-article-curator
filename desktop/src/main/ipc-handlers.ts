import { ipcMain, shell } from "electron";
import { startGoogleAuth } from "./auth-window";
import { saveToken, getToken, getUser, clearAuth } from "./token-store";
import { app } from "electron";

export function registerIpcHandlers(): void {
  // Auth: start Google OAuth PKCE flow
  ipcMain.handle("auth:start-google", async () => {
    const result = await startGoogleAuth();
    saveToken(result.apiToken, result.user);
    return result;
  });

  // Auth: sign out
  ipcMain.handle("auth:logout", () => {
    clearAuth();
  });

  // Token: get decrypted API token
  ipcMain.handle("token:get", () => {
    return getToken();
  });

  // Token: get user metadata
  ipcMain.handle("token:get-user", () => {
    return getUser();
  });

  // App: open URL in system browser
  ipcMain.handle("app:open-url", (_event, url: string) => {
    shell.openExternal(url);
  });

  // App: get app version
  ipcMain.handle("app:get-version", () => {
    return app.getVersion();
  });
}
