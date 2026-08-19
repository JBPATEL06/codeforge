import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { KeyStore } from './keystore'
import { AIProviderService } from './ai/provider'
import { MentorService } from './ai/mentor'
import { Store } from './db/store'
import { AntiCheatController } from './anticheat'
import { registerIpc } from './ipc'

let mainWindow: BrowserWindow | null = null
const anticheat = new AntiCheatController()
let keyStore: KeyStore
let store: Store

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: 'CodeForge',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  anticheat.attach(mainWindow)

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  keyStore = new KeyStore()
  store = new Store()
  const ai = new AIProviderService(
    () => keyStore.getKey(),
    () => keyStore.getProvider()
  )
  const mentor = new MentorService(ai, store)

  registerIpc({
    keyStore,
    ai,
    mentor,
    store,
    anticheat,
    getWindow: () => mainWindow
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
