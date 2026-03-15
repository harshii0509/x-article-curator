/**
 * Nightstand background script.
 *
 * RCA: The white popup appeared because the manifest had default_popup set.
 * When default_popup is set, Chrome always opens the popup window on icon click—
 * we cannot prevent or make it truly invisible. So we remove default_popup and
 * set the popup dynamically: when the user has a token we set popup to "" so
 * onClicked fires and we handle save here (inject toasts on the page, no popup).
 * When the user has no token we set popup to the login HTML so click opens the
 * popup for sign-in.
 */

const DEFAULT_API_URL = "https://nightstand.com";

/** Injected into the page. mode: "loading" | "success" | "duplicate". */
function showNightstandToastOnPage(mode, message) {
  const styleId = "nightstand-toast-style-" + Date.now();
  const baseCss =
    ".nightstand-toast-wrap{position:fixed;top:24px;right:32px;z-index:2147483647;display:flex;align-items:center;border-radius:9999px;background:#212121;padding:6px;gap:4px;box-shadow:0 10px 15px -3px rgba(0,0,0,.25);font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:600;line-height:120%;letter-spacing:-0.1px;color:#EDEDED}.nightstand-toast-wrap.ns-enter{animation:ns-toast-enter .3s ease-out forwards}.nightstand-toast-wrap.ns-exit{animation:ns-toast-exit .3s ease-in forwards}.nightstand-toast-wrap .ns-spinner{width:16px;height:16px;animation:ns-spin .7s linear infinite;transform-origin:center}@keyframes ns-toast-enter{from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:translateX(0)}}@keyframes ns-toast-exit{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(32px)}}@keyframes ns-spin{to{transform:rotate(360deg)}}";
  function removeExisting() {
    const wraps = document.querySelectorAll(".nightstand-toast-wrap");
    wraps.forEach((w) => w.remove());
    const styles = document.querySelectorAll('[id^="nightstand-toast-style-"]');
    styles.forEach((s) => s.remove());
  }
  if (mode === "success" || mode === "duplicate") removeExisting();
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = baseCss;
  document.head.appendChild(style);
  const wrap = document.createElement("div");
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
    setTimeout(() => {
      wrap.classList.remove("ns-enter");
      wrap.classList.add("ns-exit");
      setTimeout(() => {
        wrap.remove();
        const s = document.getElementById(styleId);
        if (s) s.remove();
      }, 300);
    }, 2000);
  }
}

function isWebUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function applyPopupState() {
  const stored = await chrome.storage.local.get(["nightstandApiToken", "apiKey"]);
  const hasToken = !!(stored.nightstandApiToken || stored.apiKey);
  await chrome.action.setPopup({ popup: hasToken ? "" : "popup/popup.html" });
}

async function runSaveFlow(tab) {
  if (!tab?.id || !tab?.url) return;
  if (!isWebUrl(tab.url)) return;

  const stored = await chrome.storage.local.get(["apiUrl", "nightstandApiToken", "apiKey"]);
  const apiUrl = (stored.apiUrl && stored.apiUrl.trim()) || DEFAULT_API_URL;
  const apiToken = stored.nightstandApiToken || stored.apiKey || null;
  if (!apiToken) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: showNightstandToastOnPage,
      args: ["loading", "Add to your nightstand"],
    });
  } catch (e) {
    console.warn("[nightstand] Could not inject loading toast", e);
  }

  let res;
  try {
    res = await fetch(`${apiUrl}/api/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ url: tab.url }),
    });
  } catch (e) {
    console.warn("[nightstand] Save request failed", e);
    return;
  }

  let data = {};
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } catch {}

  if (res.status === 401) {
    await chrome.storage.local.remove(["nightstandApiToken", "apiKey", "accountEmail"]);
    await applyPopupState();
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showNightstandToastOnPage,
        args: ["success", "Session expired. Please sign in again."],
      });
    } catch {}
    return;
  }

  const mode = data.status === "duplicate" ? "duplicate" : "success";
  const label =
    data.status === "duplicate"
      ? "Already added to your nightstand"
      : "Added to your nightstand";

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: showNightstandToastOnPage,
      args: [mode, label],
    });
  } catch (e) {
    console.warn("[nightstand] Could not inject result toast", e);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  applyPopupState();
});

chrome.runtime.onStartup?.addListener(() => {
  applyPopupState();
});

applyPopupState();

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  if ("nightstandApiToken" in changes || "apiKey" in changes) {
    applyPopupState();
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  await runSaveFlow(tab);
});
