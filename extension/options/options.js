const CONFIG = window.NIGHTSTAND_CONFIG || {};
const DEFAULT_API_URL = CONFIG.DEFAULT_API_URL || "https://nightstand.com";

const apiUrlInput = document.getElementById("api-url");
const apiKeyInput = document.getElementById("api-key");
const saveButton = document.getElementById("save");
const statusEl = document.getElementById("status");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b91c1c" : "#059669";
}

async function restoreOptions() {
  const { apiUrl, apiKey, nightstandApiToken } = await chrome.storage.local.get([
    "apiUrl",
    "apiKey",
    "nightstandApiToken",
  ]);

  if (apiUrlInput) {
    apiUrlInput.placeholder = DEFAULT_API_URL;
    apiUrlInput.value = apiUrl && apiUrl.trim() ? apiUrl : "";
  }
  if (apiKeyInput) {
    if (apiKey) apiKeyInput.value = apiKey;
    else if (nightstandApiToken) apiKeyInput.value = nightstandApiToken;
    else apiKeyInput.value = "";
  }
}

async function saveOptions() {
  saveButton.disabled = true;
  setStatus("");

  const apiUrlRaw = apiUrlInput.value.trim().replace(/\/+$/, "");
  const apiUrl = apiUrlRaw || DEFAULT_API_URL;
  const apiKey = apiKeyInput.value.trim();

  const updates = { apiUrl };
  if (apiKey) {
    updates.apiKey = apiKey;
    updates.nightstandApiToken = apiKey;
  }
  await chrome.storage.local.set(updates);
  setStatus("Saved.");
  saveButton.disabled = false;
}

document.addEventListener("DOMContentLoaded", () => {
  restoreOptions();
  saveButton.addEventListener("click", () => {
    void saveOptions();
  });

  // Show redirect URI for Google OAuth (fixes redirect_uri_mismatch after extension reload)
  const redirectUriInput = document.getElementById("redirect-uri");
  const copyRedirectBtn = document.getElementById("copy-redirect-uri");
  if (redirectUriInput && copyRedirectBtn && chrome.identity) {
    const redirectUri = chrome.identity.getRedirectURL("oauth2");
    redirectUriInput.value = redirectUri;
    copyRedirectBtn.addEventListener("click", () => {
      redirectUriInput.select();
      navigator.clipboard.writeText(redirectUri);
      copyRedirectBtn.textContent = "Copied!";
      setTimeout(() => { copyRedirectBtn.textContent = "Copy redirect URI"; }, 2000);
    });
  }
});

