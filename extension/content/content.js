function isExternalUrl(href) {
  try {
    const url = new URL(href, window.location.href);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "x.com" || host === "twitter.com") {
      return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getTweetUrlForElement(element) {
  const tweetRoot =
    element.closest('article[data-testid="tweet"]') ??
    element.closest("article") ??
    element.closest('[data-testid="tweet"]');

  if (!tweetRoot) {
    return window.location.href;
  }

  const statusLink = tweetRoot.querySelector('a[href*="/status/"]');
  if (statusLink && statusLink.href) {
    return statusLink.href;
  }

  return window.location.href;
}

function collectLinksFromPage() {
  const anchors = Array.from(
    document.querySelectorAll(
      '[data-testid="card.wrapper"] a[href], [data-testid="tweetText"] a[href]',
    ),
  );

  const byUrl = new Map();

  for (const anchor of anchors) {
    const href = anchor.getAttribute("href");
    if (!href || !isExternalUrl(href)) continue;

    const absolute = new URL(href, window.location.href).href;
    const tweetUrl = getTweetUrlForElement(anchor);

    if (!byUrl.has(absolute)) {
      byUrl.set(absolute, { url: absolute, tweetUrl });
    }
  }

  return Array.from(byUrl.values());
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === "COLLECT_LINKS") {
    const links = collectLinksFromPage();
    sendResponse({ links });
    return true;
  }

  return undefined;
});

