console.log("[nightstand] popup script loaded");

/**
 * Injected into the current tab. mode: "loading" | "success" | "duplicate".
 * Loading: spinner + message (no auto-remove). Success/duplicate: check + message, enter then exit after 2s.
 * Removes any existing nightstand toast before showing result.
 */
function showNightstandToastOnPage(mode, message) {
  var styleId = "nightstand-toast-style-" + Date.now();
  var baseCss =
    ".nightstand-toast-wrap{position:fixed;top:24px;right:32px;z-index:2147483647;display:flex;align-items:center;border-radius:9999px;background:#212121;padding:6px;gap:4px;box-shadow:0 10px 15px -3px rgba(0,0,0,.25);font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:600;line-height:120%;letter-spacing:-0.1px;color:#EDEDED}.nightstand-toast-wrap.ns-enter{animation:ns-toast-enter .3s ease-out forwards}.nightstand-toast-wrap.ns-exit{animation:ns-toast-exit .3s ease-in forwards}.nightstand-toast-wrap .ns-spinner{width:16px;height:16px;animation:ns-spin .7s linear infinite;transform-origin:center}@keyframes ns-toast-enter{from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:translateX(0)}}@keyframes ns-toast-exit{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(32px)}}@keyframes ns-spin{to{transform:rotate(360deg)}}";
  function removeExisting() {
    var wraps = document.querySelectorAll(".nightstand-toast-wrap");
    for (var i = 0; i < wraps.length; i++) wraps[i].remove();
    var styles = document.querySelectorAll('[id^="nightstand-toast-style-"]');
    for (var j = 0; j < styles.length; j++) styles[j].remove();
  }
  if (mode === "success" || mode === "duplicate") removeExisting();
  var style = document.createElement("style");
  style.id = styleId;
  style.textContent = baseCss;
  document.head.appendChild(style);
  var wrap = document.createElement("div");
  wrap.className = "nightstand-toast-wrap ns-enter";
  wrap.setAttribute("aria-live", "polite");
  if (mode === "loading") {
    wrap.innerHTML =
      '<svg class="ns-spinner" viewBox="0 0 24 24" fill="none" stroke="#00CA48" stroke-width="2" stroke-linecap="round" stroke-dasharray="16 48" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg><span></span>';
  } else {
    wrap.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00CA48" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg><span></span>';
  }
  wrap.querySelector("span").textContent = message;
  document.body.appendChild(wrap);
  if (mode === "success" || mode === "duplicate") {
    setTimeout(function () {
      wrap.classList.remove("ns-enter");
      wrap.classList.add("ns-exit");
      setTimeout(function () {
        wrap.remove();
        var s = document.getElementById(styleId);
        if (s) s.remove();
      }, 300);
    }, 2000);
  }
}

const CONFIG = window.NIGHTSTAND_CONFIG || {};
const GOOGLE_CLIENT_ID = CONFIG.GOOGLE_CLIENT_ID || "";
const DEFAULT_API_URL = CONFIG.DEFAULT_API_URL || "https://nightstand.com";

let apiUrl = null;
let apiToken = null;

function isProductionApiUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    const defaultHost = new URL(DEFAULT_API_URL).hostname;
    return u.hostname === defaultHost && (u.protocol === "http:" || u.protocol === "https:");
  } catch {
    return false;
  }
}

// ── View helpers ──────────────────────────────────────────────────────────────

function showView(id) {
  document.querySelectorAll(".view").forEach((el) => el.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function showLogin() {
  showView("view-login");
}

function showLoading() {
  showView("view-loading");
}

async function showResult(status, message) {
  if (status === "created" || status === "duplicate") {
    const mode = status === "created" ? "success" : "duplicate";
    const label = status === "created" ? "Added to your nightstand" : "Already added to your nightstand";
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (tab?.id) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: showNightstandToastOnPage,
          args: [mode, label],
        });
      } catch (e) {
        console.warn("[nightstand] Could not inject toast on page", e);
      }
    }
    window.close();
    return;
  }
  document.getElementById("error-text").textContent = message ?? "";
  showView("view-error");
}

// ── Core logic ────────────────────────────────────────────────────────────────

