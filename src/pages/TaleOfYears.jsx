import { useState } from 'react'
import { Plus, X, Minus } from 'lucide-react'
import { TOY_QUESTS, QUEST_MAP, diffClass, uid } from '../data.js'

const SUBTABS = [
  { id:'dash',    label:'Dashboard' },
  { id:'heroes',  label:'Heroes' },
  { id:'xp',      label:'XP' },
  { id:'dead',    label:'Dead Pile' },
  { id:'pool',    label:'Campaign Pool' },
  { id:'log',     label:'Quest Log' },
]

const XP_SPEND_RULES = [
  { phase:'SETUP',      cost:'2',      effect:'Add 1 resource to a hero\'s resource pool' },
  { phase:'SETUP',      cost:'2',      effect:'Allow a player to draw 1 card' },
  { phase:'SETUP',      cost:'2',      effect:'Lower starting threat by 1 (this quest only)' },
  { phase:'SETUP',      cost:'3',      effect:'Partial mulligan (set aside cards, draw replacements, shuffle back)' },
  { phase:'SETUP',      cost:'3',      effect:'Look at the first card of the encounter deck' },
  { phase:'SETUP',      cost:'4',      effect:'Give a hero +1 WP / +1 ATK / +1 DEF until end of game' },
  { phase:'RESOLUTION', cost:'1',      effect:'Heal 1 damage on a hero' },
  { phase:'RESOLUTION', cost:'2',      effect:'Remove 1 Condition treachery attachment from a hero' },
  { phase:'RESOLUTION', cost:'X',      effect:'Retrieve ally or attachment from Dead Pile (X = printed cost)' },
  { phase:'RESOLUTION', cost:'X',      effect:'Retrieve Fallen Hero from Dead Pile (X = threat cost)' },
  { phase:'RESOLUTION', cost:'4',      effect:'Add a boon to Campaign Pool (+1 cumulative per permanent boon after first)' },
  { phase:'RESOLUTION', cost:'7',      effect:'Remove a burden from Campaign Pool (Nazgûl cannot be removed)' },
  { phase:'RESOLUTION', cost:'10+cost',effect:'Make Title/Artifact a Permanent Boon (+1 cumulative per permanent boon)' },
]

const HAVENS = [
  'Hobbiton','Rivendell','Minas Tirith','Annúminas','Grey Havens',
  'Dale','Erebor','Edoras','Rhosgobel',"Beorn's Hall","Hrogar's Hill",
  'Mithlond','Dol-Amroth','Weathertop','The Blue Mountains',
  'Henneth Annûn','Fangorn',"Helm's Deep","Thranduil's Hall","The Eagle's Eyrie",
]

const PRESENCES = [
  'Barad-Dûr','Dol Guldur','Mount Gundabad','Umbar',
  'Minas Morgul','Carn Dûm','Orthanc','Goblin-town',
]

