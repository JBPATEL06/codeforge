import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { randomUUID } from 'crypto'
import type {
  Chapter,
  Task,
  Submission,
  ProgressData,
  Stack
} from '../../shared/types'

/**
 * Pure-JS local store (JSON files under userData).
 * No native addons — works on Windows without Visual Studio C++ toolset.
 */
interface DbShape {
  chapters: Chapter[]
  tasks: Task[]
  submissions: Submission[]
  progress: ProgressData
}

const defaultDb = (): DbShape => ({
  chapters: [],
  tasks: [],
  submissions: [],
  progress: {
    stacks: {},
    streak: { current: 0, best: 0, lastDate: '' },
    weakTopics: []
  }
})

export class Store {
  private filePath: string
  private data: DbShape

  constructor() {
    const dir = app.getPath('userData')
    fs.mkdirSync(dir, { recursive: true })
    this.filePath = path.join(dir, 'codeforge-data.json')
    this.data = this.load()
  }

  private load(): DbShape {
    try {
      if (fs.existsSync(this.filePath)) {
        return { ...defaultDb(), ...JSON.parse(fs.readFileSync(this.filePath, 'utf8')) }
      }
    } catch {
      /* fall through */
    }
    return defaultDb()
  }

  private save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8')
  }

  saveChapter(c: Chapter) {
    const i = this.data.chapters.findIndex((x) => x.id === c.id)
    if (i >= 0) this.data.chapters[i] = c
    else this.data.chapters.unshift(c)
    this.save()
  }

  getChapters(stack?: Stack): Chapter[] {
    const list = stack
      ? this.data.chapters.filter((c) => c.stack === stack)
      : this.data.chapters
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  saveTask(t: Task) {
    const i = this.data.tasks.findIndex((x) => x.id === t.id)
    if (i >= 0) this.data.tasks[i] = t
    else this.data.tasks.unshift(t)
    this.save()
  }

  getTask(id: string): Task | null {
    return this.data.tasks.find((t) => t.id === id) || null
  }

  saveSubmission(s: Submission) {
    this.data.submissions.unshift(s)
    this.save()
  }

  getHistory(taskId?: string): Submission[] {
    const list = taskId
      ? this.data.submissions.filter((s) => s.taskId === taskId)
      : this.data.submissions
    return list.slice(0, 100)
  }

  getProgress(): ProgressData {
    return { ...this.data.progress, stacks: { ...this.data.progress.stacks } }
  }

  saveProgress(data: ProgressData) {
    this.data.progress = data
    this.save()
  }

  setLearningPath(stack: Stack) {
    this.data.progress.path = stack
    this.save()
  }

  exportAll(): string {
    return JSON.stringify(
      {
        chapters: this.data.chapters,
        submissions: this.data.submissions,
        progress: this.data.progress,
        exportedAt: new Date().toISOString()
      },
      null,
      2
    )
  }

  recordScore(stack: string, score: number, topic?: string) {
    const p = this.data.progress
    if (!p.stacks[stack]) p.stacks[stack] = { completed: 0, totalScore: 0, avgScore: 0 }
    const s = p.stacks[stack]
    s.completed += 1
    s.totalScore += score
    s.avgScore = Math.round(s.totalScore / s.completed)

    const today = new Date().toISOString().slice(0, 10)
    if (p.streak.lastDate !== today) {
      const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      p.streak.current = p.streak.lastDate === y ? p.streak.current + 1 : 1
      p.streak.lastDate = today
      if (p.streak.current > p.streak.best) p.streak.best = p.streak.current
    }
    if (topic && score < 60 && !p.weakTopics.includes(topic)) {
      p.weakTopics.push(topic)
    }
    this.save()
  }
}

export function newId() {
  return randomUUID()
}
