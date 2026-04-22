// background.js — MV3 Service Worker

const APP_URL = chrome.runtime.getURL("app.html");

// ── Draw the MeetScribe icon onto an OffscreenCanvas and return ImageData ──
function drawIcon(size) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const s = size / 128;

  // Rounded background
  const bg = 22 * s;
  ctx.fillStyle = "#111318";
  ctx.beginPath();
  ctx.moveTo(bg, 0);
  ctx.lineTo(size - bg, 0);
  ctx.quadraticCurveTo(size, 0, size, bg);
  ctx.lineTo(size, size - bg);
  ctx.quadraticCurveTo(size, size, size - bg, size);
  ctx.lineTo(bg, size);
  ctx.quadraticCurveTo(0, size, 0, size - bg);
  ctx.lineTo(0, bg);
  ctx.quadraticCurveTo(0, 0, bg, 0);
  ctx.closePath();
  ctx.fill();

  // Green mic icon
  const cx = size / 2;
  ctx.strokeStyle = "#00e5a0";
  ctx.lineWidth = Math.max(1, 8 * s);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Mic body (capsule)
  const mw = 20 * s, mt = 22 * s, mb = 70 * s, mr = 20 * s;
  ctx.beginPath();
  ctx.moveTo(cx - mw, mt + mr);
  ctx.quadraticCurveTo(cx - mw, mt, cx, mt);
  ctx.quadraticCurveTo(cx + mw, mt, cx + mw, mt + mr);
  ctx.lineTo(cx + mw, mb - mr);
  ctx.quadraticCurveTo(cx + mw, mb, cx, mb);
  ctx.quadraticCurveTo(cx - mw, mb, cx - mw, mb - mr);
  ctx.closePath();
  ctx.stroke();

  // Stand arc (bottom semicircle beneath mic)
  ctx.beginPath();
  ctx.arc(cx, mb, 28 * s, 0, Math.PI, false);
  ctx.stroke();

  // Stem
  ctx.beginPath();
  ctx.moveTo(cx, mb + 28 * s);
  ctx.lineTo(cx, 106 * s);
  ctx.stroke();

  // Base
  ctx.beginPath();
  ctx.moveTo(cx - 22 * s, 106 * s);
  ctx.lineTo(cx + 22 * s, 106 * s);
  ctx.stroke();

  return ctx.getImageData(0, 0, size, size);
}

function setActionIcon() {
  chrome.action.setIcon({
    imageData: {
      16:  drawIcon(16),
      32:  drawIcon(32),
      48:  drawIcon(48),
      128: drawIcon(128),
    },
  });
}

chrome.runtime.onInstalled.addListener(setActionIcon);
chrome.runtime.onStartup.addListener(setActionIcon);

chrome.action.onClicked.addListener(async () => {
  const tabs = await chrome.tabs.query({ url: APP_URL });
  if (tabs.length > 0) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    await chrome.windows.update(tabs[0].windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url: APP_URL });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Return list of capturable tabs (excluding extension pages)
  if (msg.type === "GET_TABS") {
    chrome.tabs.query({}, (tabs) => {
      const appTabId = sender.tab?.id;
      const result = tabs
        .filter(t =>
          t.id !== appTabId &&
          t.url &&
          !t.url.startsWith("chrome://") &&
          !t.url.startsWith("chrome-extension://") &&
          !t.url.startsWith("about:")
        )
        .map(t => ({ id: t.id, title: t.title || t.url, url: t.url }));
      sendResponse(result);
    });
    return true;
  }

  // Get a tabCapture stream ID for the given tab so the app page can call getUserMedia.
  // consumerTabId is required — it tells Chrome which tab will call getUserMedia with this ID.
  if (msg.type === "GET_TAB_STREAM_ID") {
    chrome.tabCapture.getMediaStreamId(
      { targetTabId: msg.tabId, consumerTabId: sender.tab?.id },
      (streamId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ streamId });
        }
      }
    );
    return true;
  }
});
