import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabase'
import dayjs from 'dayjs'

const FREQ_STORAGE_KEY = 'personal-tracker-habit-frequencies'

const loadFrequencies = () => {
  try {
    const stored = localStorage.getItem(FREQ_STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return {}
}

export default function Habits() {
  const [habits, setHabits] = useState([])
  const [newHabit, setNewHabit] = useState('')
  const [frequency, setFrequency] = useState('Everyday')
  const [habitFrequencies, setHabitFrequencies] = useState(loadFrequencies)
  const [allHistory, setAllHistory] = useState([])
  const today = dayjs().format('YYYY-MM-DD')

  const fetchHabits = async () => {
    const { data } = await supabase
      .from('habits')
      .select('*')
      .eq('date', today)
      .order('created_at', { ascending: true })
    setHabits(data || [])
  }

  // Fetch last 7 days of habits for timeline
  const [weekHistory, setWeekHistory] = useState([])

  const fetchWeekHistory = async () => {
    const startDate = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
    const { data } = await supabase
      .from('habits')
      .select('*')
      .gte('date', startDate)
      .order('date', { ascending: true })

    // Group by date
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day')
      const dateStr = d.format('YYYY-MM-DD')
      const dayHabits = (data || []).filter(h => h.date === dateStr)
      const total = dayHabits.length
      const done = dayHabits.filter(h => h.done).length
      const rate = total > 0 ? done / total : 0
      days.push({
        label: i === 0 ? 'Today' : d.format('ddd'),
        date: dateStr,
        rate,
        total,
        done,
      })
    }
    setWeekHistory(days)
  }

  const fetchAllHistory = async () => {
    const { data } = await supabase
      .from('habits')
      .select('name, date, done')
      .order('date', { ascending: false })
    setAllHistory(data || [])
  }

  useEffect(() => {
    fetchHabits()
    fetchWeekHistory()
    fetchAllHistory()
  }, [])

  const handleAdd = async () => {
    if (!newHabit.trim()) return
    await supabase.from('habits').insert({ name: newHabit.trim(), date: today })
    
    // Save frequency locally
    const nextFreqs = { ...habitFrequencies, [newHabit.trim()]: frequency }
    setHabitFrequencies(nextFreqs)
    localStorage.setItem(FREQ_STORAGE_KEY, JSON.stringify(nextFreqs))
    
    setNewHabit('')
    setFrequency('Everyday')
    fetchHabits()
    fetchWeekHistory()
    fetchAllHistory()
  }

  const handleToggle = async (habit) => {
    // If habit is weekdays only and it's weekend, disable toggling
    if (!isHabitActiveToday(habit.name)) return

    await supabase.from('habits').update({ done: !habit.done }).eq('id', habit.id)
    setHabits(habits.map(h => h.id === habit.id ? { ...h, done: !h.done } : h))
    fetchAllHistory()
    // Delay to allow animation, then refresh week history
    setTimeout(fetchWeekHistory, 300)
  }

  const handleDelete = async (id) => {
    await supabase.from('habits').delete().eq('id', id)
    setHabits(habits.filter(h => h.id !== id))
    fetchWeekHistory()
    fetchAllHistory()
  }

  // Active status helper
  const isHabitActiveToday = (name) => {
    const freq = habitFrequencies[name] || 'Everyday'
    if (freq === 'Weekdays') {
      const day = dayjs().isoWeekday()
      return day >= 1 && day <= 5 // 1=Mon, 5=Fri
    }
    return true
  }

  // Streaks Counter Helper
  const calculateStreak = (habitName) => {
    const entries = allHistory.filter(h => h.name.toLowerCase() === habitName.toLowerCase())
    if (entries.length === 0) return 0

    const dateDone = {}
    entries.forEach(e => {
      if (e.date) {
        dateDone[e.date] = dateDone[e.date] || e.done
      }
    })

    let streak = 0
    let current = dayjs()
    const todayStr = current.format('YYYY-MM-DD')
    const yesterdayStr = current.subtract(1, 'day').format('YYYY-MM-DD')

    const doneToday = dateDone[todayStr]
    const doneYesterday = dateDone[yesterdayStr]

    // If not completed today and not yesterday, streak is broken
    if (!doneToday && !doneYesterday) return 0

    let checkDate = doneToday ? current : current.subtract(1, 'day')

    while (true) {
      const dateStr = checkDate.format('YYYY-MM-DD')
      if (dateDone[dateStr]) {
        streak++
        checkDate = checkDate.subtract(1, 'day')
      } else {
        break
      }
    }

    return streak
  }

  // Filter active habits for today completion rate
  const activeHabits = useMemo(() =>
    habits.filter(h => isHabitActiveToday(h.name)),
    [habits, habitFrequencies]
  )

  const doneCount = activeHabits.filter(h => h.done).length
  const totalCount = activeHabits.length
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  // Weekly average completion
  const weekAvg = weekHistory.length > 0
    ? Math.round(weekHistory.reduce((s, d) => s + d.rate, 0) / weekHistory.length * 100)
    : 0

  return (
    <>
      {/* ===== Dark Card — Habit Tracker ===== */}
      <div className="card card-dark habits-main">
        <div className="card-header">
          <h2 className="card-title">Habit Tracker</h2>
          <button className="dots-menu">•••</button>
        </div>

        <div className="habits-list">
          {habits.length === 0 && (
            <p className="empty-state">No habits for today yet</p>
          )}
          {habits.map(h => {
            const active = isHabitActiveToday(h.name)
            const streak = calculateStreak(h.name)
            const freq = habitFrequencies[h.name] || 'Everyday'

            return (
              <div className={`habit-row ${!active ? 'inactive-day' : ''}`} key={h.id}>
                <div className="habit-info">
                  <div className="habit-header-row">
                    <span className={`habit-name ${h.done ? 'done' : ''}`}>{h.name}</span>
                    {streak > 0 && (
                      <span className="habit-streak-badge" title="Consecutive completed days">
                        🔥 {streak} {streak === 1 ? 'day' : 'days'}
                      </span>
                    )}
                  </div>
                  <div className="habit-meta-row">
                    <span className="habit-freq-label">
                      📅 {freq === 'Everyday' ? 'Everyday' : freq === 'Weekdays' ? 'Weekdays (Mon-Fri)' : '3x a Week'}
                    </span>
                    <span className="habit-status">
                      {!active ? 'Rest Day' : h.done ? 'Done' : 'Pending'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    className={`toggle-switch ${h.done ? 'active' : ''} ${!active ? 'disabled-switch' : ''}`}
                    onClick={() => active && handleToggle(h)}
                    disabled={!active}
                    aria-label={`Toggle ${h.name}`}
                  />
                  <button className="delete-btn" onClick={() => handleDelete(h.id)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="add-habit-row">
          <input
            className="form-input"
            type="text"
            placeholder="New habit..."
            value={newHabit}
            onChange={e => setNewHabit(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <select
            className="form-select habit-freq-select"
            value={frequency}
            onChange={e => setFrequency(e.target.value)}
          >
            <option value="Everyday">Everyday</option>
            <option value="Weekdays">Weekdays</option>
            <option value="3x a Week">3x a Week</option>
          </select>
          <button className="add-habit-btn" onClick={handleAdd}>+</button>
        </div>

        <div className="progress-section">
          <span className="progress-label">Completed</span>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <span className="progress-value">{completionRate}%</span>
        </div>
      </div>

      {/* ===== Light Card — Habit Progress ===== */}
      <div className="card card-light habits-progress">
        <div className="card-header">
          <div>
            <h3 className="card-title-sm">Weekly Completion</h3>
            <p className="card-subtitle">Habit completion rate</p>
          </div>
        </div>

        <div className="timeline-section">
          <div className="timeline-info">
            <div className="big-percentage">{weekAvg}%</div>
            <div className="percentage-label">7-day average</div>
          </div>

          <div className="timeline-dots">
            {weekHistory.map((d, i) => (
              <div className="timeline-entry" key={i}>
                <div
                  className={`timeline-dot ${d.rate >= 1 ? 'active' : d.rate > 0 ? 'partial' : ''}`}
                  title={`${d.done}/${d.total} completed`}
                />
                <span className="timeline-label">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}