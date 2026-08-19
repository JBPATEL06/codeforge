/// <reference types="vite/client" />

import type { CodeForgeAPI, AntiCheatFlags } from '../shared/types'

declare global {
  interface Window {
    codeforge: CodeForgeAPI
    codeforgeEvents: {
      onAntiCheatUpdate: (cb: (flags: AntiCheatFlags) => void) => () => void
      onTaskMode: (cb: (active: boolean) => void) => () => void
    }
  }
}

export {}
