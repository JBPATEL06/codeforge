import { safeStorage, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import type { AIProvider } from '../shared/types'

const META_FILE = () => path.join(app.getPath('userData'), 'key-meta.json')

interface KeyMeta {
  provider: AIProvider
  validated: boolean
}

export class KeyStore {
  private meta: KeyMeta | null = null

  constructor() {
    this.loadMeta()
  }

  private loadMeta() {
    try {
      const p = META_FILE()
      if (fs.existsSync(p)) {
        this.meta = JSON.parse(fs.readFileSync(p, 'utf8'))
      }
    } catch {
      this.meta = null
    }
  }

  private saveMeta() {
    fs.writeFileSync(META_FILE(), JSON.stringify(this.meta || {}), 'utf8')
  }

  isEncryptionAvailable(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  setKey(provider: AIProvider, rawKey: string): void {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('OS secure storage is not available on this system')
    }
    const encrypted = safeStorage.encryptString(rawKey)
    const keyPath = path.join(app.getPath('userData'), 'api-key.bin')
    fs.writeFileSync(keyPath, encrypted)
    this.meta = { provider, validated: false }
    this.saveMeta()
  }

  getKey(): string | null {
    if (!this.meta) return null
    const keyPath = path.join(app.getPath('userData'), 'api-key.bin')
    if (!fs.existsSync(keyPath)) return null
    try {
      const buf = fs.readFileSync(keyPath)
      return safeStorage.decryptString(buf)
    } catch {
      return null
    }
  }

  getProvider(): AIProvider | null {
    return this.meta?.provider ?? null
  }

  markValidated(ok: boolean) {
    if (this.meta) {
      this.meta.validated = ok
      this.saveMeta()
    }
  }

  getStatus() {
    return {
      hasKey: !!this.getKey(),
      provider: this.meta?.provider ?? null,
      validated: this.meta?.validated ?? false
    }
  }

  clear() {
    const keyPath = path.join(app.getPath('userData'), 'api-key.bin')
    if (fs.existsSync(keyPath)) fs.unlinkSync(keyPath)
    this.meta = null
    if (fs.existsSync(META_FILE())) fs.unlinkSync(META_FILE())
  }
}
