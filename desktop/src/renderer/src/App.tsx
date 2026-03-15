import { useEffect, useState } from "react";
import type { UserMeta } from "./lib/types";
import { Sidebar, type Screen } from "./components/sidebar";
import { LoginScreen } from "./screens/login-screen";
import { DashboardScreen } from "./screens/dashboard-screen";
import { CollectionsScreen } from "./screens/collections-screen";
import { SharesScreen } from "./screens/shares-screen";

type AuthState = "loading" | "unauthenticated" | "authenticated";

export default function App() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserMeta | null>(null);
  const [screen, setScreen] = useState<Screen>("dashboard");

  useEffect(() => {
    // Load token on mount
    Promise.all([
      window.electronAPI.getToken(),
      window.electronAPI.getUser(),
    ]).then(([t, u]) => {
      if (t) {
        setToken(t);
        setUser(u);
        setAuthState("authenticated");
      } else {
        setAuthState("unauthenticated");
      }
    });

    // Listen for system dark mode changes
    const unsubscribe = window.electronAPI.onThemeChanged((isDark) => {
      document.documentElement.classList.toggle("dark", isDark);
    });

    return unsubscribe;
  }, []);

  async function handleLogin() {
    const [t, u] = await Promise.all([
      window.electronAPI.getToken(),
      window.electronAPI.getUser(),
    ]);
    if (t) {
      setToken(t);
      setUser(u);
      setAuthState("authenticated");
    }
  }

  async function handleSignOut() {
    await window.electronAPI.logout();
    setToken(null);
    setUser(null);
    setAuthState("unauthenticated");
  }

  if (authState === "loading") {
    return (
      <div className="flex h-full items-center justify-center bg-ns-bg">
        <p className="text-sm text-ns-ink/50">Loading…</p>
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-full overflow-hidden bg-ns-bg">
      <Sidebar
        active={screen}
        onNavigate={setScreen}
        user={user}
        onSignOut={handleSignOut}
      />
      <main className="flex-1 overflow-y-auto p-6">
        {screen === "dashboard" && <DashboardScreen token={token!} />}
        {screen === "collections" && <CollectionsScreen token={token!} />}
        {screen === "shared" && <SharesScreen token={token!} />}
      </main>
    </div>
  );
}
