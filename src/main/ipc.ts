import { ipcMain, BrowserWindow } from 'electron'
import { randomUUID } from 'crypto'
import type { KeyStore } from './keystore'
import type { AIProviderService } from './ai/provider'
import type { MentorService } from './ai/mentor'
import type { Store } from './db/store'
import type { AntiCheatController } from './anticheat'
import { runObjectiveTests } from './objective'
import type {
  AIProvider,
  Stack,
  Difficulty,
  AntiCheatFlags,
  Submission
} from '../shared/types'

export function registerIpc(deps: {
  keyStore: KeyStore
  ai: AIProviderService
  mentor: MentorService
  store: Store
  anticheat: AntiCheatController
  getWindow: () => BrowserWindow | null
}) {
  const { keyStore, ai, mentor, store, anticheat } = deps

  ipcMain.handle('key:setKey', async (_e, provider: AIProvider, key: string) => {
    try {
      keyStore.setKey(provider, key)
      const ok = await ai.validate()
      keyStore.markValidated(ok)
      return ok ? { ok: true } : { ok: false, error: 'Key saved but validation failed' }
    } catch (err: any) {
      return { ok: false, error: err.message || String(err) }
    }
  })

  ipcMain.handle('key:getKeyStatus', async () => keyStore.getStatus())
  ipcMain.handle('key:clearKey', async () => {
    keyStore.clear()
  })

  ipcMain.handle(
    'ai:chat',
    async (
      _e,
      messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
      stack?: Stack
    ) => {
      return mentor.chat(messages, stack)
    }
  )

  ipcMain.handle('ai:generateChapter', async (_e, topic: string, stack: Stack) => {
    return mentor.generateChapter(topic, stack)
  })

  ipcMain.handle(
    'ai:generateTask',
    async (_e, chapterId: string, difficulty: Difficulty) => {
      return mentor.generateTask(chapterId, difficulty)
    }
  )

  ipcMain.handle(
    'ai:validateSubmission',
    async (
      _e,
      taskId: string,
      code: Record<string, string>,
      objectiveFromRenderer: unknown,
      antiCheatFromRenderer: AntiCheatFlags
    ) => {
      const task = store.getTask(taskId)
      if (!task) throw new Error('Task not found')
      const objective = runObjectiveTests(task, code)
      const flags = { ...anticheat.getFlags(), ...antiCheatFromRenderer }
      const result = await mentor.validate(taskId, code, objective, flags)

      const sub: Submission = {
        id: randomUUID(),
        taskId,
        code,
        result,
        antiCheat: flags,
        createdAt: new Date().toISOString()
      }
      store.saveSubmission(sub)
      anticheat.setTaskMode(false)
      return result
    }
  )

  ipcMain.handle('anticheat:event', async (_e, type: string) => {
    anticheat.recordRendererEvent(type)
  })

  ipcMain.handle('anticheat:setTaskMode', async (_e, active: boolean) => {
    anticheat.setTaskMode(active)
  })

  ipcMain.handle('db:saveChapter', async (_e, chapter) => store.saveChapter(chapter))
  ipcMain.handle('db:getChapters', async (_e, stack?: Stack) => store.getChapters(stack))
  ipcMain.handle('db:saveTask', async (_e, task) => store.saveTask(task))
  ipcMain.handle('db:getTask', async (_e, id: string) => store.getTask(id))
  ipcMain.handle('db:saveSubmission', async (_e, sub) => store.saveSubmission(sub))
  ipcMain.handle('db:getHistory', async (_e, taskId?: string) => store.getHistory(taskId))
  ipcMain.handle('db:getProgress', async () => store.getProgress())
  ipcMain.handle('db:saveProgress', async (_e, data) => store.saveProgress(data))
  ipcMain.handle('db:setLearningPath', async (_e, stack: Stack) => store.setLearningPath(stack))
  ipcMain.handle('db:exportData', async () => store.exportAll())

  ipcMain.handle('app:getVersion', async () => '1.0.0')
}
