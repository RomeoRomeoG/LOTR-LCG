import { useState, useEffect, useCallback } from 'react'
import { BookOpen, BarChart2, Map, Swords, Scroll } from 'lucide-react'
import PlayLog from './pages/PlayLog.jsx'
import Stats from './pages/Stats.jsx'
import Quests from './pages/Quests.jsx'
import Campaigns from './pages/Campaigns.jsx'
import TaleOfYears from './pages/TaleOfYears.jsx'
import { DEFAULT_TOY } from './data.js'

// ── localStorage helpers ──────────────────────────────────────────────────────
function load(key, fallback) {
  try {
    const s = localStorage.getItem(key)
    return s ? JSON.parse(s) : fallback
  } catch { return fallback }
}

function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ── NAV CONFIG ────────────────────────────────────────────────────────────────
const NAV = [
  { id:'log',       label:'Play Log',   Icon:BookOpen },
  { id:'stats',     label:'Stats',      Icon:BarChart2 },
  { id:'quests',    label:'Quests',     Icon:Map },
  { id:'campaigns', label:'Campaigns',  Icon:Swords },
  { id:'toy',       label:'ToY',        Icon:Scroll },
]

export default function App() {
  const [tab, setTab] = useState('log')

  // Shared state
  const [plays,         setPlaysRaw]   = useState(() => load('lotr-plays',     []))
  const [questProgress, setQPRaw]      = useState(() => load('lotr-qp',        {}))
  const [toy,           setToyRaw]     = useState(() => load('lotr-toy',        DEFAULT_TOY))

  // Persisting setters
  const setPlays = useCallback(v => {
    const next = typeof v === 'function' ? v(plays) : v
    setPlaysRaw(next); save('lotr-plays', next)
  }, [plays])

  const setQP = useCallback(v => {
    const next = typeof v === 'function' ? v(questProgress) : v
    setQPRaw(next); save('lotr-qp', next)
  }, [questProgress])

  const setToy = useCallback(v => {
    const next = typeof v === 'function' ? v(toy) : v
    setToyRaw(next); save('lotr-toy', next)
  }, [toy])

  // Derived header stats
  const wins = plays.filter(p => p.result === 'Win').length
  const wr   = plays.length ? Math.round(wins / plays.length * 100) : null

  const PAGE_LABEL = {
    log:'Play Log', stats:'Statistics', quests:'Quest Tracker',
    campaigns:'Campaigns', toy:'Tale of Years',
  }

  return (
    <div className="app">
      {/* ── HEADER ── */}
      <div className="app-header">
        <div className="app-header-inner">
          <div>
            <div className="app-title">LOTR LCG</div>
            <div className="app-subtitle">{PAGE_LABEL[tab]}</div>
          </div>
          {wr !== null && (
            <div className="header-stat">
              <div className="num" style={{ color: wr >= 50 ? 'var(--win3)' : 'var(--loss3)' }}>
                {wr}%
              </div>
              <div className="lbl">{plays.length} plays</div>
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="content">
        {tab === 'log'       && <PlayLog plays={plays} setPlays={setPlays} />}
        {tab === 'stats'     && <Stats   plays={plays} />}
        {tab === 'quests'    && <Quests  plays={plays} questProgress={questProgress} setQP={setQP} />}
        {tab === 'campaigns' && <Campaigns plays={plays} />}
        {tab === 'toy'       && <TaleOfYears toy={toy} setToy={setToy} />}
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav className="nav">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-btn ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon strokeWidth={tab === id ? 2 : 1.5} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
