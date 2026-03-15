/// <reference types="vite/client" />

interface UserMeta {
  email: string;
  name: string | null;
  image: string | null;
  tokenExpiresAt: number | null;
}

interface AuthResult {
  apiToken: string;
  user: UserMeta;
}

interface ElectronAPI {
  startGoogleAuth: () => Promise<AuthResult>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  getUser: () => Promise<UserMeta | null>;
  openUrl: (url: string) => Promise<void>;
  getVersion: () => Promise<string>;
  onThemeChanged: (callback: (isDark: boolean) => void) => () => void;
}

declare interface Window {
  electronAPI: ElectronAPI;
}
