import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler
} from 'chart.js'
import dayjs from 'dayjs'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const DEFAULT_TIPS = [
  { id: 1, text: 'Start tracking your weight to get personalized insights.', label: 'Getting started' },
  { id: 2, text: 'Log your weight regularly for accurate trend analysis.', label: 'Tip' },
]

const TIPS_STORAGE_KEY = 'personal-tracker-custom-tips'

const loadTips = () => {
  try {
    const stored = localStorage.getItem(TIPS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return DEFAULT_TIPS
}

const saveTips = (tips) => {
  localStorage.setItem(TIPS_STORAGE_KEY, JSON.stringify(tips))
}

export default function Weight() {
  const [entries, setEntries] = useState([])
  const [kg, setKg] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [showForm, setShowForm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Tips state
  const [tips, setTips] = useState(loadTips)
  const [manageTips, setManageTips] = useState(false)
  const [editingTipId, setEditingTipId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editLabel, setEditLabel] = useState('')
  const [newTipText, setNewTipText] = useState('')
  const [newTipLabel, setNewTipLabel] = useState('')

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('weight')
      .select('*')
      .order('date', { ascending: true })
      .limit(30)
    setEntries(data || [])
  }

  useEffect(() => { fetchEntries() }, [])

  // Persist tips whenever they change
  useEffect(() => { saveTips(tips) }, [tips])

  const handleAdd = async () => {
    if (!kg) return
    await supabase.from('weight').insert({ kg: parseFloat(kg), note, date })
    setKg('')
    setNote('')
    setShowForm(false)
    fetchEntries()
  }

  const handleDelete = async (id) => {
    await supabase.from('weight').delete().eq('id', id)
    setEntries(entries.filter(e => e.id !== id))
  }

  // Tips CRUD
  const handleAddTip = () => {
    if (!newTipText.trim()) return
    const newTip = {
      id: Date.now(),
      text: newTipText.trim(),
      label: newTipLabel.trim() || 'Custom tip',
    }
    setTips([...tips, newTip])
    setNewTipText('')
    setNewTipLabel('')
  }

  const handleDeleteTip = (tipId) => {
    const updated = tips.filter(t => t.id !== tipId)
    setTips(updated.length > 0 ? updated : DEFAULT_TIPS)
  }

  const handleStartEdit = (tip) => {
    setEditingTipId(tip.id)
    setEditText(tip.text)
    setEditLabel(tip.label)
  }

  const handleSaveEdit = () => {
    if (!editText.trim()) return
    setTips(tips.map(t =>
      t.id === editingTipId
        ? { ...t, text: editText.trim(), label: editLabel.trim() || 'Custom tip' }
        : t
    ))
    setEditingTipId(null)
    setEditText('')
    setEditLabel('')
  }

  const handleCancelEdit = () => {
    setEditingTipId(null)
    setEditText('')
    setEditLabel('')
  }

  const latest = entries[entries.length - 1]
  const previous = entries[entries.length - 2]
  const diff = latest && previous
    ? (parseFloat(latest.kg) - parseFloat(previous.kg)).toFixed(1)
    : null

  const height = parseFloat(localStorage.getItem('personal-tracker-height') || '170')

  // BMI calculations
  let bmi = null
  let bmiStatus = ''
  let bmiClass = ''
  if (latest && height > 0) {
    const weightVal = parseFloat(latest.kg)
    bmi = (weightVal / ((height / 100) ** 2)).toFixed(1)
    
    const bmiNum = parseFloat(bmi)
    if (bmiNum < 18.5) {
      bmiStatus = 'Underweight'
      bmiClass = 'bmi-under'
    } else if (bmiNum < 25) {
      bmiStatus = 'Normal'
      bmiClass = 'bmi-ideal'
    } else if (bmiNum < 30) {
      bmiStatus = 'Overweight'
      bmiClass = 'bmi-over'
    } else {
      bmiStatus = 'Obese'
      bmiClass = 'bmi-obese'
    }
  }

  const chartData = {
    labels: entries.map(e => dayjs(e.date).format('DD MMM')),
    datasets: [{
      data: entries.map(e => parseFloat(e.kg)),
      borderColor: '#000000',
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#000000',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      fill: true,
      borderWidth: 2.5,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleFont: { size: 12, family: 'inherit' },
        bodyFont: { size: 12, family: 'inherit', weight: '500' },
        padding: 10,
        callbacks: {
          label: ctx => ` Weight: ${ctx.raw} kg`
        }
      }
    },
    scales: {
      y: {
        ticks: { color: '#666', font: { size: 10, weight: '500' }, callback: v => `${v} kg` },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      x: {
        ticks: { color: '#666', font: { size: 9, weight: '500' }, maxRotation: 0 },
        grid: { display: false }
      }
    }
  }

  return (
    <>
      {/* ===== Small Dark Card — Health Tips ===== */}
      <div className="card card-dark weight-summary">
        <div className="card-header">
          <h2 className="card-title">Tips</h2>
          <button className="dots-menu" onClick={() => { setManageTips(!manageTips); setEditingTipId(null) }}>
            {manageTips ? '✕' : '•••'}
          </button>
        </div>
        <div className="tips-section">
          <p className="tips-subtitle">{manageTips ? 'Manage your tips' : 'Personalized insights'}</p>

          {tips.map((tip) => (
            <div className="tip-card" key={tip.id}>
              {editingTipId === tip.id ? (
                <div className="tip-edit-form">
                  <textarea
                    className="tip-edit-input"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    placeholder="Tip text..."
                    rows={2}
                  />
                  <input
                    className="tip-edit-input tip-edit-label-input"
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    placeholder="Label (e.g. Health tip)"
                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                  />
                  <div className="tip-edit-actions">
                    <button className="tip-action-btn tip-save-btn" onClick={handleSaveEdit}>Save</button>
                    <button className="tip-action-btn tip-cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {tip.text}
                  <span className="tip-label">{tip.label}</span>
                  {manageTips && (
                    <div className="tip-manage-actions">
                      <button className="tip-action-btn tip-edit-btn" onClick={() => handleStartEdit(tip)}>✎ Edit</button>
                      <button className="tip-action-btn tip-delete-btn" onClick={() => handleDeleteTip(tip.id)}>✕</button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Add new tip form */}
          {manageTips && (
            <div className="tip-add-form">
              <input
                className="tip-edit-input"
                value={newTipText}
                onChange={e => setNewTipText(e.target.value)}
                placeholder="Write a new tip..."
                onKeyDown={e => e.key === 'Enter' && handleAddTip()}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className="tip-edit-input tip-edit-label-input"
                  value={newTipLabel}
                  onChange={e => setNewTipLabel(e.target.value)}
                  placeholder="Label (optional)"
                  onKeyDown={e => e.key === 'Enter' && handleAddTip()}
                  style={{ flex: 1 }}
                />
                <button className="tip-action-btn tip-save-btn" onClick={handleAddTip}>+ Add</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Light Card — Weight Tracking ===== */}
      <div className="card card-light weight-track">
        <div className="card-header">
          <div>
            <h3 className="card-title-sm">Weight</h3>
            <p className="card-subtitle">Latest measurement</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {entries.length > 0 && (
              <button
                className="pill-btn-outline"
                style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? 'Hide' : 'History'}
              </button>
            )}
            <button className="dots-menu dots-menu-light" onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕' : '•••'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="weight-form">
            <input
              className="form-input-light"
              type="number"
              placeholder="Weight (kg)"
              value={kg}
              onChange={e => setKg(e.target.value)}
              step="0.1"
            />
            <input
              className="form-input-light"
              type="text"
              placeholder="Note"
              value={note}
              onChange={e => setNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <input
              className="form-input-light"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ minWidth: 'auto', flex: 'none', width: 150 }}
            />
            <button className="pill-btn-filled" onClick={handleAdd}>Save</button>
          </div>
        )}

        <div className="tracking-section">
          <span className="tracking-label">Current weight</span>
          <div className="tracking-value">
          {latest ? parseFloat(latest.kg).toFixed(1) : <span style={{ fontSize: '1.5rem', opacity: 0.3 }}>No data</span>}
          </div>
          <span className="tracking-unit">
            {latest ? (
              <>
                kg
                {diff !== null && (
                  <span style={{
                    marginLeft: 12,
                    color: diff > 0 ? '#e05555' : diff < 0 ? '#43a047' : 'var(--text-muted)',
                    fontWeight: 600,
                  }}>
                    {diff > 0 ? '+' : ''}{diff} kg
                  </span>
                )}
              </>
            ) : 'No data yet'}
          </span>
        </div>

        {/* Dynamic BMI Gauge Banner */}
        {latest && bmi && (
          <div className="bmi-banner">
            <span className="bmi-label">Your BMI Status</span>
            <div className="bmi-content-row">
              <span className="bmi-value">{bmi}</span>
              <span className={`bmi-status-badge ${bmiClass}`}>{bmiStatus}</span>
            </div>
            <span className="bmi-height-hint">Height: {height} cm (Configure in Settings)</span>
          </div>
        )}

        {/* Line Chart */}
        {entries.length > 1 && (
          <div className="weight-chart-wrapper" style={{ marginTop: 20 }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}

        {/* History List */}
        {showHistory && entries.length > 0 && (
          <div className="weight-history">
            {[...entries].reverse().map(e => (
              <div className="weight-history-row" key={e.id}>
                <div className="weight-history-info">
                  <span className="weight-history-val">{parseFloat(e.kg).toFixed(1)} kg</span>
                  <span className="weight-history-date">{dayjs(e.date).format('DD MMM YYYY')}</span>
                  {e.note && <span className="weight-history-note">{e.note}</span>}
                </div>
                <button className="delete-btn" onClick={() => handleDelete(e.id)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}