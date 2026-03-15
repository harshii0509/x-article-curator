import { useEffect, useState } from "react";
import type { UserMeta } from "../lib/types";

type TokenState = {
  token: string | null | undefined; // undefined = loading
  user: UserMeta | null;
};

export function useToken(): TokenState {
  const [state, setState] = useState<TokenState>({ token: undefined, user: null });

  useEffect(() => {
    Promise.all([
      window.electronAPI.getToken(),
      window.electronAPI.getUser(),
    ]).then(([token, user]) => {
      setState({ token, user });
    });
  }, []);

  return state;
}

// Refresh token state (call after login/logout)
export function refreshToken(): Promise<TokenState> {
  return Promise.all([
    window.electronAPI.getToken(),
    window.electronAPI.getUser(),
  ]).then(([token, user]) => ({ token, user }));
}
