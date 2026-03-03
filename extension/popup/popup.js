const linksContainer = document.getElementById("links");
const errorEl = document.getElementById("error");
const configHint = document.getElementById("config-hint");
const openOptionsLink = document.getElementById("open-options");

function setError(message) {
  errorEl.textContent = message ?? "";
}

function createLinkRow(link, apiUrl, apiKey) {
  const row = document.createElement("div");
  row.className = "link-row";

  const urlEl = document.createElement("div");
  urlEl.className = "url";
  urlEl.textContent = link.url;

  const tweetEl = document.createElement("div");
  tweetEl.className = "tweet-url";
  tweetEl.textContent = link.tweetUrl ?? "";

  const footer = document.createElement("div");
  footer.className = "row-footer";

  const button = document.createElement("button");
  button.className = "btn-primary";
  button.textContent = "Save";

  const status = document.createElement("span");
  status.className = "status";

  button.addEventListener("click", async () => {
    if (!apiUrl || !apiKey) {
      setError("Missing API configuration.");
      return;
    }

    button.disabled = true;
    status.textContent = "Saving…";
    status.className = "status";

    try {
      const res = await fetch(`${apiUrl}/api/articles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url: link.url,
          tweetUrl: link.tweetUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        status.textContent = data?.error ?? `Error (${res.status})`;
        status.className = "status status-error";
        button.disabled = false;
        return;
      }

      if (data.status === "duplicate") {
        status.textContent = "Already saved";
        status.className = "status status-duplicate";
        button.disabled = true;
      } else {
        status.textContent = "Saved";
        status.className = "status status-ok";
        button.disabled = true;
      }
    } catch (error) {
      console.error(error);
      status.textContent = "Network error";
      status.className = "status status-error";
      button.disabled = false;
    }
  });

  footer.appendChild(button);
  footer.appendChild(status);

  row.appendChild(urlEl);
  row.appendChild(tweetEl);
  row.appendChild(footer);

  return row;
}

async function loadLinks() {
  setError("");
  linksContainer.innerHTML = "";

  const { apiUrl, apiKey } = await chrome.storage.sync.get([
    "apiUrl",
    "apiKey",
  ]);

  if (!apiUrl || !apiKey) {
    configHint.hidden = false;
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "API not configured.";
    linksContainer.appendChild(empty);
    return;
  }

  configHint.hidden = true;

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab || !tab.id) {
    setError("No active tab.");
    return;
  }

  chrome.tabs.sendMessage(
    tab.id,
    { type: "COLLECT_LINKS" },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        setError("Content script not available on this page.");
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "Open a tweet or timeline on X.";
        linksContainer.appendChild(empty);
        return;
      }

      const links = response?.links ?? [];

      if (!links.length) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "No article links detected on this page.";
        linksContainer.appendChild(empty);
        return;
      }

      for (const link of links) {
        const row = createLinkRow(link, apiUrl, apiKey);
        linksContainer.appendChild(row);
      }
    },
  );
}

document.addEventListener("DOMContentLoaded", () => {
  if (openOptionsLink) {
    openOptionsLink.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
  }

  void loadLinks();
});

