import { contextBridge, ipcRenderer } from 'electron'
import type { CodeForgeAPI, AIProvider, Stack, Difficulty, AntiCheatFlags, ObjectiveTestResult } from '../shared/types'

const api: CodeForgeAPI = {
  ai: {
    generateChapter: (topic, stack) => ipcRenderer.invoke('ai:generateChapter', topic, stack),
    generateTask: (chapterId, difficulty) =>
      ipcRenderer.invoke('ai:generateTask', chapterId, difficulty),
    validateSubmission: (taskId, code, objectiveTestResults, antiCheat) =>
      ipcRenderer.invoke(
        'ai:validateSubmission',
        taskId,
        code,
        objectiveTestResults,
        antiCheat
      )
  },
  key: {
    setKey: (provider: AIProvider, key: string) =>
      ipcRenderer.invoke('key:setKey', provider, key),
    getKeyStatus: () => ipcRenderer.invoke('key:getKeyStatus'),
    clearKey: () => ipcRenderer.invoke('key:clearKey')
  },
  anticheat: {
    event: (type, meta) => ipcRenderer.invoke('anticheat:event', type, meta),
    setTaskMode: (active) => ipcRenderer.invoke('anticheat:setTaskMode', active)
  },
  db: {
    saveChapter: (c) => ipcRenderer.invoke('db:saveChapter', c),
    getChapters: (stack?) => ipcRenderer.invoke('db:getChapters', stack),
    saveTask: (t) => ipcRenderer.invoke('db:saveTask', t),
    getTask: (id) => ipcRenderer.invoke('db:getTask', id),
    saveSubmission: (s) => ipcRenderer.invoke('db:saveSubmission', s),
    getHistory: (taskId?) => ipcRenderer.invoke('db:getHistory', taskId),
    getProgress: () => ipcRenderer.invoke('db:getProgress'),
    saveProgress: (d) => ipcRenderer.invoke('db:saveProgress', d),
    setLearningPath: (stack: Stack) => ipcRenderer.invoke('db:setLearningPath', stack),
    exportData: () => ipcRenderer.invoke('db:exportData')
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion')
  }
}

contextBridge.exposeInMainWorld('codeforge', api)

contextBridge.exposeInMainWorld('codeforgeEvents', {
  onAntiCheatUpdate: (cb: (flags: AntiCheatFlags) => void) => {
    const listener = (_: unknown, flags: AntiCheatFlags) => cb(flags)
    ipcRenderer.on('anticheat:update', listener)
    return () => ipcRenderer.removeListener('anticheat:update', listener)
  },
  onTaskMode: (cb: (active: boolean) => void) => {
    const listener = (_: unknown, active: boolean) => cb(active)
    ipcRenderer.on('anticheat:taskMode', listener)
    return () => ipcRenderer.removeListener('anticheat:taskMode', listener)
  }
})
