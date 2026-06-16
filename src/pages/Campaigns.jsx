import { CAMPAIGNS, QUEST_MAP } from '../data.js'

export default function Campaigns({ plays }) {
  // Per-quest win tracking from play log
  const wonIds = new Set(plays.filter(p => p.result === 'Win').map(p => p.questId))
  const lostIds = new Set(plays.filter(p => p.result === 'Loss').map(p => p.questId))

  return (
    <div className="page">
      <p style={{ fontSize:13, color:'var(--text3)', marginBottom:12, lineHeight:1.6 }}>
        Campaign progress is tracked from your Play Log wins. Tap any quest dot to see its name.
      </p>

      {CAMPAIGNS.map(c => {
        const won  = c.quests.filter(id => wonIds.has(id)).length
        const lost = c.quests.filter(id => lostIds.has(id) && !wonIds.has(id)).length
        const pct  = Math.round(won / c.quests.length * 100)

        return (
          <div key={c.id} className="card card-gold" style={{ marginBottom:10 }}>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span style={{ fontSize:22 }}>{c.icon}</span>
                  <div
                    className="cinzel"
                    style={{ fontSize:14, fontWeight:600, color:'var(--gold2)' }}
                  >
                    {c.name}
                  </div>
                </div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{c.desc}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0, marginLeft:8 }}>
                <div
                  className="mono"
                  style={{ fontSize:20, fontWeight:700, color:'var(--gold2)', lineHeight:1 }}
                >
                  {won}/{c.quests.length}
                </div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>Won</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="campaign-bar">
              <div className="campaign-bar-fill" style={{ width:`${pct}%` }} />
            </div>

            {/* Quest dots */}
            <div className="quest-dots">
              {c.quests.map(id => {
                const q = QUEST_MAP[id]
                const isWon  = wonIds.has(id)
                const isLost = lostIds.has(id) && !isWon
                return (
                  <div
                    key={id}
                    className={`quest-dot ${isWon ? 'won' : isLost ? 'lost' : ''}`}
                    title={q?.name ?? id}
                  />
                )
              })}
            </div>

            {/* Quest list */}
            <div style={{ marginTop:10 }}>
              {c.quests.map((id, i) => {
                const q     = QUEST_MAP[id]
                const isWon  = wonIds.has(id)
                const isLost = lostIds.has(id) && !isWon
                if (!q) return null
                return (
                  <div
                    key={id}
                    style={{
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'4px 0',
                      borderBottom: i < c.quests.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div style={{ fontSize:12, color: isWon ? 'var(--win3)' : isLost ? 'var(--loss3)' : 'var(--text3)' }}>
                      {i + 1}. {q.name}
                    </div>
                    <div style={{ flexShrink:0, marginLeft:8 }}>
                      {isWon  && <span className="badge badge-win"  style={{ fontSize:10 }}>Won</span>}
                      {isLost && <span className="badge badge-loss" style={{ fontSize:10 }}>Lost</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
