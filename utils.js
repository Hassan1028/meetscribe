// utils.js — Shared utility functions

/**
 * Format a Date object to a human-readable string.
 * e.g. "2025-01-15 at 14:32"
 */
export function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${y}-${mo}-${d} at ${h}:${mi}`;
}

/**
 * Format elapsed seconds to MM:SS string.
 */
export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Download a string as a file using chrome.downloads API.
 * @param {string} content - File content
 * @param {string} filename - e.g. "minute_of_meeting.md"
 * @param {string} mimeType - e.g. "text/markdown"
 */
export function downloadFile(content, filename = "minute_of_meeting.md", mimeType = "text/markdown") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download(
    {
      url,
      filename,
      saveAs: false,
    },
    (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("[MeetScribe] Download failed:", chrome.runtime.lastError.message);
      } else {
        console.log("[MeetScribe] Download started, ID:", downloadId);
      }
      // Revoke object URL after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  );
}

/**
 * Save a value to chrome.storage.local.
 */
export async function storageSet(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

/**
 * Retrieve a value from chrome.storage.local.
 */
export async function storageGet(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => resolve(result[key]));
  });
}

/**
 * Sanitize transcript text — remove excessive whitespace/newlines.
 */
export function cleanTranscript(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\[MIC\]\s*\[TAB\]/g, "")
    .trim();
}
