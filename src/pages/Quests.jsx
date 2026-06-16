import { useState } from 'react'
import { Check } from 'lucide-react'
import { ALL_QUESTS, CYCLES, diffClass } from '../data.js'

export default function Quests({ plays, questProgress, setQP }) {
  const [selCycle, setCycle] = useState('All')
  const [search,   setSearch] = useState('')
  const [showOnly, setShowOnly] = useState('all') // all | beaten | unbeaten

  // Compute per-quest stats from plays
  const questStats = {}
  plays.forEach(p => {
    if (!questStats[p.questId]) questStats[p.questId] = { plays:0, wins:0 }
    questStats[p.questId].plays++
    if (p.result === 'Win') questStats[p.questId].wins++
  })

  const toggleBeaten = id => {
    setQP(prev => ({
      ...prev,
      [id]: { ...prev[id], beaten: !prev[id]?.beaten },
    }))
  }

  const filtered = ALL_QUESTS.filter(q => {
    if (selCycle !== 'All' && q.cycle !== selCycle) return false
    if (search && !q.name.toLowerCase().includes(search.toLowerCase())) return false
    const beaten = questProgress[q.id]?.beaten
    if (showOnly === 'beaten'   && !beaten) return false
    if (showOnly === 'unbeaten' &&  beaten) return false
    return true
  })

  const beaten    = Object.values(questProgress).filter(v => v?.beaten).length
  const totalQ    = ALL_QUESTS.length
  const pct       = Math.round(beaten / totalQ * 100)

  return (
    <div className="page">
      {/* Summary */}
      <div className="stats-row">
        <div className="stat-chip">
          <div className="num">{totalQ}</div>
          <div className="lbl">Total Quests</div>
        </div>
        <div className="stat-chip">
          <div className="num" style={{ color:'var(--gold2)' }}>{beaten}</div>
          <div className="lbl">Beaten ({pct}%)</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="campaign-bar" style={{ marginBottom:12 }}>
        <div className="campaign-bar-fill" style={{ width:`${pct}%` }} />
      </div>

      {/* Filters */}
      <input
        className="form-input mb-8"
        placeholder="Search quests…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="tab-group">
        {['all','beaten','unbeaten'].map(f => (
          <div
            key={f}
            className={`tab-item ${showOnly === f ? 'active' : ''}`}
            onClick={() => setShowOnly(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </div>
        ))}
      </div>

      <select
        className="form-select mb-12"
        value={selCycle}
        onChange={e => setCycle(e.target.value)}
      >
        <option value="All">All Cycles</option>
        {CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* Quest list */}
      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <div className="empty-title">No quests found</div>
          <div className="empty-msg">Try adjusting your filters.</div>
        </div>
      )}

      {filtered.map(q => {
        const qs     = questStats[q.id]
        const beaten = questProgress[q.id]?.beaten
        const wr     = qs && qs.plays ? Math.round(qs.wins / qs.plays * 100) : null

        return (
          <div
            key={q.id}
            className={`quest-entry ${beaten ? 'beaten' : ''}`}
            onClick={() => toggleBeaten(q.id)}
          >
            <div style={{ flex:1, minWidth:0 }}>
              <div
                className="quest-name"
                style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
              >
                {q.name}
              </div>
              <div style={{ display:'flex', gap:8, marginTop:3, alignItems:'center', flexWrap:'wrap' }}>
                <div className="quest-cycle">
                  {q.cycle.split(' & ')[0].replace('ALeP — ','').slice(0,22)}
                </div>
                {qs && (
                  <span style={{ fontSize:11, color:'var(--text3)' }}>
                    {qs.plays}p · {wr}% WR
                  </span>
                )}
                {q.campaignOnly && (
                  <span className="badge badge-gold" style={{ fontSize:9, padding:'1px 5px' }}>
                    Campaign
                  </span>
                )}
              </div>
            </div>
            <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
              <span className={`diff ${diffClass(q.diff)}`}>{q.diff}</span>
              {beaten && <Check size={16} color="var(--gold2)" strokeWidth={2.5} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}
