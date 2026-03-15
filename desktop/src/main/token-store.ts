import { safeStorage } from "electron";
import Store from "electron-store";

export interface UserMeta {
  email: string;
  name: string | null;
  image: string | null;
  tokenExpiresAt: number | null;
}

interface StoreSchema {
  encryptedToken: string;
  user: UserMeta;
}

const store = new Store<StoreSchema>({ name: "nightstand-auth" });

export function saveToken(apiToken: string, user: UserMeta): void {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(apiToken);
    store.set("encryptedToken", encrypted.toString("base64"));
  } else {
    // Fallback: store plaintext (development / unsupported OS)
    store.set("encryptedToken", Buffer.from(apiToken).toString("base64"));
  }
  store.set("user", user);
}

export function getToken(): string | null {
  const raw = store.get("encryptedToken", null);
  if (!raw) return null;

  try {
    const buf = Buffer.from(raw, "base64");
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(buf);
    }
    return buf.toString();
  } catch {
    return null;
  }
}

export function getUser(): UserMeta | null {
  return store.get("user", null) as UserMeta | null;
}

export function clearAuth(): void {
  store.delete("encryptedToken");
  store.delete("user");
}

export function isTokenExpired(): boolean {
  const user = getUser();
  if (!user?.tokenExpiresAt) return false;
  return user.tokenExpiresAt < Date.now();
}