export default function TaleOfYears({ toy, setToy }) {
  const [sub,       setSub]      = useState('dash')
  // Modals
  const [spendOpen, setSpendOpen]  = useState(false)
  const [deadOpen,  setDeadOpen]   = useState(false)
  const [boonOpen,  setBoonOpen]   = useState(false)
  const [heroOpen,  setHeroOpen]   = useState(null)
  // Forms
  const [spendForm, setSpendForm]  = useState({ phase:'SETUP', effect:'', amount:1 })
  const [deadForm,  setDeadForm]   = useState({ name:'', type:'Ally', cost:1 })
  const [boonForm,  setBoonForm]   = useState({ name:'', type:'Boon', addedAt:'' })
  const [heroForm,  setHeroForm]   = useState({})
  // Quest log filter
  const [qFilter,   setQFilter]    = useState('all')

  const upd = fn => setToy(prev => fn(prev))

  // ── XP ──────────────────────────────────────────────────────────────────────
  const gainXP = n => upd(t => ({ ...t, xpPool: (t.xpPool || 0) + n }))

  const spendXP = () => {
    upd(t => ({
      ...t,
      xpPool: Math.max(0, (t.xpPool || 0) - spendForm.amount),
      xpLog: [
        { id:uid(), ...spendForm, date:new Date().toLocaleDateString('en-AU') },
        ...(t.xpLog || []),
      ],
    }))
    setSpendOpen(false)
    setSpendForm({ phase:'SETUP', effect:'', amount:1 })
  }

  // ── HEROES ──────────────────────────────────────────────────────────────────
  const addDmg     = (id, n) => upd(t => ({
    ...t, heroes: t.heroes.map(h => h.id === id
      ? { ...h, damage: Math.max(0, Math.min(h.maxHp, (h.damage||0) + n)) }
      : h),
  }))
  const addPenalty = (id, n) => upd(t => ({
    ...t, heroes: t.heroes.map(h => h.id === id
      ? { ...h, penalty: Math.max(0, (h.penalty||0) + n) }
      : h),
  }))
  const saveHero = () => {
    upd(t => ({ ...t, heroes: t.heroes.map(h => h.id === heroOpen ? { ...heroForm } : h) }))
    setHeroOpen(null)
  }

  // ── DEAD PILE ───────────────────────────────────────────────────────────────
  const addDead  = () => {
    upd(t => ({ ...t, deadPile: [{ ...deadForm, id:uid() }, ...(t.deadPile||[])] }))
    setDeadOpen(false)
    setDeadForm({ name:'', type:'Ally', cost:1 })
  }
  const rmDead   = id => upd(t => ({ ...t, deadPile: (t.deadPile||[]).filter(d => d.id !== id) }))

  // ── CAMPAIGN POOL ────────────────────────────────────────────────────────────
  const addToPool = () => {
    const key = boonForm.type === 'Boon' ? 'boons' : 'burdens'
    upd(t => ({ ...t, [key]: [{ ...boonForm, id:uid() }, ...(t[key]||[])] }))
    setBoonOpen(false)
    setBoonForm({ name:'', type:'Boon', addedAt:'' })
  }
  const rmPool = (type, id) => {
    const key = type === 'Boon' ? 'boons' : 'burdens'
    upd(t => ({ ...t, [key]: (t[key]||[]).filter(b => b.id !== id) }))
  }

  // ── QUEST LOG ────────────────────────────────────────────────────────────────
  const markQuest = (id, result) => upd(t => ({
    ...t, questResults: { ...(t.questResults||{}), [id]: result === t.questResults?.[id] ? null : result }
  }))

  // ─────────────────────────────────────────────────────────────────────────────
  const totalThreat = (toy.heroes||[]).reduce((s,h) => s + (h.threatCost||0) + (h.penalty||0), 0)
  const toyDone     = Object.values(toy.questResults||{}).filter(Boolean).length

  // ── RENDER SUB-SECTIONS ──────────────────────────────────────────────────────

  const Dashboard = () => (
    <div>
      {/* XP Pool */}
      <div className="xp-pool">
        <div className="xp-num">{toy.xpPool ?? 2}</div>
        <div className="xp-label">Experience Points Available</div>
        <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:12 }}>
          {[1,2,5].map(n => (
            <button key={n} className="btn btn-outline btn-sm" onClick={() => gainXP(n)}>+{n}</button>
          ))}
          <button className="btn btn-gold btn-sm" onClick={() => setSpendOpen(true)}>Spend XP</button>
        </div>
      </div>

      {/* Campaign stats */}
      <div className="stats-row">
        <div className="stat-chip">
          <div className="num" style={{ color:'var(--text2)' }}>{totalThreat}</div>
          <div className="lbl">Starting Threat</div>
        </div>
        <div className="stat-chip">
          <div className="num" style={{ color:'var(--xp2)' }}>{toyDone}</div>
          <div className="lbl">Quests Played</div>
        </div>
      </div>
      <div className="stats-row">
        <div className="stat-chip">
          <div className="num" style={{ color:'var(--dead2)' }}>{(toy.deadPile||[]).length}</div>
          <div className="lbl">Dead Pile</div>
        </div>
        <div className="stat-chip">
          <div className="num" style={{ color:'var(--loss3)' }}>{(toy.burdens||[]).length}</div>
          <div className="lbl">Burdens</div>
        </div>
      </div>

      {/* Haven & Presence */}
      <div className="card">
        <div className="section-title">Haven & Presence</div>
        <div className="grid-2">
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Haven</label>
            <select
              className="form-select"
              value={toy.haven || 'Hobbiton'}
              onChange={e => upd(t => ({ ...t, haven:e.target.value }))}
            >
              {HAVENS.map(h => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Presence</label>
            <select
              className="form-select"
              value={toy.presence || 'Dol Guldur'}
              onChange={e => upd(t => ({ ...t, presence:e.target.value }))}
            >
              {PRESENCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Key rules reminder */}
      <div className="card" style={{ background:'rgba(26,48,80,0.2)', borderColor:'var(--xp2)' }}>
        <div className="section-title">Key Rules</div>
        {[
          'Threat RESETS each quest (+ permanent penalties from fallen heroes)',
          'Damage PERSISTS between quests',
          'Condition attachments PERSIST between quests',
          'XP can be saved — no cap on unspent XP',
          'Saga resets ALL variables when you reach A Shadow of the Past',
        ].map((r, i) => (
          <div key={i} style={{ fontSize:12, color:'var(--text3)', padding:'4px 0', borderBottom: i<4 ? '1px solid var(--border)' : 'none' }}>
            · {r}
          </div>
        ))}
      </div>
    </div>
  )

  const Heroes = () => (
    <div>
      {(toy.heroes||[]).map(h => {
        const dmg    = h.damage || 0
        const maxHp  = h.maxHp || 5
        const hpPct  = Math.max(0, (maxHp - dmg) / maxHp * 100)
        const hpCol  = hpPct > 60 ? 'var(--win2)' : hpPct > 30 ? 'var(--gold2)' : 'var(--loss2)'
        return (
          <div key={h.id} className="hero-card">
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <div>
                <div className="hero-name">{h.name}</div>
                <div style={{ display:'flex', gap:6, marginTop:3, flexWrap:'wrap' }}>
                  <span className="badge badge-gold">{h.sphere}</span>
                  <span style={{ fontSize:11, color:'var(--text3)' }}>
                    {h.threatCost}+{h.penalty}={(h.threatCost||0)+(h.penalty||0)} threat
                  </span>
                </div>
              </div>
              <button
                className="btn btn-outline btn-xs"
                onClick={() => { setHeroForm({ ...h }); setHeroOpen(h.id) }}
              >
                Edit
              </button>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text3)', marginBottom:4 }}>
              <span>
                Damage: <span style={{ color:'var(--loss3)', fontWeight:700 }}>{dmg}</span> / {maxHp} HP
              </span>
              <span style={{ color:hpCol }}>{Math.round(hpPct)}% HP</span>
            </div>

            <div className="hp-bar">
              <div className="hp-fill" style={{ width:`${hpPct}%`, background:hpCol }} />
            </div>

            {/* Damage controls */}
            <div className="dmg-controls">
              <button className="dmg-btn" onClick={() => addDmg(h.id, -1)}><Minus size={16}/></button>
              <span className="dmg-val" style={{ color:'var(--loss3)' }}>{dmg} dmg</span>
              <button className="dmg-btn" onClick={() => addDmg(h.id,  1)}><Plus  size={16}/></button>
              <div style={{ flex:1 }}/>
              <span style={{ fontSize:11, color:'var(--text3)' }}>Penalty:</span>
              <button className="dmg-btn" onClick={() => addPenalty(h.id, -1)}><Minus size={14}/></button>
              <span className="dmg-val" style={{ fontSize:15 }}>{h.penalty||0}</span>
              <button className="dmg-btn" onClick={() => addPenalty(h.id,  1)}><Plus  size={14}/></button>
            </div>

            {/* Boons on hero */}
            {(h.boons||[]).length > 0 && (
              <div style={{ marginTop:6, display:'flex', flexWrap:'wrap', gap:4 }}>
                {h.boons.map((b, i) => (
                  <span key={i} className="badge badge-teal">{b}</span>
                ))}
              </div>
            )}
            {/* Conditions on hero */}
            {(h.conditions||[]).length > 0 && (
              <div style={{ marginTop:4, display:'flex', flexWrap:'wrap', gap:4 }}>
                {h.conditions.map((c, i) => (
                  <span key={i} className="badge badge-dead">{c}</span>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Fallen hero rules */}
      <div className="card" style={{ marginTop:4 }}>
        <div className="section-title">Fallen Hero Rules</div>
        <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.7 }}>
          <div>· Hero in Dead Pile at quest end = Fallen Hero</div>
          <div>· Replacing = +1 permanent threat penalty (or add 1 random burden)</div>
          <div>· Swapping versions of same hero = no penalty</div>
          <div>· Removing a hero without replacing = no penalty</div>
          <div>· Retrieve via XP spend (cost = hero's threat cost)</div>
        </div>
      </div>

      {/* Edit hero modal */}
      {heroOpen && (
        <div className="modal-overlay" onClick={() => setHeroOpen(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              Edit Hero
              <button className="modal-close" onClick={() => setHeroOpen(null)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                className="form-input"
                value={heroForm.name || ''}
                onChange={e => setHeroForm(f => ({ ...f, name:e.target.value }))}
              />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Sphere</label>
                <select
                  className="form-select"
                  value={heroForm.sphere || 'Leadership'}
                  onChange={e => setHeroForm(f => ({ ...f, sphere:e.target.value }))}
                >
                  {['Leadership','Tactics','Spirit','Lore','Fellowship'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Threat Cost</label>
                <input type="number" className="form-input" value={heroForm.threatCost||0}
                  onChange={e => setHeroForm(f => ({ ...f, threatCost:+e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Max HP</label>
                <input type="number" className="form-input" value={heroForm.maxHp||5}
                  onChange={e => setHeroForm(f => ({ ...f, maxHp:+e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Current Damage</label>
                <input type="number" className="form-input" value={heroForm.damage||0}
                  onChange={e => setHeroForm(f => ({ ...f, damage:+e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Permanent Boons (comma separated)</label>
              <input className="form-input"
                value={(heroForm.boons||[]).join(', ')}
                onChange={e => setHeroForm(f => ({ ...f, boons: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) }))}
                placeholder="Wormsbane, Sting…"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Condition Attachments (comma separated)</label>
              <input className="form-input"
                value={(heroForm.conditions||[]).join(', ')}
                onChange={e => setHeroForm(f => ({ ...f, conditions: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) }))}
                placeholder="Wounded, Poisoned…"
              />
            </div>
            <button className="btn btn-gold btn-block" onClick={saveHero}>Save Hero</button>
          </div>
        </div>
      )}
    </div>
  )

  const XPTracker = () => (
    <div>
      <div className="xp-pool" style={{ marginBottom:14 }}>
        <div className="xp-num">{toy.xpPool ?? 2}</div>
        <div className="xp-label">XP Pool — can be saved across quests</div>
        <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:12 }}>
          {[1,2,3,5,10].map(n => (
            <button key={n} className="btn btn-outline btn-sm" onClick={() => gainXP(n)}>+{n}</button>
          ))}
        </div>
        <button className="btn btn-gold btn-sm" style={{ marginTop:8, width:'100%' }} onClick={() => setSpendOpen(true)}>
          Spend XP
        </button>
      </div>

      {/* XP Earn reminder */}
      <div className="card" style={{ marginBottom:10 }}>
        <div className="section-title">XP Earning</div>
        <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.8 }}>
          <div>· +2 XP per player at campaign start</div>
          <div>· +1 XP per player per 10 VP (or part thereof) earned</div>
          <div>· +Flat XP per player from quest Resolution effect</div>
          <div>· +1 XP per player if Dead Pile has more cards than players</div>
          <div>· +1 XP per eliminated player (Setup spends only, next attempt)</div>
          <div>· +1 XP per player when playing Nightmare mode</div>
        </div>
      </div>

      {/* Spend reference */}
      <div className="card" style={{ marginBottom:10 }}>
        <div className="section-title">XP Spend Reference</div>
        {XP_SPEND_RULES.map((r, i) => (
          <div key={i} style={{ display:'flex', gap:8, padding:'5px 0', borderBottom:'1px solid var(--border)', alignItems:'flex-start' }}>
            <span className={`badge ${r.phase==='SETUP' ? 'badge-xp' : 'badge-dead'}`} style={{ fontSize:9, flexShrink:0, marginTop:2 }}>
              {r.phase}
            </span>
            <span style={{ fontSize:11, color:'var(--text3)', flex:1 }}>{r.cost} XP — {r.effect}</span>
          </div>
        ))}
      </div>

      {/* XP log */}
      <div className="section-title">XP Spend Log</div>
      {!(toy.xpLog||[]).length && (
        <div style={{ fontSize:13, color:'var(--text3)', padding:'8px 0' }}>No XP spent yet.</div>
      )}
      {(toy.xpLog||[]).map(x => (
        <div key={x.id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize:13, color:'var(--text2)' }}>{x.effect || 'XP Spend'}</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>{x.phase} · {x.date}</div>
          </div>
          <div className="mono" style={{ color:'var(--loss3)', fontWeight:700, fontSize:15, flexShrink:0, marginLeft:8 }}>
            -{x.amount} XP
          </div>
        </div>
      ))}
    </div>
  )

  const DeadPile = () => (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ fontSize:13, color:'var(--text3)', flex:1, lineHeight:1.5 }}>
          Unique cards destroyed or leaving play. Cannot replay same title while in pile.
        </div>
        <button className="btn btn-outline btn-sm" style={{ flexShrink:0, marginLeft:8 }} onClick={() => setDeadOpen(true)}>
          <Plus size={14}/> Add
        </button>
      </div>

      {!(toy.deadPile||[]).length && (
        <div className="empty-state" style={{ padding:'30px 0' }}>
          <div className="empty-icon" style={{ fontSize:28 }}>💀</div>
          <div className="empty-title">Dead Pile is Empty</div>
        </div>
      )}

      {(toy.deadPile||[]).map(d => (
        <div key={d.id} className="dead-entry">
          <div>
            <div className="dead-name">{d.name}</div>
            <div className="dead-type">{d.type} · Retrieve: {d.cost} XP</div>
          </div>
          <button className="btn btn-outline btn-xs" onClick={() => rmDead(d.id)}>Retrieved</button>
        </div>
      ))}

      <div className="card" style={{ marginTop:8, background:'rgba(58,26,58,0.2)', borderColor:'var(--dead2)' }}>
        <div className="section-title">Dead Pile Rules</div>
        {[
          'Unique (◌) hero or non-Istari ally destroyed → Dead Pile',
          'Unique (◌) player attachment leaving play → Dead Pile',
          'Cannot play cards with same title while in pile',
          'Cannot use discard pile retrieval effects (except Fortune or Fate / Houses of Healing)',
          'Burdens in Dead Pile can NEVER be retrieved',
          'Istari allies (Gandalf etc.) are exempt — not placed in Dead Pile',
          'Permanent Boons on dead hero go to Dead Pile with them',
        ].map((r,i) => (
          <div key={i} style={{ fontSize:11, color:'var(--text3)', padding:'3px 0', borderBottom: i<6?'1px solid var(--border)':'none' }}>
            · {r}
          </div>
        ))}
      </div>
    </div>
  )

  const CampaignPool = () => (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div className="section-title" style={{ marginBottom:0 }}>Boons</div>
        <button className="btn btn-outline btn-xs" onClick={() => { setBoonForm({name:'',type:'Boon',addedAt:''}); setBoonOpen(true) }}>
          <Plus size={12}/> Add
        </button>
      </div>
      {!(toy.boons||[]).length && (
        <div style={{ fontSize:12, color:'var(--text3)', padding:'6px 0 10px' }}>No boons yet.</div>
      )}
      {(toy.boons||[]).map(b => (
        <div key={b.id} className="pool-entry pool-boon">
          <div>
            <div style={{ fontWeight:600, color:'var(--win3)' }}>{b.name}</div>
            {b.addedAt && <div style={{ fontSize:11, color:'var(--text3)' }}>{b.addedAt}</div>}
          </div>
          <button className="btn btn-outline btn-xs" onClick={() => rmPool('Boon', b.id)}><X size={12}/></button>
        </div>
      ))}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6, marginTop:14 }}>
        <div className="section-title" style={{ marginBottom:0 }}>Burdens</div>
        <button className="btn btn-outline btn-xs" onClick={() => { setBoonForm({name:'',type:'Burden',addedAt:''}); setBoonOpen(true) }}>
          <Plus size={12}/> Add
        </button>
      </div>
      {!(toy.burdens||[]).length && (
        <div style={{ fontSize:12, color:'var(--text3)', padding:'6px 0 10px' }}>No burdens.</div>
      )}
      {(toy.burdens||[]).map(b => (
        <div key={b.id} className="pool-entry pool-burden">
          <div>
            <div style={{ fontWeight:600, color:'var(--loss3)' }}>{b.name}</div>
            {b.addedAt && <div style={{ fontSize:11, color:'var(--text3)' }}>{b.addedAt}</div>}
          </div>
          <button className="btn btn-outline btn-xs" onClick={() => rmPool('Burden', b.id)}><X size={12}/></button>
        </div>
      ))}
    </div>
  )

  const QuestLog = () => {
    const results = toy.questResults || {}
    let questNum = 0

    const visibleItems = TOY_QUESTS.filter(item => {
      if (item.type !== 'quest') return true
      const r = results[item.id]
      if (qFilter === 'pending' &&  r) return false
      if (qFilter === 'done'    && !r) return false
      return true
    })

    return (
      <div>
        <div className="tab-group">
          {['all','pending','done'].map(f => (
            <div key={f} className={`tab-item ${qFilter===f?'active':''}`} onClick={() => setQFilter(f)}>
              {f==='all'?'All':f==='pending'?'Pending':'Done'}
            </div>
          ))}
        </div>

        {visibleItems.map((item, idx) => {
          if (item.type === 'pause') {
            return (
              <div key={idx} className="toy-row pause" style={{ fontSize:11, color:'var(--xp3)', lineHeight:1.5 }}>
                ⏸ {item.text}
              </div>
            )
          }
          if (item.type === 'reset') {
            return (
              <div key={idx} className="toy-row reset" style={{ fontSize:11, color:'var(--loss3)', fontWeight:600, lineHeight:1.5 }}>
                {item.text}
              </div>
            )
          }

          questNum++
          const q = QUEST_MAP[item.id]
          if (!q) return null
          const r = results[item.id]

          return (
            <div key={`${idx}-${item.id}`} className={`toy-row ${r==='Win'?'won':r==='Loss'?'lost':''} ${item.campaignOnly?'camp':''}`}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:2 }}>
                    #{questNum} · {q.cycle.split(' & ')[0].replace('ALeP — ','').slice(0,26)}
                    {item.campaignOnly && <span className="badge badge-gold" style={{ fontSize:9, marginLeft:4 }}>Campaign</span>}
                  </div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{q.name}</div>
                  {item.note && (
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:2, fontStyle:'italic' }}>{item.note}</div>
                  )}
                </div>
                <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, marginLeft:8 }}>
                  <span className={`diff ${diffClass(q.diff)}`}>{q.diff}</span>
                  {item.xpFlat > 0 && (
                    <span className="badge badge-xp" style={{ fontSize:10 }}>+{item.xpFlat} XP/p</span>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button
                  className="btn btn-sm"
                  style={{
                    flex:1,
                    background: r==='Win' ? 'var(--win)' : 'var(--surf2)',
                    color: r==='Win' ? 'var(--win3)' : 'var(--text3)',
                    border: '1px solid',
                    borderColor: r==='Win' ? 'var(--win2)' : 'var(--border)',
                    fontFamily: 'Crimson Pro, serif',
                  }}
                  onClick={() => markQuest(item.id, 'Win')}
                >
                  Win
                </button>
                <button
                  className="btn btn-sm"
                  style={{
                    flex:1,
                    background: r==='Loss' ? 'var(--loss)' : 'var(--surf2)',
                    color: r==='Loss' ? 'var(--loss3)' : 'var(--text3)',
                    border: '1px solid',
                    borderColor: r==='Loss' ? 'var(--loss2)' : 'var(--border)',
                    fontFamily: 'Crimson Pro, serif',
                  }}
                  onClick={() => markQuest(item.id, 'Loss')}
                >
                  Loss
                </button>
                {r && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => markQuest(item.id, null)}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── MODALS ───────────────────────────────────────────────────────────────────

  const SpendModal = () => (
    <div className="modal-overlay" onClick={() => setSpendOpen(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          Spend XP
          <button className="modal-close" onClick={() => setSpendOpen(false)}>✕</button>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Phase</label>
            <select className="form-select" value={spendForm.phase}
              onChange={e => setSpendForm(f => ({ ...f, phase:e.target.value }))}>
              <option>SETUP</option>
              <option>RESOLUTION</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount</label>
            <input type="number" min="1" className="form-input" value={spendForm.amount}
              onChange={e => setSpendForm(f => ({ ...f, amount:+e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">What are you spending on?</label>
          <input className="form-input" placeholder="Heal 1 damage, retrieve ally, add boon…"
            value={spendForm.effect}
            onChange={e => setSpendForm(f => ({ ...f, effect:e.target.value }))} />
        </div>
        <div style={{ padding:10, background:'var(--surf2)', borderRadius:4, marginBottom:12, fontSize:12, color:'var(--text3)' }}>
          Pool: <strong style={{ color:'var(--xp2)' }}>{toy.xpPool ?? 0} XP</strong>
          {' '}→ After: <strong style={{ color:(toy.xpPool??0)-spendForm.amount<0?'var(--loss3)':'var(--xp2)' }}>
            {(toy.xpPool??0)-spendForm.amount} XP
          </strong>
        </div>
        <button
          className="btn btn-gold btn-block"
          disabled={(toy.xpPool??0) < spendForm.amount}
          onClick={spendXP}
        >
          Confirm Spend
        </button>
      </div>
    </div>
  )

  const DeadModal = () => (
    <div className="modal-overlay" onClick={() => setDeadOpen(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          Add to Dead Pile
          <button className="modal-close" onClick={() => setDeadOpen(false)}>✕</button>
        </div>
        <div className="form-group">
          <label className="form-label">Card Name</label>
          <input className="form-input" value={deadForm.name}
            onChange={e => setDeadForm(f => ({ ...f, name:e.target.value }))} />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={deadForm.type}
              onChange={e => setDeadForm(f => ({ ...f, type:e.target.value }))}>
              <option>Hero</option><option>Ally</option><option>Attachment</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Printed Cost</label>
            <input type="number" min="0" className="form-input" value={deadForm.cost}
              onChange={e => setDeadForm(f => ({ ...f, cost:+e.target.value }))} />
          </div>
        </div>
        <button className="btn btn-gold btn-block" onClick={addDead}>Add to Dead Pile</button>
      </div>
    </div>
  )

  const PoolModal = () => (
    <div className="modal-overlay" onClick={() => setBoonOpen(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          Add to Campaign Pool
          <button className="modal-close" onClick={() => setBoonOpen(false)}>✕</button>
        </div>
        <div className="form-group">
          <label className="form-label">Card Name</label>
          <input className="form-input" value={boonForm.name}
            onChange={e => setBoonForm(f => ({ ...f, name:e.target.value }))} />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={boonForm.type}
              onChange={e => setBoonForm(f => ({ ...f, type:e.target.value }))}>
              <option>Boon</option><option>Burden</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Added After Quest</label>
            <input className="form-input" placeholder="Quest name…" value={boonForm.addedAt}
              onChange={e => setBoonForm(f => ({ ...f, addedAt:e.target.value }))} />
          </div>
        </div>
        <button className="btn btn-gold btn-block" onClick={addToPool}>Add to Pool</button>
      </div>
    </div>
  )

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="page" style={{ paddingTop:8 }}>
      {/* Sub-tab bar */}
      <div className="subtabs">
        {SUBTABS.map(t => (
          <button key={t.id} className={`subtab ${sub===t.id?'active':''}`} onClick={() => setSub(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'dash'    && <Dashboard />}
      {sub === 'heroes'  && <Heroes />}
      {sub === 'xp'      && <XPTracker />}
      {sub === 'dead'    && <DeadPile />}
      {sub === 'pool'    && <CampaignPool />}
      {sub === 'log'     && <QuestLog />}

      {/* Modals */}
      {spendOpen && <SpendModal />}
      {deadOpen  && <DeadModal />}
      {boonOpen  && <PoolModal />}
    </div>
  )
}
