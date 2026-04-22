# MeetScribe — AI Meeting Minutes

A Chrome extension that records your microphone (and optionally browser/Zoom tab audio), transcribes it in real time, and generates a professional **Minutes of Meeting** document using the Gemini AI API.

---

## Features

- Live microphone transcription via Chrome's Web Speech API
- Optional browser/tab audio capture (YouTube, Zoom, Google Meet, Teams, etc.)
- AI-generated Minutes of Meeting in structured Markdown format
- Download the MoM as a `.md` file
- Powered by **Gemini 2.5 Flash** — fast and free-tier friendly

---

## Requirements

- **Google Chrome** (version 116 or later)
- A free **Gemini API key** from [aistudio.google.com](https://aistudio.google.com/app/apikey)

---

## Installation

The extension is not on the Chrome Web Store. Install it manually as an unpacked extension:

1. Download or clone this repository:
   ```
   git clone https://github.com/Hassan1028/meetscribe.git
   ```

2. Open Chrome and go to:
   ```
   chrome://extensions
   ```

3. Enable **Developer mode** (toggle in the top-right corner).

4. Click **Load unpacked** and select the `meetscribe` folder.

5. The MeetScribe icon will appear in your Chrome toolbar.

---

## Setup

1. Click the MeetScribe icon in the Chrome toolbar to open the app.
2. Go to the **Settings** section in the sidebar.
3. Paste your **Gemini API key** into the field.
   - Get a free key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
4. Select your preferred **Recognition Language**.

---

## How to Use

### Recording mic only

1. Click **Start Recording**.
2. Allow microphone access when Chrome prompts.
3. Speak — your transcript appears live in the Transcript panel.
4. Click **Stop Recording** when done.
5. Click **Generate Minutes** to produce the MoM.
6. Click **Download .md** to save the file.

### Recording mic + browser/Zoom audio

Use this when you are in a Zoom call, watching a meeting recording on YouTube, or any other tab playing audio.

1. In the sidebar, tick **Capture tab audio**.
2. Click **Start Recording**.
3. Chrome's share dialog will open — select the tab you want to capture.
4. In the dialog, make sure to tick **Share tab audio** (checkbox at the bottom of the tab preview).
5. Click **Share**.
6. Both your mic and the tab audio will be recorded simultaneously.
7. Stop, generate, and download as above.

---

## Project Structure

```
meetscribe/
├── manifest.json       # Chrome extension manifest (MV3)
├── background.js       # Service worker — opens app, draws toolbar icon
├── app.html            # Main UI page (opened as a tab)
├── app.js              # UI controller — orchestrates the full flow
├── audio.js            # Audio capture (mic via getUserMedia, tab via getDisplayMedia)
├── speech.js           # Real-time transcription via Web Speech API
├── gemini.js           # Gemini API calls (tab audio transcription + MoM generation)
├── utils.js            # Shared helpers (storage, download, formatting)
└── icons/
    └── generate.html   # Open in Chrome to generate and download PNG icon files
```

---

## Permissions Used

| Permission | Reason |
|---|---|
| `activeTab` | Required by `tabCapture` API |
| `tabCapture` | Kept for potential future use |
| `tabs` | List open tabs |
| `storage` | Save API key and language preference |
| `downloads` | Download the generated `.md` file |
| `scripting` | Extension scripting support |

---

## Troubleshooting

**No speech detected after stopping**
- Make sure your microphone is set as the default input device in Windows Sound Settings.
- Check that Chrome has microphone permission: `chrome://settings/content/microphone`
- Try speaking louder or closer to the mic.

**Tab audio capture fails / Chrome share dialog doesn't show audio**
- In the Chrome share dialog, click the tab you want to share, then tick the **Share tab audio** checkbox that appears below the tab preview.
- The target tab must be actively playing audio at the time of capture.

**Gemini API error**
- Double-check your API key in Settings.
- Make sure the key is from [aistudio.google.com](https://aistudio.google.com/app/apikey) and is active.
- If you hit rate limits, wait 60 seconds and try again.

**Extension icon not showing in toolbar**
- Click the puzzle piece icon in the Chrome toolbar and pin MeetScribe.

---

## License

MIT
