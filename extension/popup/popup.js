console.log("[nightstand] popup script loaded");

const pageUrlEl = document.getElementById("page-url");
const saveBtn = document.getElementById("save-btn");
const statusEl = document.getElementById("status");
const signInSection = document.getElementById("sign-in-section");
const signedInSection = document.getElementById("signed-in-section");
const accountEmailEl = document.getElementById("account-email");

let currentUrl = null;
let apiUrl = null;
let apiToken = null;

// NOTE: This should match the web app's GOOGLE_CLIENT_ID.
// For now we inline it here for the extension auth flow.
const GOOGLE_CLIENT_ID =
  "443865035562-frma26noeasdm8udf075r4kad2oddskc.apps.googleusercontent.com";

function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className = `status ${cls ?? ""}`;
}

async function ensureApiConfig() {
  // In development this is usually http://localhost:3000
  const stored = await chrome.storage.local.get(["apiUrl"]);
  apiUrl = stored.apiUrl || "http://localhost:3000";
}

async function init() {
  await ensureApiConfig();

  const stored = await chrome.storage.local.get([
    "nightstandApiToken",
    "apiKey",
    "accountEmail",
  ]);
  apiToken = stored.nightstandApiToken || stored.apiKey || null;
  const accountEmail = stored.accountEmail || null;

  if (!apiToken) {
    signInSection.hidden = false;
    signedInSection.hidden = true;
  } else {
    signInSection.hidden = true;
    signedInSection.hidden = false;
    accountEmailEl.textContent = accountEmail || "";
  }

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab || !tab.url) {
    pageUrlEl.textContent = "Cannot read this tab's URL.";
    return;
  }

  currentUrl = tab.url;
  pageUrlEl.textContent = currentUrl;
  saveBtn.disabled = !apiToken;
}

async function signInWithGoogle() {
  await ensureApiConfig();

  try {
    console.log("[nightstand] sign-in button clicked");
    setStatus("Opening Google…", "");

    const redirectUri = chrome.identity.getRedirectURL("oauth2");
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("response_type", "token");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", "openid email profile");

    const redirectUrl = await new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        { url: authUrl.toString(), interactive: true },
        (responseUrl) => {
          if (chrome.runtime.lastError || !responseUrl) {
            console.error(
              "[nightstand] launchWebAuthFlow error",
              chrome.runtime.lastError,
            );
            reject(chrome.runtime.lastError || new Error("No redirect URL"));
            return;
          }
          resolve(responseUrl);
        },
      );
    });

    const fragment = redirectUrl.split("#")[1] || "";
    const params = new URLSearchParams(fragment);
    const accessToken = params.get("access_token");

    if (!accessToken) {
      console.error("[nightstand] no access_token in redirect URL");
      setStatus("Google sign-in failed", "status-error");
      return;
    }

    const res = await fetch(`${apiUrl}/api/auth/google/extension`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accessToken }),
    });
    const data = await res.json();

    if (!res.ok || !data.user?.apiToken) {
      setStatus(data.error ?? "Google sign-in failed", "status-error");
      return;
    }

    apiToken = data.user.apiToken;
    await chrome.storage.local.set({
      nightstandApiToken: apiToken,
      accountEmail: data.user.email ?? "",
      apiUrl,
    });

    signInSection.hidden = true;
    signedInSection.hidden = false;
    accountEmailEl.textContent = data.user.email ?? "";
    saveBtn.disabled = !currentUrl;
    setStatus("Signed in", "status-ok");
  } catch (err) {
    console.error("[nightstand] signInWithGoogle failed", err);
    setStatus("Google sign-in failed", "status-error");
  }
}

async function saveLink() {
  if (!currentUrl || !apiUrl || !apiToken) return;

  saveBtn.disabled = true;
  setStatus("Saving…", "");

  try {
    const res = await fetch(`${apiUrl}/api/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ url: currentUrl }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data?.error ?? `Error (${res.status})`, "status-error");
      saveBtn.disabled = false;
      return;
    }

    if (data.status === "duplicate") {
      setStatus("Already saved", "status-duplicate");
    } else {
      setStatus("Saved!", "status-ok");
    }
  } catch (err) {
    console.error(err);
    setStatus("Network error", "status-error");
    saveBtn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const signInBtn = document.getElementById("sign-in-btn");
  if (signInBtn) {
    signInBtn.addEventListener("click", () => {
      void signInWithGoogle();
    });
  }

  saveBtn.addEventListener("click", () => {
    void saveLink();
  });

  void init();
});
