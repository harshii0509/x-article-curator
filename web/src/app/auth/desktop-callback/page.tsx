import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ code?: string; state?: string; error?: string }>;
}

export default async function DesktopCallbackPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { code, state, error } = params;

  if (error || !code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ns-bg text-ns-ink">
        <div className="text-center p-8 max-w-md">
          <p className="text-lg font-medium mb-2">Sign-in failed</p>
          <p className="text-sm text-ns-ink/60">{error ?? "No authorisation code was returned."}</p>
          <p className="text-sm text-ns-ink/60 mt-4">You can close this tab and try again from the app.</p>
        </div>
      </div>
    );
  }

  const clientId = process.env.GOOGLE_DESKTOP_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DESKTOP_CLIENT_SECRET;
  const redirectUri = "https://nightstand.com/auth/desktop-callback";

  if (!clientId || !clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ns-bg text-ns-ink">
        <p className="text-sm text-ns-ink/60">Server configuration error. Please contact support.</p>
      </div>
    );
  }

  let accessToken: string;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      throw new Error(body);
    }

    const json = (await tokenRes.json()) as { access_token: string };
    accessToken = json.access_token;
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ns-bg text-ns-ink">
        <div className="text-center p-8 max-w-md">
          <p className="text-lg font-medium mb-2">Sign-in failed</p>
          <p className="text-sm text-ns-ink/60">Could not exchange the authorisation code. Please try again.</p>
        </div>
      </div>
    );
  }

  const deepLinkParams = new URLSearchParams({ accessToken });
  if (state) deepLinkParams.set("state", state);

  redirect(`com.nightstand.app://oauth2callback?${deepLinkParams}`);
}
