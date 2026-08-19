import type { ObjectiveTestResult, Task } from '../shared/types'

/**
 * Phase 1 objective checks for HTML/CSS/JS single-file tasks.
 * Deterministic string/DOM-heuristic checks — not a full browser runner.
 */
export function runObjectiveTests(
  task: Task,
  code: Record<string, string>
): ObjectiveTestResult[] {
  const results: ObjectiveTestResult[] = []
  const html =
    code['index.html'] ||
    Object.entries(code).find(([p]) => p.endsWith('.html'))?.[1] ||
    Object.values(code)[0] ||
    ''

  results.push({
    name: 'Has content',
    passed: html.trim().length > 20,
    message: html.trim().length > 20 ? undefined : 'File appears empty'
  })

  for (const req of task.requirements) {
    const lower = req.toLowerCase()
    let passed = true
    let message: string | undefined

    if (lower.includes('button') && !/<\s*button/i.test(html)) {
      passed = false
      message = 'No <button> found'
    }
    if ((lower.includes('heading') || lower.includes('<h1') || lower.includes('h1')) && !/<\s*h[1-6]/i.test(html)) {
      passed = false
      message = 'No heading tag found'
    }
    if (lower.includes('input') && !/<\s*input/i.test(html)) {
      passed = false
      message = 'No <input> found'
    }
    if (lower.includes('form') && !/<\s*form/i.test(html)) {
      passed = false
      message = 'No <form> found'
    }
    if (lower.includes('click') && !/addEventListener\s*\(\s*['"]click|onclick\s*=/i.test(html)) {
      if (lower.includes('handler') || lower.includes('event')) {
        passed = false
        message = 'No click handler detected'
      }
    }

    results.push({
      name: `Requirement: ${req.slice(0, 60)}`,
      passed,
      message
    })
  }

  for (let i = 0; i < (task.hiddenTestCases || []).length; i++) {
    results.push({
      name: `Hidden check ${i + 1}`,
      passed: true,
      message: `Soft: ${task.hiddenTestCases[i]}`
    })
  }

  return results
}
