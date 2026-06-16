import { useState } from 'react'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import { ALL_QUESTS, CYCLES, diffClass, uid, formatDate } from '../data.js'

const RESULTS = ['Win', 'Loss', 'Abandoned']

const DEFAULT_FORM = {
  questId: 'ptm',
  date: new Date().toISOString().split('T')[0],
  result: 'Win',
  vp: 0,
  threatStart: 0,
  threatEnd: 0,
  players: 1,
  notes: '',
}

export default function PlayLog({ plays, setPlays }) {
  const [showAdd,   setShowAdd]  = useState(false)
  const [filter,    setFilter]   = useState('All')
  const [cycleFilter, setCycle]  = useState('All')
  const [form,      setForm]     = useState(DEFAULT_FORM)
  const [expand,    setExpand]   = useState(null)

  const questMap = Object.fromEntries(ALL_QUESTS.map(q => [q.id, q]))

  const addPlay = () => {
    const q = questMap[form.questId]
    const play = {
      ...form,
      id: uid(),
      questName: q?.name ?? 'Unknown',
      cycle: q?.cycle ?? '',
      diff: q?.diff ?? 0,
      timestamp: Date.now(),
    }
    setPlays(prev => [play, ...prev])
    setShowAdd(false)
    setForm(DEFAULT_FORM)
  }

  const delPlay = id => setPlays(prev => prev.filter(p => p.id !== id))

  const filtered = plays.filter(p => {
    if (filter !== 'All' && p.result !== filter) return false
    if (cycleFilter !== 'All' && p.cycle !== cycleFilter) return false
    return true
  })

  const wins   = plays.filter(p => p.result === 'Win').length
  const losses = plays.filter(p => p.result === 'Loss').length
  const wr     = plays.length ? Math.round(wins / plays.length * 100) : 0
  const totalVP = plays.reduce((s, p) => s + (p.vp || 0), 0)

  return (
    <div className="page">
      {/* Summary */}
      <div className="stats-row">
        <div className="stat-chip">
          <div className="num">{plays.length}</div>
          <div className="lbl">Total Plays</div>
        </div>
        <div className="stat-chip">
          <div className="num" style={{ color: wr >= 50 ? 'var(--win3)' : 'var(--loss3)' }}>
            {wr}%
          </div>
          <div className="lbl">Win Rate</div>
        </div>
      </div>
      <div className="stats-row">
        <div className="stat-chip">
          <div className="num" style={{ color: 'var(--win3)' }}>{wins}</div>
          <div className="lbl">Wins</div>
        </div>
        <div className="stat-chip">
          <div className="num" style={{ color: 'var(--gold2)' }}>{totalVP}</div>
          <div className="lbl">Total VP</div>
        </div>
      </div>

      {/* Filters + Add */}
      <div className="flex items-center gap-8 mb-12">
        <div className="tab-group" style={{ flex: 1, marginBottom: 0 }}>
          {['All', 'Win', 'Loss'].map(f => (
            <div
              key={f}
              className={`tab-item ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'All' ? 'All' : f + 's'}
            </div>
          ))}
        </div>
        <button className="btn btn-gold btn-sm" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add
        </button>
      </div>

      {/* Cycle filter */}
      <select
        className="form-select mb-12"
        value={cycleFilter}
        onChange={e => setCycle(e.target.value)}
      >
        <option value="All">All Cycles</option>
        {CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* Play list */}
      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📖</div>
          <div className="empty-title">No plays recorded</div>
          <div className="empty-msg">Tap Add to record your first quest result.</div>
        </div>
      )}

      {filtered.map(p => (
        <div key={p.id} className="play-entry">
          <div className="flex justify-between items-center">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="play-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {p.questName}
              </div>
              <div className="play-meta">
                <span>{formatDate(p.date)}</span>
                <span>VP: {p.vp}</span>
                <span>T: {p.threatStart}→{p.threatEnd}</span>
              </div>
            </div>
            <div className="flex gap-6 items-center" style={{ flexShrink: 0, marginLeft: 8 }}>
              <span className={`badge badge-${p.result === 'Win' ? 'win' : p.result === 'Loss' ? 'loss' : 'gold'}`}>
                {p.result}
              </span>
              <span className={`diff ${diffClass(p.diff)}`}>{p.diff}</span>
              <button
                className="btn btn-danger btn-xs"
                onClick={() => delPlay(p.id)}
                aria-label="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          {p.notes && <div className="play-notes">{p.notes}</div>}
        </div>
      ))}

      {/* Add Play Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              Record Play
              <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Quest</label>
              <select
                className="form-select"
                value={form.questId}
                onChange={e => setForm(f => ({ ...f, questId: e.target.value }))}
              >
                {ALL_QUESTS.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.name} ({q.cycle})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Result</label>
                <select
                  className="form-select"
                  value={form.result}
                  onChange={e => setForm(f => ({ ...f, result: e.target.value }))}
                >
                  {RESULTS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">VP</label>
                <input
                  type="number" min="0"
                  className="form-input"
                  value={form.vp}
                  onChange={e => setForm(f => ({ ...f, vp: +e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">T Start</label>
                <input
                  type="number" min="0"
                  className="form-input"
                  value={form.threatStart}
                  onChange={e => setForm(f => ({ ...f, threatStart: +e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">T End</label>
                <input
                  type="number" min="0"
                  className="form-input"
                  value={form.threatEnd}
                  onChange={e => setForm(f => ({ ...f, threatEnd: +e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Players</label>
              <select
                className="form-select"
                value={form.players}
                onChange={e => setForm(f => ({ ...f, players: +e.target.value }))}
              >
                {[1,2,3,4].map(n => <option key={n} value={n}>{n} player{n>1?'s':''}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Notable moments, special rules, campaign events…"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <button className="btn btn-gold btn-block" onClick={addPlay}>
              Record Play
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
