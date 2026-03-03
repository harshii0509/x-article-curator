const pageUrlEl = document.getElementById("page-url");
const saveBtn = document.getElementById("save-btn");
const statusEl = document.getElementById("status");
const configHint = document.getElementById("config-hint");
const openOptionsLink = document.getElementById("open-options");

let currentUrl = null;
let apiUrl = null;
let apiKey = null;

function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className = `status ${cls ?? ""}`;
}

async function init() {
  const config = await chrome.storage.sync.get(["apiUrl", "apiKey"]);
  apiUrl = config.apiUrl;
  apiKey = config.apiKey;

  if (!apiUrl || !apiKey) {
    configHint.hidden = false;
    pageUrlEl.textContent = "Configure the API first.";
    return;
  }

  configHint.hidden = true;

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
  saveBtn.disabled = false;
}

async function saveArticle() {
  if (!currentUrl || !apiUrl || !apiKey) return;

  saveBtn.disabled = true;
  setStatus("Saving…", "");

  try {
    const res = await fetch(`${apiUrl}/api/articles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
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
  if (openOptionsLink) {
    openOptionsLink.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
  }

  saveBtn.addEventListener("click", () => {
    void saveArticle();
  });

  void init();
});
