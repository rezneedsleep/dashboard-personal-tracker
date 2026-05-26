import { useState, useEffect } from 'react'
import Expenses from './components/Expenses'
import Habits from './components/Habits'
import Weight from './components/Weight'
import './App.css'

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className="dashboard">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-logo">
          <img src="/favicon.ico" alt="Dashboard Logo" className="logo-img" />
        </div>
        <div className="nav-links">
          <button 
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-link ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            Expenses
          </button>
          <button 
            className={`nav-link ${activeTab === 'habits' ? 'active' : ''}`}
            onClick={() => setActiveTab('habits')}
          >
            Habits
          </button>
          <button 
            className={`nav-link ${activeTab === 'weight' ? 'active' : ''}`}
            onClick={() => setActiveTab('weight')}
          >
            Weight
          </button>
          <button 
            className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
      </nav>

      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          {activeTab === 'dashboard' ? 'Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h1>
        <div className="dashboard-time">
          <span className="time-value">{formatTime(currentTime)}</span>
          <span className="time-label">Time</span>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className={`dashboard-grid ${activeTab !== 'dashboard' ? 'focused-view' : ''}`}>
        {(activeTab === 'dashboard' || activeTab === 'expenses') && <Expenses />}
        {(activeTab === 'dashboard' || activeTab === 'habits') && <Habits />}
        {(activeTab === 'dashboard' || activeTab === 'weight') && <Weight />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  )
}

function SettingsPanel() {
  const [height, setHeight] = useState(() => {
    return localStorage.getItem('personal-tracker-height') || '170'
  })

  const handleSaveHeight = (val) => {
    setHeight(val)
    localStorage.setItem('personal-tracker-height', val)
  }

  return (
    <div className="card card-light settings-card" style={{ gridColumn: 'span 12', animationDelay: '0.1s' }}>
      <div className="card-header">
        <div>
          <h3 className="card-title-sm">System Settings</h3>
          <p className="card-subtitle">Configure your Personal Tracker application</p>
        </div>
      </div>
      
      <div className="settings-content" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Height Setting (BMI Configuration) */}
        <div style={{ padding: '20px', background: 'var(--bg-light-card-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 600 }}>Height (BMI Configuration)</h4>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Enter your height to automatically calculate BMI in the Weight Tracker.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="number"
              value={height}
              onChange={e => handleSaveHeight(e.target.value)}
              placeholder="Height (cm)"
              style={{
                padding: '8px 12px',
                background: '#fff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                width: '120px',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>cm</span>
          </div>
        </div>

        <div style={{ padding: '20px', background: 'var(--bg-light-card-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 600 }}>Theme Configuration</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Active Style: <strong>Monochrome (Black, White, Gray) Premium</strong>
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Designed with sleek, modern high-contrast grayscale accents and dynamic spring micro-animations.
          </p>
        </div>



        <div style={{ padding: '20px', background: 'var(--bg-light-card-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 600 }}>Application Metadata</h4>
          <table style={{ width: '100%', fontSize: '0.85rem', color: 'var(--text-secondary)', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', height: '36px' }}>
                <td style={{ padding: '8px 0', fontWeight: 500 }}>Version</td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>1.2.0 (Monochrome Edition)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', height: '36px' }}>
                <td style={{ padding: '8px 0', fontWeight: 500 }}>React Version</td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>19.2.6</td>
              </tr>
              <tr style={{ height: '36px' }}>
                <td style={{ padding: '8px 0', fontWeight: 500 }}>Vite Version</td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>8.0.12</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}