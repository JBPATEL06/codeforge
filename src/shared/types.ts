export type AIProvider = 'openai' | 'anthropic' | 'groq' | 'gemini' | 'xai'
export type Stack = 'html-css-js' | 'bootstrap-jquery' | 'react' | 'angular'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface Chapter {
  id: string
  stack: Stack
  topic: string
  title: string
  markdown: string
  createdAt: string
}

export interface StarterFile {
  path: string
  content: string
}

export interface Task {
  id: string
  chapterId: string
  title: string
  description: string
  requirements: string[]
  difficulty: Difficulty
  mode: 'single-file' | 'multi-file' | 'react' | 'angular'
  starterFiles: StarterFile[]
  hiddenTestCases: string[]
  hints: string[]
  createdAt: string
}

export interface ObjectiveTestResult {
  name: string
  passed: boolean
  message?: string
}

export interface AntiCheatFlags {
  tabSwitches: number
  copyAttempts: number
  pasteAttempts: number
  devtoolsAttempts: number
  flagged: boolean
}

export interface ValidationResult {
  score: number
  pass: boolean
  strengths: string[]
  issues: string[]
  hints: string[]
  requirementResults?: { requirement: string; pass: boolean }[]
  objectiveResults?: ObjectiveTestResult[]
  antiCheat?: AntiCheatFlags
}

export interface Submission {
  id: string
  taskId: string
  code: Record<string, string>
  result: ValidationResult
  antiCheat: AntiCheatFlags
  createdAt: string
}

export interface ProgressData {
  stacks: Record<
    string,
    { completed: number; totalScore: number; avgScore: number }
  >
  streak: { current: number; best: number; lastDate: string }
  weakTopics: string[]
  path?: Stack
}

export interface KeyStatus {
  hasKey: boolean
  provider: AIProvider | null
  validated: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatReply {
  reply: string
  suggestedTopic?: string
  suggestedStack?: Stack
  canGenerateChapter?: boolean
}

/** API exposed to renderer via contextBridge */
export interface CodeForgeAPI {
  ai: {
    chat: (messages: ChatMessage[], stack?: Stack) => Promise<ChatReply>
    generateChapter: (topic: string, stack: Stack) => Promise<Chapter>
    generateTask: (chapterId: string, difficulty: Difficulty) => Promise<Task>
    validateSubmission: (
      taskId: string,
      code: Record<string, string>,
      objectiveTestResults: ObjectiveTestResult[],
      antiCheat: AntiCheatFlags
    ) => Promise<ValidationResult>
  }
  key: {
    setKey: (provider: AIProvider, key: string) => Promise<{ ok: boolean; error?: string }>
    getKeyStatus: () => Promise<KeyStatus>
    clearKey: () => Promise<void>
  }
  anticheat: {
    event: (type: string, meta?: Record<string, unknown>) => Promise<void>
    setTaskMode: (active: boolean) => Promise<void>
  }
  db: {
    saveChapter: (chapter: Chapter) => Promise<void>
    getChapters: (stack?: Stack) => Promise<Chapter[]>
    saveTask: (task: Task) => Promise<void>
    getTask: (id: string) => Promise<Task | null>
    saveSubmission: (sub: Submission) => Promise<void>
    getHistory: (taskId?: string) => Promise<Submission[]>
    getProgress: () => Promise<ProgressData>
    saveProgress: (data: ProgressData) => Promise<void>
    setLearningPath: (stack: Stack) => Promise<void>
    exportData: () => Promise<string>
  }
  app: {
    getVersion: () => Promise<string>
  }
}

declare global {
  interface Window {
    codeforge: CodeForgeAPI
  }
}
