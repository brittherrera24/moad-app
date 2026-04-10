import { useState, useRef, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './layout/Sidebar'
import Header from './layout/Header'
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import Calendar from './pages/Calendar'
import Health from './pages/Health'
import Fitness from './pages/Fitness'
import Meals from './pages/Meals'
import Finance from './pages/Finance'
import Knitting from './pages/Knitting'
import Household from './pages/Household'
import Achievements from './pages/Achievements'
// Empty task structure; real data loads from Supabase on mount
const EMPTY_TASKS = {
  today: [], week: [], nextweek: [], backlog: [],
  waiting: [], delegate: [], completed: [],
}
import { loadTasks, saveTasks, loadEvents, saveEvents } from './lib/supabase'
import * as gcal from './lib/googleCalendar'

const FONT = "'Plus Jakarta Sans', -apple-system, sans-serif"
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
const TODAY = todayStr()

const PEOPLE = [
  { key:'brittani', label:'Britt', color:'#A873EF', bg:'#EBDBFC', textColor:'#A873EF' },
  { key:'chris',    label:'Chris', color:'#FEA877', bg:'#FEF0DC', textColor:'#B85A00' },
  { key:'liam',     label:'Liam',  color:'#94F2DB', bg:'#D4F8EE', textColor:'#1A7A60' },
  { key:'ethan',    label:'Ethan', color:'#FF7776', bg:'#FFE8E8', textColor:'#CC2020' },
]

const C = {
  border:'rgba(168,115,239,0.12)', textPrimary:'#2D1F4A',
  textMuted:'#C0BACC', brightLav:'#A873EF', bg:'#F9FAFE',
}
const T = {
  heading:  { fontSize:'20px', fontWeight:800 },
  body:     { fontSize:'13px', fontWeight:500 },
  bodySm:   { fontSize:'12px', fontWeight:500 },
  label:    { fontSize:'10px', fontWeight:700 },
}

// ── ADD EVENT POPUP — lives in App so it works from any page ─────────────────
function AddEventPopup({ onClose, onAdd }) {
  const [title,  setTitle]  = useState('')
  const [date,   setDate]   = useState(TODAY)
  const [start,  setStart]  = useState('09:00')
  const [end,    setEnd]    = useState('10:00')
  const [people, setPeople] = useState(['brittani'])
  const inputRef = useRef()

  useEffect(()=>{ setTimeout(()=>inputRef.current?.focus(), 50) }, [])

  function togglePerson(key) {
    setPeople(prev=>prev.includes(key)?(prev.length>1?prev.filter(k=>k!==key):prev):[...prev,key])
  }

  function submit() {
    if (!title.trim()) return
    const s = parseInt(start.split(':')[0]) + parseInt(start.split(':')[1])/60
    const e = parseInt(end.split(':')[0])   + parseInt(end.split(':')[1])/60
    people.forEach(personKey=>{
      const p = PEOPLE.find(p=>p.key===personKey)
      onAdd({ id:Date.now()+Math.random(), title:title.trim(), person:personKey, date, start:s, end:e, bg:p.bg, textColor:p.textColor })
    })
    onClose()
  }

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}}
      style={{position:'fixed',inset:0,background:'rgba(45,32,74,0.45)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:FONT}}>
      <div style={{background:'#fff',borderRadius:'18px',padding:'28px',width:'440px',maxWidth:'92vw',display:'flex',flexDirection:'column',gap:'18px',boxShadow:'0 24px 64px rgba(45,32,74,0.28)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{...T.heading,color:C.textPrimary}}>Add Event</span>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:'24px',color:C.textMuted,cursor:'pointer',lineHeight:1}}>{'\u00D7'}</button>
        </div>
        <input ref={inputRef} value={title} onChange={e=>setTitle(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter')submit();if(e.key==='Escape')onClose()}}
          placeholder="Event title..."
          style={{width:'100%',padding:'12px 16px',borderRadius:'10px',border:`1.5px solid ${C.border}`,fontFamily:FONT,color:C.textPrimary,outline:'none',boxSizing:'border-box',fontSize:'14px',fontWeight:600}}
          onFocus={e=>e.currentTarget.style.borderColor=C.brightLav}
          onBlur={e=>e.currentTarget.style.borderColor=C.border}
        />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px'}}>
          {[
            {label:'Date', el:<input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{width:'100%',padding:'9px',borderRadius:'8px',border:`1.5px solid ${C.border}`,fontFamily:FONT,color:C.textPrimary,outline:'none',boxSizing:'border-box',fontSize:'12px'}}/>},
            {label:'Start',el:<input type="time" value={start} onChange={e=>setStart(e.target.value)} style={{width:'100%',padding:'9px',borderRadius:'8px',border:`1.5px solid ${C.border}`,fontFamily:FONT,color:C.textPrimary,outline:'none',boxSizing:'border-box',fontSize:'12px'}}/>},
            {label:'End',  el:<input type="time" value={end} onChange={e=>setEnd(e.target.value)} style={{width:'100%',padding:'9px',borderRadius:'8px',border:`1.5px solid ${C.border}`,fontFamily:FONT,color:C.textPrimary,outline:'none',boxSizing:'border-box',fontSize:'12px'}}/>},
          ].map(({label,el})=>(
            <div key={label}>
              <div style={{...T.label,color:C.textMuted,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'6px'}}>{label}</div>
              {el}
            </div>
          ))}
        </div>
        <div>
          <div style={{...T.label,color:C.textMuted,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'10px'}}>Who</div>
          <div style={{display:'flex',gap:'8px'}}>
            {PEOPLE.map(p=>{
              const on=people.includes(p.key)
              return (
                <button key={p.key} onClick={()=>togglePerson(p.key)}
                  style={{flex:1,padding:'9px 4px',borderRadius:'10px',border:`1.5px solid ${on?p.color:C.border}`,background:on?p.bg:C.bg,cursor:'pointer',color:on?p.textColor:C.textMuted,fontFamily:FONT,fontSize:'12px',fontWeight:700,transition:'all 0.12s'}}>
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>
        <div style={{display:'flex',gap:'10px'}}>
          <button onClick={submit} disabled={!title.trim()}
            style={{flex:1,padding:'13px',borderRadius:'10px',border:'none',background:title.trim()?'linear-gradient(135deg,#FF7776,#FEA877)':'#eee',color:title.trim()?'#fff':'#aaa',fontFamily:FONT,fontSize:'13px',fontWeight:700,cursor:title.trim()?'pointer':'default'}}>
            Add Event
          </button>
          <button onClick={onClose}
            style={{padding:'13px 20px',borderRadius:'10px',border:`1.5px solid ${C.border}`,background:'transparent',color:C.textMuted,fontFamily:FONT,fontSize:'13px',cursor:'pointer'}}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [taskData,     setTaskData]     = useState(EMPTY_TASKS)
  const [events,       setEvents]       = useState([])
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [dbReady,      setDbReady]      = useState(false)

  // ── Google Calendar connector state (app-level) ─────────────────────────
  const [gcalStatus, setGcalStatus] = useState(() => gcal.isConfigured() ? 'loading' : 'disconnected')
  const [gcalEvents, setGcalEvents] = useState([])

  // ── Load from Supabase on mount ──────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const [dbTasks, dbEvents] = await Promise.all([loadTasks(), loadEvents()])
        if (dbTasks) setTaskData(dbTasks)
        if (dbEvents && dbEvents.length > 0) setEvents(dbEvents)
      } catch (err) {
        console.error('Supabase init:', err)
      }
      setDbReady(true)
    }
    init()
  }, [])

  // ── Google Calendar: initialize connector on mount ──────────────────────
  useEffect(() => {
    if (!gcal.isConfigured()) return
    let cancelled = false
    gcal.init().then(ok => {
      if (!cancelled) setGcalStatus(ok ? 'connected' : 'disconnected')
    }).catch(err => {
      console.warn('Google Calendar init failed:', err)
      if (!cancelled) setGcalStatus('disconnected')
    })
    return () => { cancelled = true }
  }, [])

  // ── Google Calendar: fetch events whenever status is connected ──────────
  // Re-fetches can be triggered by calling refreshGcalEvents()
  const gcalFetchId = useRef(0)

  // Fetch gcal events when status becomes connected
  useEffect(() => {
    if (gcalStatus !== 'connected') return
    let cancelled = false

    async function fetchGcal() {
      const id = ++gcalFetchId.current
      const now = new Date()
      const timeMin = new Date(now)
      timeMin.setDate(now.getDate() - 14)
      const timeMax = new Date(now)
      timeMax.setDate(now.getDate() + 28)

      try {
        const fetched = await gcal.fetchEvents(timeMin, timeMax)
        if (!cancelled && id === gcalFetchId.current) {
          setGcalEvents(fetched)
        }
      } catch (err) {
        console.error('Google Calendar fetch error:', err)
      }
    }

    fetchGcal()
    return () => { cancelled = true }
  }, [gcalStatus])

  // Refresh function for manual re-fetch (e.g., from a refresh button)
  async function refreshGcalEvents() {
    if (gcalStatus !== 'connected') return
    const id = ++gcalFetchId.current
    const now = new Date()
    const timeMin = new Date(now)
    timeMin.setDate(now.getDate() - 14)
    const timeMax = new Date(now)
    timeMax.setDate(now.getDate() + 28)
    try {
      const fetched = await gcal.fetchEvents(timeMin, timeMax)
      if (id === gcalFetchId.current) setGcalEvents(fetched)
    } catch (err) {
      console.error('Google Calendar fetch error:', err)
    }
  }

  // Called from Connect button (first time only; user gesture required)
  async function connectGcal() {
    try {
      await gcal.connect()
      setGcalStatus('connected')
    } catch (err) {
      console.warn('Google Calendar: connect failed or declined', err)
    }
  }

  async function disconnectGcal() {
    await gcal.disconnect()
    setGcalStatus('disconnected')
    setGcalEvents([])
  }

  // ── Sync tasks to Supabase on change (after initial load) ────────────────
  const taskSaveTimer = useRef(null)
  useEffect(() => {
    if (!dbReady) return
    clearTimeout(taskSaveTimer.current)
    taskSaveTimer.current = setTimeout(() => {
      saveTasks(taskData).catch(err => console.error('saveTasks:', err))
    }, 500)
    return () => clearTimeout(taskSaveTimer.current)
  }, [taskData, dbReady])

  // ── Sync events to Supabase on change (after initial load) ───────────────
  const eventSaveTimer = useRef(null)
  useEffect(() => {
    if (!dbReady) return
    const localEvents = events.filter(e => !String(e.id).startsWith('gcal-'))
    clearTimeout(eventSaveTimer.current)
    eventSaveTimer.current = setTimeout(() => {
      saveEvents(localEvents).catch(err => console.error('saveEvents:', err))
    }, 500)
    return () => clearTimeout(eventSaveTimer.current)
  }, [events, dbReady])

  function deleteEvent(id) {
    setEvents(prev=>prev.filter(e=>e.id!==id))
  }

  function updateEvent(updated) {
    setEvents(prev=>prev.map(e=>e.id===updated.id?updated:e))
  }

  // Connectors object for any page that needs it (Home, Calendar, future settings)
  const connectors = {
    gcal: {
      status: gcalStatus,
      events: gcalEvents,
      connect: connectGcal,
      disconnect: disconnectGcal,
      refresh: refreshGcalEvents,
    },
  }

  return (
    <BrowserRouter>
      <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'var(--surface-bg)',fontFamily:'var(--font-sans)'}}>
        <Sidebar />
        <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
          <Header onAddCalendarEvent={()=>setShowAddEvent(true)} />
          <main style={{flex:1,overflowY:'auto'}}>
            <Routes>
              <Route path="/"             element={<Home         taskData={taskData} connectors={connectors} />} />
              <Route path="/tasks"        element={<Tasks        taskData={taskData} setTaskData={setTaskData} />} />
              <Route path="/calendar"     element={<Calendar     taskData={taskData} setTaskData={setTaskData} customEvents={events} onAddEvent={()=>setShowAddEvent(true)} onDeleteEvent={deleteEvent} onUpdateEvent={updateEvent} connectors={connectors} />} />
              <Route path="/health"       element={<Health />} />
              <Route path="/fitness"      element={<Fitness />} />
              <Route path="/meals"        element={<Meals />} />
              <Route path="/finance"      element={<Finance />} />
              <Route path="/knitting"     element={<Knitting />} />
              <Route path="/household"    element={<Household />} />
              <Route path="/achievements" element={<Achievements />} />
            </Routes>
          </main>
        </div>
      </div>

      {/* Global popups */}
      {showAddEvent && (
        <AddEventPopup
          onClose={()=>setShowAddEvent(false)}
          onAdd={ev=>{ setEvents(prev=>[...prev,ev]); setShowAddEvent(false) }}
        />
      )}
    </BrowserRouter>
  )
}

export default App
