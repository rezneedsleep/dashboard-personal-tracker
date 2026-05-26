import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabase'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)
dayjs.extend(isoWeek)

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Other']
const BUDGET_STORAGE_KEY = 'personal-tracker-budgets'
const INCOME_STORAGE_KEY = 'personal-tracker-incomes'

const loadBudgets = () => {
  try {
    const stored = localStorage.getItem(BUDGET_STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return {}
}

const saveBudgets = (budgets) => {
  localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets))
}

const loadIncomes = () => {
  try {
    const stored = localStorage.getItem(INCOME_STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

const saveIncomes = (incomes) => {
  localStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(incomes))
}

export default function Expenses() {
  const [allExpenses, setAllExpenses] = useState([])
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState('week')

  // Monthly filter
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'))
  const isCurrentMonth = selectedMonth === dayjs().format('YYYY-MM')

  // Budget limits
  const [budgets, setBudgets] = useState(loadBudgets)
  const [editingBudget, setEditingBudget] = useState(null)
  const [budgetInput, setBudgetInput] = useState('')

  // Income state
  const [incomes, setIncomes] = useState(loadIncomes)
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomeSource, setIncomeSource] = useState('')
  const [incomeDate, setIncomeDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [listTab, setListTab] = useState('expenses')

  const fetchExpenses = async () => {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
    setAllExpenses(data || [])
  }

  useEffect(() => { fetchExpenses() }, [])
  useEffect(() => { saveBudgets(budgets) }, [budgets])
  useEffect(() => { saveIncomes(incomes) }, [incomes])

  // Filter expenses by selected month
  const expenses = useMemo(() =>
    allExpenses.filter(e => e.date && e.date.startsWith(selectedMonth)),
    [allExpenses, selectedMonth]
  )

  // Filter incomes by selected month
  const monthlyIncomes = useMemo(() =>
    incomes.filter(i => i.date && i.date.startsWith(selectedMonth)),
    [incomes, selectedMonth]
  )

  const handleAdd = async () => {
    if (!amount) return
    await supabase.from('expenses').insert({ amount: parseFloat(amount), category, note, date })
    setAmount('')
    setNote('')
    setShowForm(false)
    fetchExpenses()
  }

  const handleDelete = async (id) => {
    await supabase.from('expenses').delete().eq('id', id)
    setAllExpenses(allExpenses.filter(e => e.id !== id))
  }

  // Income CRUD
  const handleAddIncome = () => {
    if (!incomeAmount) return
    const newInc = {
      id: Date.now(),
      amount: parseFloat(incomeAmount),
      source: incomeSource.trim() || 'General Income',
      date: incomeDate,
    }
    setIncomes([...incomes, newInc])
    setIncomeAmount('')
    setIncomeSource('')
    setShowIncomeForm(false)
  }

  const handleDeleteIncome = (id) => {
    setIncomes(incomes.filter(i => i.id !== id))
  }

  // Month navigation
  const goMonth = (dir) => {
    const m = dayjs(selectedMonth + '-01').add(dir, 'month')
    setSelectedMonth(m.format('YYYY-MM'))
  }

  // Budget CRUD
  const handleSaveBudget = (cat) => {
    const val = parseFloat(budgetInput)
    if (isNaN(val) || val <= 0) {
      // Remove budget if invalid
      const next = { ...budgets }
      delete next[cat]
      setBudgets(next)
    } else {
      setBudgets({ ...budgets, [cat]: val })
    }
    setEditingBudget(null)
    setBudgetInput('')
  }

  const totalMonth = expenses.reduce((s, e) => s + parseFloat(e.amount), 0)
  const totalIncome = useMemo(() =>
    monthlyIncomes.reduce((s, i) => s + parseFloat(i.amount || 0), 0),
    [monthlyIncomes]
  )
  const remainingBalance = totalIncome - totalMonth

  // Export CSV
  const handleExportCSV = () => {
    // 1. Monthly Financial Summary Section
    const summaryHeader = 'MONTHLY FINANCIAL REPORT,' + monthLabel
    const summaryRow1 = `Total Income,Rp ${totalIncome.toLocaleString('id-ID')}`
    const summaryRow2 = `Total Expenses,Rp ${totalMonth.toLocaleString('id-ID')}`
    const summaryRow3 = `Remaining Balance,Rp ${remainingBalance.toLocaleString('id-ID')}`

    // 2. Expenses Detail Section
    const expHeader = '\nEXPENSES DETAIL\nDate,Category,Amount,Note'
    const expRows = expenses.map(e =>
      `${e.date},${e.category},${parseFloat(e.amount).toFixed(0)},"${(e.note || '').replace(/"/g, '""')}"`
    )

    // 3. Incomes Detail Section
    const incHeader = '\nINCOMES DETAIL\nDate,Source,Amount'
    const incRows = monthlyIncomes.map(i =>
      `${i.date},"${(i.source || '').replace(/"/g, '""')}",${parseFloat(i.amount).toFixed(0)}`
    )

    const csv = [
      summaryHeader,
      summaryRow1,
      summaryRow2,
      summaryRow3,
      expHeader,
      ...expRows,
      incHeader,
      ...incRows
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial_report_${selectedMonth}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Category calculations for selected month (used for top items & progress bars)
  const topCategories = CATEGORIES.map(cat => {
    const catExpenses = expenses.filter(e => e.category === cat)
    const catTotal = catExpenses.reduce((s, e) => s + parseFloat(e.amount), 0)

    const monthStart = dayjs(selectedMonth + '-01')
    const daysInMonth = monthStart.daysInMonth()
    const dailyData = []
    for (let i = 0; i < Math.min(daysInMonth, 15); i++) {
      const day = monthStart.add(i, 'day').format('YYYY-MM-DD')
      const dayTotal = catExpenses
        .filter(e => e.date === day)
        .reduce((s, e) => s + parseFloat(e.amount), 0)
      dailyData.push(dayTotal)
    }

    const max = Math.max(...dailyData, 1)
    const budget = budgets[cat] || null
    const budgetPercent = budget ? Math.min((catTotal / budget) * 100, 100) : null
    const overBudget = budget ? catTotal > budget : false
    const warningBudget = budget ? (catTotal >= budget * 0.8 && catTotal <= budget) : false

    // Trend: first half vs second half of month
    const mid = Math.floor(catExpenses.length / 2)
    const firstHalf = catExpenses.slice(mid).reduce((s, e) => s + parseFloat(e.amount), 0)
    const secondHalf = catExpenses.slice(0, mid).reduce((s, e) => s + parseFloat(e.amount), 0)

    return {
      name: cat, total: catTotal, dailyData, max,
      trend: secondHalf >= firstHalf ? 'up' : 'down',
      budget, budgetPercent, overBudget, warningBudget,
    }
  })
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)

  // Non-sliced category totals for Doughnut Chart
  const allCategoryData = useMemo(() =>
    CATEGORIES.map(cat => {
      const total = expenses.filter(e => e.category === cat).reduce((s, e) => s + parseFloat(e.amount), 0)
      return { name: cat, total }
    }).filter(c => c.total > 0),
    [expenses]
  )

  // Doughnut Chart Data & Options
  const doughnutData = useMemo(() => ({
    labels: allCategoryData.map(c => c.name),
    datasets: [{
      data: allCategoryData.map(c => c.total),
      backgroundColor: [
        'rgba(0, 0, 0, 0.85)',
        'rgba(0, 0, 0, 0.65)',
        'rgba(0, 0, 0, 0.45)',
        'rgba(0, 0, 0, 0.3)',
        'rgba(0, 0, 0, 0.15)',
        'rgba(0, 0, 0, 0.08)',
      ],
      borderColor: '#ffffff',
      borderWidth: 2,
    }]
  }), [allCategoryData])

  const doughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#333',
          font: { size: 11, family: 'inherit', weight: '500' },
          boxWidth: 8,
          padding: 10,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleFont: { size: 12, family: 'inherit' },
        bodyFont: { size: 11, family: 'inherit' },
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw
            const sum = ctx.dataset.data.reduce((a, b) => a + b, 0)
            const percent = sum > 0 ? Math.round((val / sum) * 100) : 0
            return ` ${ctx.label}: Rp ${val.toLocaleString('id-ID')} (${percent}%)`
          }
        }
      }
    },
    cutout: '72%',
  }), [])

  // Weekly data (only for current month)
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const today = dayjs()
  const todayIsoDay = today.isoWeekday()
  const startOfWeek = today.subtract(todayIsoDay - 1, 'day')

  const weeklyData = weekDays.map((day, i) => {
    const d = startOfWeek.add(i, 'day')
    const dateStr = d.format('YYYY-MM-DD')
    const dayExpenses = expenses.filter(e => e.date === dateStr)
    const dayTotal = dayExpenses.reduce((s, e) => s + parseFloat(e.amount), 0)
    const isToday = dateStr === today.format('YYYY-MM-DD')
    const isPast = d.isBefore(today, 'day')
    return { day, total: dayTotal, isToday, isPast }
  })

  const maxWeekly = Math.max(...weeklyData.map(d => d.total), 1)

  // Monthly data (last 6 months relative to selectedMonth)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const m = dayjs(selectedMonth + '-01').subtract(5 - i, 'month')
    const monthStr = m.format('YYYY-MM')
    const total = allExpenses
      .filter(e => e.date && e.date.startsWith(monthStr))
      .reduce((s, e) => s + parseFloat(e.amount), 0)
    return {
      month: m.format('MMM'),
      total,
      isCurrent: monthStr === selectedMonth
    }
  })

  const maxMonthly = Math.max(...monthlyData.map(d => d.total), 1)

  const formatAmount = (val) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
    if (val >= 1000) return `${Math.round(val / 1000)}K`
    return val.toLocaleString('id-ID')
  }

  const monthLabel = dayjs(selectedMonth + '-01').format('MMMM YYYY')

  return (
    <>
      {/* ===== Main Dark Card — Total Expenses ===== */}
      <div className="card card-dark expenses-main">
        <div className="card-header">
          <h2 className="card-title">Total Expenses</h2>
          <div className="header-actions">
            <button className="pill-btn" onClick={() => { setShowIncomeForm(!showIncomeForm); setShowForm(false); }}>
              {showIncomeForm ? 'Close' : '+ Income'}
            </button>
            <button className="pill-btn export-btn" onClick={handleExportCSV} title="Export CSV Report">
              ↓ CSV
            </button>
            <button className="pill-btn" onClick={() => { setShowForm(!showForm); setShowIncomeForm(false); }}>
              {showForm ? 'Close' : '+ Expense'}
            </button>
          </div>
        </div>

        {/* Monthly filter */}
        <div className="month-filter">
          <button className="month-arrow" onClick={() => goMonth(-1)}>◀</button>
          <span className="month-label">{monthLabel}</span>
          <button className="month-arrow" onClick={() => goMonth(1)} disabled={isCurrentMonth}>▶</button>
        </div>

        {/* Financial Summary Banner */}
        <div className="financial-summary-banner">
          <div className="summary-card balance-card">
            <span className="summary-label">Balance</span>
            <span className={`summary-value ${remainingBalance >= 0 ? 'text-success' : 'text-danger'}`}>
              Rp {remainingBalance.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="financial-summary-row">
            <div className="summary-card income-card">
              <span className="summary-label">Total Income</span>
              <span className="summary-value text-success">
                Rp {totalIncome.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="summary-card spending-card">
              <span className="summary-label">Total Expenses</span>
              <span className="summary-value">
                Rp {totalMonth.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="add-form">
            <input
              className="form-input form-input-num"
              type="number"
              placeholder="Amount (Rp)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input
              className="form-input form-input-text"
              type="text"
              placeholder="Note (optional)"
              value={note}
              onChange={e => setNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <input
              className="form-input form-input-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
            <button className="pill-btn-filled" onClick={handleAdd}>Save</button>
          </div>
        )}

        {showIncomeForm && (
          <div className="add-form add-income-form">
            <input
              className="form-input form-input-num"
              type="number"
              placeholder="Income Amount (Rp)"
              value={incomeAmount}
              onChange={e => setIncomeAmount(e.target.value)}
            />
            <input
              className="form-input form-input-text"
              type="text"
              placeholder="Source (e.g. Salary, Side Hustle)"
              value={incomeSource}
              onChange={e => setIncomeSource(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddIncome()}
            />
            <input
              className="form-input form-input-date"
              type="date"
              value={incomeDate}
              onChange={e => setIncomeDate(e.target.value)}
            />
            <button className="pill-btn-filled" onClick={handleAddIncome}>Save Income</button>
          </div>
        )}

        <div className="category-charts">
          {topCategories.map(cat => (
            <div className={`category-section ${cat.overBudget ? 'over-budget' : cat.warningBudget ? 'near-budget' : ''}`} key={cat.name}>
              <div className="category-header">
                <span className="category-name">{cat.name}</span>
                <span className={`trend-arrow ${cat.trend}`}>
                  {cat.trend === 'up' ? '↑' : '↓'}
                </span>
                <button
                  className="dots-menu"
                  onClick={() => {
                    if (editingBudget === cat.name) {
                      setEditingBudget(null)
                    } else {
                      setEditingBudget(cat.name)
                      setBudgetInput(budgets[cat.name] || '')
                    }
                  }}
                >•••</button>
              </div>

              {/* Budget edit inline */}
              {editingBudget === cat.name && (
                <div className="budget-edit-row">
                  <input
                    className="budget-edit-input"
                    type="number"
                    placeholder="Budget limit (Rp)"
                    value={budgetInput}
                    onChange={e => setBudgetInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveBudget(cat.name)}
                  />
                  <button className="budget-save-btn" onClick={() => handleSaveBudget(cat.name)}>Set</button>
                </div>
              )}

              <div className="mini-bars">
                {cat.dailyData.map((val, i) => (
                  <div
                    key={i}
                    className="mini-bar"
                    style={{ height: `${Math.max((val / cat.max) * 100, 4)}%` }}
                    title={`Rp ${val.toLocaleString('id-ID')}`}
                  />
                ))}
              </div>
              <div className="category-value">
                <span className={`big-number ${cat.overBudget ? 'text-danger' : cat.warningBudget ? 'text-warning' : ''}`}>
                  {formatAmount(cat.total)}
                </span>
                <span className="value-unit">Rp this month</span>
              </div>

              {/* Budget progress bar */}
              {cat.budget && (
                <div className="budget-section">
                  <div className="budget-bar-track">
                    <div
                      className={`budget-bar-fill ${cat.overBudget ? 'exceeded' : cat.warningBudget ? 'warning' : ''}`}
                      style={{ width: `${cat.budgetPercent}%` }}
                    />
                  </div>
                  <div className="budget-info">
                    <span className={`budget-text ${cat.overBudget ? 'text-danger' : cat.warningBudget ? 'text-warning' : ''}`}>
                      {cat.overBudget 
                        ? '⚠ Over budget!' 
                        : cat.warningBudget 
                        ? `⚠ Warning! (${Math.round(cat.budgetPercent)}%)` 
                        : `${Math.round(cat.budgetPercent)}% of budget`}
                    </span>
                    <span className="budget-limit">
                      Rp {formatAmount(cat.budget)}
                      <button
                        className="budget-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          const next = { ...budgets }
                          delete next[cat.name]
                          setBudgets(next)
                        }}
                        title="Remove budget limit"
                      >✕</button>
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tab list toggle selector */}
        <div className="list-toggle-bar">
          <button
            className={`list-toggle-btn ${listTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setListTab('expenses')}
          >
            Expenses ({expenses.length})
          </button>
          <button
            className={`list-toggle-btn ${listTab === 'incomes' ? 'active' : ''}`}
            onClick={() => setListTab('incomes')}
          >
            Incomes ({monthlyIncomes.length})
          </button>
        </div>

        {/* Dynamic transaction list depending on listTab */}
        {listTab === 'expenses' ? (
          expenses.length > 0 ? (
            <div className="expenses-list">
              {expenses.slice(0, 10).map(e => (
                <div className="expense-row" key={e.id}>
                  <div className="expense-info">
                    <span className="expense-cat">{e.category}</span>
                    <span className="expense-note">{e.note || '—'}</span>
                    <span className="expense-date">{dayjs(e.date).format('DD MMM')}</span>
                  </div>
                  <div className="expense-right">
                    <span className="expense-amount">Rp {parseFloat(e.amount).toLocaleString('id-ID')}</span>
                    <button className="delete-btn" onClick={() => handleDelete(e.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No expenses for {monthLabel}</div>
          )
        ) : (
          monthlyIncomes.length > 0 ? (
            <div className="expenses-list incomes-list">
              {monthlyIncomes.map(i => (
                <div className="expense-row income-row" key={i.id}>
                  <div className="expense-info">
                    <span className="expense-cat income-source-label">Income</span>
                    <span className="expense-note">{i.source}</span>
                    <span className="expense-date">{dayjs(i.date).format('DD MMM')}</span>
                  </div>
                  <div className="expense-right">
                    <span className="expense-amount text-success">Rp {parseFloat(i.amount).toLocaleString('id-ID')}</span>
                    <button className="delete-btn" onClick={() => handleDeleteIncome(i.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No income logged for {monthLabel}</div>
          )
        )}
      </div>

      {/* ===== Light Card — Detailed Report ===== */}
      <div className="card card-light expenses-report">
        <div className="card-header">
          <div>
            <h3 className="card-title-sm">Detailed Report</h3>
            <p className="card-subtitle">
              {viewMode === 'week'
                ? (isCurrentMonth ? 'Weekly' : 'Not available for past months')
                : 'Monthly'} expense breakdown
            </p>
          </div>
          <button
            className="pill-btn-outline"
            onClick={() => setViewMode(v => v === 'week' ? 'month' : 'week')}
          >
            {viewMode === 'week' ? 'Week ↓' : 'Month ↓'}
          </button>
        </div>

        {/* Doughnut Chart section (Only in Monthly detailed view when there are expenses) */}
        {viewMode === 'month' && allCategoryData.length > 0 && (
          <div className="doughnut-chart-container">
            <h4 className="chart-title-sub">Category Distribution</h4>
            <div className="doughnut-chart-wrapper">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
        )}

        {viewMode === 'week' && isCurrentMonth ? (
          <div className="weekly-table">
            {weeklyData.map((d, i) => (
              <div key={d.day} className={`weekly-col ${d.isToday ? 'active' : ''}`}>
                <span className="weekly-day">{d.day} {d.isPast || d.isToday ? '↑' : '↓'}</span>
                <span className="weekly-value">{formatAmount(d.total)}</span>
                <span className="weekly-unit">Rp</span>
                <div className="weekly-bar-wrap">
                  <div
                    className="weekly-bar"
                    style={{
                      height: `${Math.max((d.total / maxWeekly) * 100, 3)}%`,
                      animationDelay: `${i * 0.06}s`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'week' && !isCurrentMonth ? (
          <div className="empty-state" style={{ opacity: 0.5 }}>
            Weekly view is only available for the current month.
            <br />Switch to Monthly view for historical data.
          </div>
        ) : (
          <div className="weekly-table">
            {monthlyData.map((d, i) => (
              <div key={d.month} className={`weekly-col ${d.isCurrent ? 'active' : ''}`}>
                <span className="weekly-day">{d.month}</span>
                <span className="weekly-value">{formatAmount(d.total)}</span>
                <span className="weekly-unit">Rp</span>
                <div className="weekly-bar-wrap">
                  <div
                    className="weekly-bar"
                    style={{
                      height: `${Math.max((d.total / maxMonthly) * 100, 3)}%`,
                      animationDelay: `${i * 0.06}s`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}