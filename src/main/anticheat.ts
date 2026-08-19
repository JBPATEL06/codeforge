import { BrowserWindow, WebContents } from 'electron'
import type { AntiCheatFlags } from '../shared/types'

export class AntiCheatController {
  private taskMode = false
  private flags: AntiCheatFlags = this.empty()
  private win: BrowserWindow | null = null

  private empty(): AntiCheatFlags {
    return {
      tabSwitches: 0,
      copyAttempts: 0,
      pasteAttempts: 0,
      devtoolsAttempts: 0,
      flagged: false
    }
  }

  attach(win: BrowserWindow) {
    this.win = win
    const wc = win.webContents

    win.on('blur', () => {
      if (!this.taskMode) return
      this.flags.tabSwitches += 1
      if (this.flags.tabSwitches >= 2) this.flags.flagged = true
      wc.send('anticheat:update', { ...this.flags })
    })

    wc.on('devtools-opened', () => {
      if (!this.taskMode) return
      this.flags.devtoolsAttempts += 1
      this.flags.flagged = true
      wc.closeDevTools()
      wc.send('anticheat:update', { ...this.flags })
    })

    wc.on('before-input-event', (event, input) => {
      if (!this.taskMode) return
      const ctrl = input.control || input.meta
      if (!ctrl) return
      const key = input.key.toLowerCase()
      if (key === 'c' || key === 'x') {
        this.flags.copyAttempts += 1
        event.preventDefault()
        wc.send('anticheat:update', { ...this.flags })
      } else if (key === 'v') {
        this.flags.pasteAttempts += 1
        event.preventDefault()
        wc.send('anticheat:update', { ...this.flags })
      } else if (key === 'i' && input.shift) {
        this.flags.devtoolsAttempts += 1
        this.flags.flagged = true
        event.preventDefault()
        wc.send('anticheat:update', { ...this.flags })
      }
    })

    wc.on('context-menu', (e) => {
      if (this.taskMode) e.preventDefault()
    })
  }

  setTaskMode(active: boolean) {
    this.taskMode = active
    if (active) {
      this.flags = this.empty()
    }
    if (this.win && !this.win.isDestroyed()) {
      this.win.webContents.send('anticheat:taskMode', active)
      if (active) this.win.webContents.send('anticheat:update', { ...this.flags })
    }
  }

  recordRendererEvent(type: string) {
    if (!this.taskMode) return
    if (type === 'copy') this.flags.copyAttempts += 1
    if (type === 'paste') this.flags.pasteAttempts += 1
    if (type === 'cut') this.flags.copyAttempts += 1
    if (type === 'blur') {
      this.flags.tabSwitches += 1
      if (this.flags.tabSwitches >= 2) this.flags.flagged = true
    }
    if (this.win && !this.win.isDestroyed()) {
      this.win.webContents.send('anticheat:update', { ...this.flags })
    }
  }

  getFlags(): AntiCheatFlags {
    return { ...this.flags }
  }

  isTaskMode() {
    return this.taskMode
  }
}
