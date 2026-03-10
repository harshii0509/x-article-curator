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

  if (apiUrl) apiUrlInput.value = apiUrl;
  if (apiKey) {
    apiKeyInput.value = apiKey;
  } else if (nightstandApiToken) {
    apiKeyInput.value = nightstandApiToken;
  }
}

async function saveOptions() {
  saveButton.disabled = true;
  setStatus("");

  const apiUrl = apiUrlInput.value.trim().replace(/\/+$/, "");
  const apiKey = apiKeyInput.value.trim();

  if (!apiUrl) {
    setStatus("API URL is required.", true);
    saveButton.disabled = false;
    return;
  }

  if (!apiKey) {
    setStatus("Personal API token is required.", true);
    saveButton.disabled = false;
    return;
  }

  await chrome.storage.local.set({
    apiUrl,
    apiKey,
    nightstandApiToken: apiKey,
  });
  setStatus("Saved.");
  saveButton.disabled = false;
}

document.addEventListener("DOMContentLoaded", () => {
  restoreOptions();
  saveButton.addEventListener("click", () => {
    void saveOptions();
  });
});

