import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, Navigate } from 'react-router-dom'
import type { KeyStatus } from '../shared/types'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Learn from './pages/Learn'
import TaskWorkspace from './pages/TaskWorkspace'
import Settings from './pages/Settings'
import Results from './pages/Results'

export default function App() {
  const [status, setStatus] = useState<KeyStatus | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    window.codeforge.key.getKeyStatus().then((s) => {
      setStatus(s)
      setReady(true)
    })
  }, [])

  if (!ready) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p className="muted">Loading CodeForge…</p>
      </div>
    )
  }

  if (!status?.hasKey || !status.validated) {
    return <Onboarding onDone={() => window.codeforge.key.getKeyStatus().then(setStatus)} />
  }

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <div className="brand">
          Code<span>Forge</span>
        </div>
        <NavLink to="/" end>
          Dashboard
        </NavLink>
        <NavLink to="/learn">Learn</NavLink>
        <NavLink to="/settings">Settings</NavLink>
        <div style={{ marginLeft: 'auto' }} className="muted">
          {status.provider}
        </div>
      </nav>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/task/:taskId" element={<TaskWorkspace />} />
          <Route path="/results/:taskId" element={<Results />} />
          <Route path="/settings" element={<Settings onKeyChange={() => window.codeforge.key.getKeyStatus().then(setStatus)} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