async function ensureApiConfig() {
  const stored = await chrome.storage.local.get(["apiUrl"]);
  apiUrl = (stored.apiUrl && stored.apiUrl.trim()) || DEFAULT_API_URL;
}

function isWebUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function saveLink() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    showResult("error", "Cannot read this tab's URL.");
    return;
  }
  if (!isWebUrl(tab.url)) {
    showResult(
      "error",
      "Only web pages (http or https) can be saved. Open a normal webpage and try again."
    );
    return;
  }

  if (tab.id) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showNightstandToastOnPage,
        args: ["loading", "Add to your nightstand"],
      });
    } catch (e) {
      console.warn("[nightstand] Could not inject loading toast", e);
    }
  }

  try {
    const res = await fetch(`${apiUrl}/api/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ url: tab.url }),
    });

    let data = {};
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    if (res.status === 401) {
      await chrome.storage.local.remove(["nightstandApiToken", "apiKey", "accountEmail"]);
      apiToken = null;
      showResult("error", "Session expired. Please sign in again.");
      return;
    }
    if (res.status === 429) {
      showResult("error", "Too many requests. Please try again in a minute.");
      return;
    }
    if (!res.ok) {
      const msg = data?.error ?? (isProductionApiUrl(apiUrl) ? "Something went wrong. Try again." : `Error (${res.status})`);
      showResult("error", msg);
      return;
    }

    showResult(data.status === "duplicate" ? "duplicate" : "created");
  } catch (err) {
    console.error("[nightstand] saveLink error", err);
    showResult("error", isProductionApiUrl(apiUrl) ? "Check your connection and try again." : "Network error");
  }
}

async function init() {
  await ensureApiConfig();

  const stored = await chrome.storage.local.get([
    "nightstandApiToken",
    "apiKey",
  ]);
  apiToken = stored.nightstandApiToken || stored.apiKey || null;

  if (!apiToken) {
    showLogin();
    return;
  }

  showLoading();
  await saveLink();
}

// ── Google OAuth ──────────────────────────────────────────────────────────────

async function signInWithGoogle() {
  const signInBtn = document.getElementById("sign-in-btn");
  signInBtn.disabled = true;

  if (!GOOGLE_CLIENT_ID) {
    showResult("error", "Sign-in is not configured. Please contact support.");
    signInBtn.disabled = false;
    return;
  }

  try {
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
      signInBtn.disabled = false;
      showResult("error", "Google sign-in failed");
      return;
    }

    let data;
    try {
      const res = await fetch(`${apiUrl}/api/auth/google/extension`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: res.ok ? "Invalid response" : `Server error (${res.status})` };
      }
      if (!res.ok || !data.user?.apiToken) {
        signInBtn.disabled = false;
        if (res.status === 429) {
          showResult("error", "Too many requests. Please try again in a minute.");
          return;
        }
        const rawMsg = data.error ?? `Google sign-in failed (${res.status})`;
        const msg = isProductionApiUrl(apiUrl) && res.status >= 500
          ? "Something went wrong. Please try again."
          : rawMsg;
        showResult("error", msg);
        return;
      }
    } catch (err) {
      console.error("[nightstand] auth API request failed", err);
      signInBtn.disabled = false;
      const networkMsg = isProductionApiUrl(apiUrl)
        ? "Couldn't connect. Check your internet and try again."
        : `Cannot reach API at ${apiUrl}. Set API URL in Options and ensure the server is running.`;
      showResult("error", networkMsg);
      return;
    }

    apiToken = data.user.apiToken;
    await chrome.storage.local.set({
      nightstandApiToken: apiToken,
      accountEmail: data.user.email ?? "",
      apiUrl,
    });

    // Immediately save after login — no second click needed.
    showLoading();
    await saveLink();
  } catch (err) {
    console.error("[nightstand] signInWithGoogle failed", err);
    signInBtn.disabled = false;
    showResult("error", isProductionApiUrl(apiUrl) ? "Something went wrong. Please try again." : "Google sign-in failed");
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("sign-in-btn").addEventListener("click", () => {
    void signInWithGoogle();
  });

  void init();
});
