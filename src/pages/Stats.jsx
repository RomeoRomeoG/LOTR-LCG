import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'

const GOLD   = '#C4922A'
const GREEN  = '#3A8A3A'
const RED    = '#AA4444'
const DIM    = '#6A5E50'
const SURF   = '#1C1712'
const BORDER = '#3A3020'
const TEXT   = '#D4C0A0'

const TT_STYLE = {
  background: SURF,
  border: `1px solid ${BORDER}`,
  color: TEXT,
  fontSize: 12,
  borderRadius: 5,
}

export default function Stats({ plays }) {
  if (!plays.length) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">No data yet</div>
          <div className="empty-msg">Record some plays to see your statistics here.</div>
        </div>
      </div>
    )
  }

  const wins      = plays.filter(p => p.result === 'Win').length
  const losses    = plays.filter(p => p.result === 'Loss').length
  const abandoned = plays.filter(p => p.result === 'Abandoned').length
  const wr        = Math.round(wins / plays.length * 100)
  const totalVP   = plays.reduce((s, p) => s + (p.vp || 0), 0)
  const avgVP     = plays.length ? Math.round(totalVP / plays.length) : 0
  const avgThreat = plays.length
    ? Math.round(plays.reduce((s, p) => s + (p.threatEnd || 0), 0) / plays.length)
    : 0

  // Result split pie
  const pieData = [
    { name: 'Wins',   value: wins,   color: GREEN },
    { name: 'Losses', value: losses, color: RED },
  ].filter(d => d.value > 0)

  // Plays by month
  const monthMap = {}
  plays.forEach(p => {
    const m = p.date ? p.date.slice(0, 7) : 'Unknown'
    monthMap[m] = (monthMap[m] || 0) + 1
  })
  const monthData = Object.entries(monthMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([m, c]) => ({ month: m.slice(5), plays: c }))

  // By cycle
  const cycleMap = {}
  plays.forEach(p => {
    if (!p.cycle) return
    const short = p.cycle.split(' & ')[0].replace('ALeP — ', '').replace(' Saga','').slice(0,18)
    if (!cycleMap[short]) cycleMap[short] = { plays: 0, wins: 0 }
    cycleMap[short].plays++
    if (p.result === 'Win') cycleMap[short].wins++
  })
  const cycleData = Object.entries(cycleMap)
    .map(([cycle, d]) => ({ cycle, plays: d.plays, wr: Math.round(d.wins / d.plays * 100) }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 8)

  // Difficulty vs win rate
  const diffBands = { Easy: { wins:0, total:0 }, Medium:{ wins:0, total:0 }, Hard:{ wins:0, total:0 }, Brutal:{ wins:0, total:0 } }
  plays.forEach(p => {
    const d = p.diff || 0
    const band = d < 5 ? 'Easy' : d < 7 ? 'Medium' : d < 8.5 ? 'Hard' : 'Brutal'
    diffBands[band].total++
    if (p.result === 'Win') diffBands[band].wins++
  })
  const diffData = Object.entries(diffBands)
    .filter(([, d]) => d.total > 0)
    .map(([name, d]) => ({ name, wr: Math.round(d.wins / d.total * 100), plays: d.total }))

  return (
    <div className="page">
      {/* Summary chips */}
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
          <div className="num" style={{ color: 'var(--gold2)' }}>{totalVP}</div>
          <div className="lbl">Total VP</div>
        </div>
        <div className="stat-chip">
          <div className="num" style={{ color: 'var(--text2)' }}>{avgThreat}</div>
          <div className="lbl">Avg Final Threat</div>
        </div>
      </div>

      {/* Result split */}
      {pieData.length > 0 && (
        <div className="card">
          <div className="section-title">Result Split</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                innerRadius={40} outerRadius={65}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={{ stroke: DIM }}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={TT_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Plays by month */}
      {monthData.length > 1 && (
        <div className="card">
          <div className="section-title">Plays by Month</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={monthData} margin={{ top:5, right:5, left:-20, bottom:0 }}>
              <XAxis dataKey="month" tick={{ fill:DIM, fontSize:11 }} />
              <YAxis tick={{ fill:DIM, fontSize:11 }} allowDecimals={false} />
              <Tooltip contentStyle={TT_STYLE} />
              <Bar dataKey="plays" fill={GOLD} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Win rate by difficulty */}
      {diffData.length > 0 && (
        <div className="card">
          <div className="section-title">Win Rate by Difficulty</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={diffData} margin={{ top:5, right:5, left:-20, bottom:0 }}>
              <XAxis dataKey="name" tick={{ fill:DIM, fontSize:11 }} />
              <YAxis tick={{ fill:DIM, fontSize:11 }} unit="%" domain={[0,100]} />
              <Tooltip contentStyle={TT_STYLE} formatter={v => `${v}%`} />
              <Bar dataKey="wr" fill={GREEN} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* By cycle */}
      {cycleData.length > 0 && (
        <div className="card">
          <div className="section-title">By Cycle</div>
          {cycleData.map(c => (
            <div
              key={c.cycle}
              style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'6px 0', borderBottom:'1px solid var(--border)',
              }}
            >
              <div style={{ fontSize:13, color:'var(--text2)', flex:1 }}>{c.cycle}</div>
              <div style={{ display:'flex', gap:10, fontSize:12, flexShrink:0 }}>
                <span style={{ color:'var(--text3)' }}>{c.plays}p</span>
                <span style={{ color: c.wr >= 50 ? 'var(--win3)' : 'var(--loss3)', fontFamily:'Space Mono,monospace', fontWeight:700 }}>
                  {c.wr}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
