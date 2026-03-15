import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

export interface UserMeta {
  email: string;
  name: string | null;
  image: string | null;
  tokenExpiresAt: number | null;
}

export interface AuthResult {
  apiToken: string;
  user: UserMeta;
}

export interface ElectronAPI {
  startGoogleAuth: () => Promise<AuthResult>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  getUser: () => Promise<UserMeta | null>;
  openUrl: (url: string) => Promise<void>;
  getVersion: () => Promise<string>;
  onThemeChanged: (callback: (isDark: boolean) => void) => () => void;
}

const api: ElectronAPI = {
  startGoogleAuth: () => ipcRenderer.invoke("auth:start-google"),
  logout: () => ipcRenderer.invoke("auth:logout"),
  getToken: () => ipcRenderer.invoke("token:get"),
  getUser: () => ipcRenderer.invoke("token:get-user"),
  openUrl: (url: string) => ipcRenderer.invoke("app:open-url", url),
  getVersion: () => ipcRenderer.invoke("app:get-version"),
  onThemeChanged: (callback: (isDark: boolean) => void) => {
    const handler = (_: Electron.IpcRendererEvent, isDark: boolean): void => callback(isDark);
    ipcRenderer.on("theme:changed", handler);
    return () => ipcRenderer.removeListener("theme:changed", handler);
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("electronAPI", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore
  window.electron = electronAPI;
  // @ts-ignore
  window.electronAPI = api;
}
