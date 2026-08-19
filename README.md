# CodeForge

**AI-mentored web development learning platform** — Windows desktop app (Electron).

BYOK: your OpenAI / Claude / Groq / Gemini / Grok key stays in OS `safeStorage` and is only used for direct provider calls from the main process.

## Phase status

| Phase | Scope | Status |
|-------|--------|--------|
| **0** | Electron + React + TS, main/preload/renderer, BYOK, IPC | ✅ |
| **1** | Chapter → HTML/CSS/JS task → Monaco → preview → dual validation → progress | ✅ |
| **2** | Full anti-cheat (focus, clipboard, DevTools, shortcuts) | ✅ wired |
| **3–6** | Bootstrap/jQuery, React/Angular pipelines, polish, installer | Scaffolded / next |

## Stack

- Electron + TypeScript
- React 18 + Bootstrap 5
- Monaco Editor
- JSON file store (no native build)
- openai + @anthropic-ai/sdk (+ Groq/Gemini/xAI via adapters)
- electron-vite + electron-builder

## Security model

- `contextIsolation: true`, `nodeIntegration: false`
- Preload exposes **only** `window.codeforge` whitelist
- API key never sent to renderer in plaintext
- User preview runs in sandboxed `iframe` (`sandbox="allow-scripts"`)
- Anti-cheat is **detection + deterrence**, not OS-level prevention (documented in UI)

## Requirements

- **Node.js 20+** (Node **24 is fine** for this project).
- No Visual Studio C++ workload required — storage is pure JSON (no `better-sqlite3`).

## Run (development)

```bash
cd codeforge-app
npm install
npm run dev
```

## Package Windows installer

```bash
npm run package
```

Output under `release/`.

## Core loop

1. Onboarding → provider + key (validated) + learning path  
2. **Learn** → generate Markdown chapter  
3. **Start task** → Monaco + live preview, Task Mode anti-cheat on  
4. **Submit** → objective checks + AI review → score / flags / hints  
5. Retry or next chapter; progress in SQLite  

## IPC (main)

`ai:*` · `key:*` · `anticheat:*` · `db:*` · `app:getVersion`
