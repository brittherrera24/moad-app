import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// Inject responsive styles once — mirrors Tasks page widget pattern
const CAL_CSS = `
  .int-scroll { display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; background: #FFFFFF; border-radius: 16px; border: 1px solid rgba(168,115,239,0.12); box-shadow: 0 2px 12px rgba(100,60,180,0.08); padding: 4px 8px; }
  .int-scroll::-webkit-scrollbar { height: 0; }
  .int-snap { scroll-snap-align: start; flex: 0 0 100px; display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 10px 6px; border-radius: 10px; cursor: pointer; transition: background 0.15s; }
  .int-snap:hover { background: #F9FAFE; }
  .int-icon-wrap { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 2px 12px rgba(100,60,180,0.08); }
  .int-name { font-size: 10px; font-weight: 700; color: #2D1F4A; text-align: center; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
  .int-status { font-size: 9px; display: flex; align-items: center; gap: 3px; font-weight: 600; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
  .int-dot { width: 6px; height: 6px; border-radius: 50%; }
  @media (max-width: 500px) {
    .int-scroll { display: none; }
  }
`
if (typeof document !== 'undefined' && !document.getElementById('cal-responsive-css')) {
  const s = document.createElement('style')
  s.id = 'cal-responsive-css'
  s.textContent = CAL_CSS
  document.head.appendChild(s)
}

const FONT = "'Plus Jakarta Sans', -apple-system, sans-serif"

const T = {
  hero:      { fontSize:'28px', fontWeight:800 },
  heading:   { fontSize:'20px', fontWeight:800 },
  headingSm: { fontSize:'16px', fontWeight:700 },
  bodyMd:    { fontSize:'14px', fontWeight:600 },
  body:      { fontSize:'13px', fontWeight:500 },
  bodySm:    { fontSize:'12px', fontWeight:500 },
  caption:   { fontSize:'11px', fontWeight:600 },
  label:     { fontSize:'10px', fontWeight:700 },
  micro:     { fontSize:'9px',  fontWeight:700 },
}

const C = {
  bg:'#F9FAFE', card:'#FFFFFF',
  border:'rgba(168,115,239,0.12)',
  textPrimary:'#2D1F4A', textSecond:'#9793A0', textMuted:'#C0BACC',
  brightLav:'#A873EF', lavVeil:'#EBDBFC',
  shadowSm:'0 2px 12px rgba(100,60,180,0.08)',
  shadowMd:'0 6px 24px rgba(100,60,180,0.13)',
}

const PEOPLE = [
  { key:'brittani', label:'Britt', color:'#A873EF', bg:'#EBDBFC', textColor:'#A873EF', dotBg:'#A873EF', dotText:'#fff', initial:'B' },
  { key:'chris',    label:'Chris', color:'#FEA877', bg:'#FEF0DC', textColor:'#B85A00', dotBg:'#FEA877', dotText:'#fff', initial:'C' },
  { key:'liam',     label:'Liam',  color:'#94F2DB', bg:'#D4F8EE', textColor:'#1A7A60', dotBg:'#94F2DB', dotText:'#2D1F4A', initial:'L' },
  { key:'ethan',    label:'Ethan', color:'#FF7776', bg:'#FFE8E8', textColor:'#CC2020', dotBg:'#FF7776', dotText:'#fff', initial:'E' },
]

// No seed events; all calendar events come from Supabase or Google Calendar

// Generate dinner plan for the current week (placeholder until wired to Supabase)
function buildWeekDinners() {
  const now = new Date()
  const sun = new Date(now)
  sun.setDate(now.getDate() - now.getDay())
  const meals = [
    { meal:'Crockpot Chili',      people:['brittani','chris','liam','ethan'] },
    { meal:'Taco Tuesday',        people:['brittani','chris','liam','ethan'] },
    { meal:'Pasta Night',         people:['brittani','chris','liam','ethan'] },
    { meal:'Grilled Chicken',     people:['brittani','chris','liam'] },
    { meal:'Pizza Friday',        people:['brittani','chris','liam','ethan'] },
    { meal:'Burgers',             people:['brittani','chris','liam','ethan'] },
    { meal:'Leftovers',           people:['brittani','liam'] },
  ]
  const dinners = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(sun)
    d.setDate(sun.getDate() + i)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    dinners[key] = meals[i]
  }
  return dinners
}

const INITIAL_DINNERS = buildWeekDinners()

const SUBTAG_COLORS = {
  Finance:       { bg:'#D6EEC9', color:'#2A6B40' },
  Household:     { bg:'#FEF0DC', color:'#B85A00' },
  Hobbies:       { bg:'#D4F8EE', color:'#1A7A60' },
  Kids:          { bg:'#D4F8EE', color:'#1A7A60' },
  Family:        { bg:'#D4F8EE', color:'#1A7A60' },
  'Dev Lessons': { bg:'#EBDBFC', color:'#A873EF' },
  Travel:        { bg:'#D4F8EE', color:'#1A7A60' },
  Miscellaneous: { bg:'#F0EDF5', color:'#9793A0' },
}

const HOURS  = Array.from({ length:17 }, (_,i) => i+6)
const HOUR_H = 34

// ── Date helpers (all dynamic, no hardcoded dates) ───────────────────────────
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const TODAY = dateKey(new Date())

function fmtHour(h) {
  if (h===12) return '12pm'
  if (h===0||h===24) return '12am'
  return h<12 ? `${h}am` : `${h-12}pm`
}

function getWeekDates(offset=0) {
  const now = new Date()
  const sun = new Date(now)
  sun.setDate(now.getDate() - now.getDay() + offset * 7)
  return Array.from({length:7}, (_, i) => {
    const d = new Date(sun)
    d.setDate(sun.getDate() + i)
    return d
  })
}

function layoutEvents(events) {
  if (!events.length) return []
  const sorted = [...events].sort((a,b)=>a.start-b.start)
  const cols = []
  const placed = []
  for (const ev of sorted) {
    let colIdx=-1
    for (let i=0;i<cols.length;i++) {
      if (cols[i][cols[i].length-1].end<=ev.start) { colIdx=i; break }
    }
    if (colIdx===-1) { colIdx=cols.length; cols.push([]) }
    cols[colIdx].push(ev)
    placed.push({ev,colIdx})
  }
  return placed.map(({ev,colIdx})=>{
    let maxCol=colIdx
    for (const {ev:other,colIdx:otherCol} of placed) {
      if (other.id!==ev.id && other.start<ev.end && other.end>ev.start) maxCol=Math.max(maxCol,otherCol)
    }
    return {ev,colIdx,totalCols:maxCol+1}
  })
}

function getTagStyle(t) {
  if (t.client)  return {bg:'#FEF0DC',color:'#B85A00',label:t.client}
  if (t.subTag)  return {...(SUBTAG_COLORS[t.subTag]||{bg:'#EBDBFC',color:'#A873EF'}),label:t.subTag}
  if (t.category==='work') return {bg:'#EBDBFC',color:'#A873EF',label:'Internal'}
  return {bg:'#D6EEC9',color:'#2A6B40',label:'Personal'}
}

// ── Now line for time indicator ──────────────────────────────────────────────
function getNowHour() {
  const n = new Date()
  return n.getHours() + n.getMinutes() / 60
}

// ── MINI MONTH ───────────────────────────────────────────────────────────────
function MiniMonth({ selectedDate, onSelect }) {
  const today = new Date()
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const yr=view.getFullYear(), mo=view.getMonth()
  const cells=[...Array(new Date(yr,mo,1).getDay()).fill(null),...Array.from({length:new Date(yr,mo+1,0).getDate()},(_,i)=>i+1)]
  return (
    <div style={{background:C.card,borderRadius:'14px',border:`1px solid ${C.border}`,boxShadow:C.shadowSm,padding:'16px',fontFamily:FONT,flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
        <button onClick={()=>setView(new Date(yr,mo-1,1))} style={{background:'none',border:'none',cursor:'pointer',color:C.textSecond,fontSize:'18px',padding:'2px 6px',lineHeight:1}}>{'\u2039'}</button>
        <span style={{...T.caption,color:C.textPrimary}}>{view.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</span>
        <button onClick={()=>setView(new Date(yr,mo+1,1))} style={{background:'none',border:'none',cursor:'pointer',color:C.textSecond,fontSize:'18px',padding:'2px 6px',lineHeight:1}}>{'\u203A'}</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:'4px'}}>
        {['S','M','T','W','T','F','S'].map((d,i)=>(
          <div key={i} style={{textAlign:'center',...T.micro,color:C.textMuted,padding:'2px 0'}}>{d}</div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px'}}>
        {cells.map((day,i)=>{
          if(!day) return <div key={i}/>
          const d=new Date(yr,mo,day)
          const isTod=d.toDateString()===today.toDateString()
          const isSel=selectedDate&&d.toDateString()===selectedDate.toDateString()
          return (
            <div key={i} onClick={()=>onSelect(d)}
              style={{textAlign:'center',padding:'4px 1px',borderRadius:'6px',cursor:'pointer',background:isSel?C.brightLav:isTod?C.lavVeil:'transparent'}}
              onMouseEnter={e=>{if(!isSel&&!isTod)e.currentTarget.style.background=C.lavVeil}}
              onMouseLeave={e=>{if(!isSel&&!isTod)e.currentTarget.style.background='transparent'}}>
              <span style={{...T.caption,fontWeight:isTod||isSel?800:500,color:isSel?'#fff':isTod?C.brightLav:C.textPrimary}}>{day}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function Calendar({ taskData, setTaskData, customEvents, onAddEvent, onDeleteEvent, onUpdateEvent, connectors }) {
  const navigate=useNavigate()
  const [weekOffset,   setWeekOffset]   = useState(0)
  const [visible,      setVisible]      = useState(['brittani','chris','liam','ethan'])
  const [dinnerHome,   setDinnerHome]   = useState(INITIAL_DINNERS)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [editingEvent,  setEditingEvent]  = useState(null)
  const gridRef=useRef()

  // Google Calendar events come from App.jsx via connectors prop
  const gcalStatus = connectors?.gcal?.status || 'disconnected'
  const gcalEvents = connectors?.gcal?.events || []

  useEffect(()=>{
    if(gridRef.current) {
      const nowH = getNowHour()
      gridRef.current.scrollTop = (nowH - 6) * HOUR_H - 4
    }
  },[])

  const togglePerson=useCallback(key=>{
    setVisible(prev=>prev.includes(key)?(prev.length>1?prev.filter(k=>k!==key):prev):[...prev,key])
  },[])

  const toggleDinner=useCallback((dStr,personKey)=>{
    setDinnerHome(prev=>{
      const day=prev[dStr]; if(!day) return prev
      const eating=day.people.includes(personKey)
      return {...prev,[dStr]:{...day,people:eating?day.people.filter(p=>p!==personKey):[...day.people,personKey]}}
    })
  },[])

  function completeTask(taskId) {
    if(!setTaskData) return
    setTaskData(prev=>{
      const task=prev.today.find(t=>t.id===taskId)
      if(!task) return prev
      return {
        ...prev,
        today:prev.today.filter(t=>t.id!==taskId),
        completed:[{...task,completedAt:new Date().toISOString()},...(prev.completed||[])]
      }
    })
  }

  function openAdd() { if(onAddEvent) onAddEvent() }

  function saveEdit(ev) {
    if(onUpdateEvent) onUpdateEvent(ev)
    setEditingEvent(null)
    setSelectedEvent(null)
  }

  function deleteEv(id) {
    if(onDeleteEvent) onDeleteEvent(id)
    setSelectedEvent(null)
  }

  const weekDates=getWeekDates(weekOffset)
  const allEvents=[
    ...(customEvents||[]),
    ...gcalEvents,
  ]
  const nowTop=(getNowHour()-6)*HOUR_H

  const todayTasks=taskData?.today ?? []
  const sortedTasks=[
    ...todayTasks.filter(t=>t.category==='personal'),
    ...todayTasks.filter(t=>t.category!=='personal'),
  ]
  const agendaItems=sortedTasks.map(t=>{
    const ts=getTagStyle(t)
    return {id:t.id,est:t.est||'',title:t.title,tagLabel:ts.label,tagBg:ts.bg,tagColor:ts.color}
  })

  return (
    <div style={{fontFamily:FONT,background:C.bg,height:'100vh',padding:'20px 24px',display:'flex',flexDirection:'column',gap:'14px',boxSizing:'border-box',overflow:'hidden'}}>

      {/* Event detail popup */}
      {selectedEvent&&!editingEvent&&(
        <div onClick={()=>setSelectedEvent(null)}
          style={{position:'fixed',inset:0,background:'rgba(45,32,74,0.25)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div onClick={e=>e.stopPropagation()}
            style={{background:'#fff',borderRadius:'20px',padding:'0',width:'340px',boxShadow:'0 20px 60px rgba(45,32,74,0.22)',fontFamily:FONT,overflow:'hidden',border:`1px solid ${C.border}`}}>
            <div style={{background:PEOPLE.find(p=>p.key===selectedEvent.person)?.bg||C.lavVeil,padding:'20px 20px 16px',borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
                <div>
                  <div style={{...T.heading,color:C.textPrimary,marginBottom:'4px'}}>{selectedEvent.title}</div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <div style={{width:'8px',height:'8px',borderRadius:'50%',background:PEOPLE.find(p=>p.key===selectedEvent.person)?.color||C.brightLav}}/>
                    <span style={{...T.caption,color:C.textSecond}}>{PEOPLE.find(p=>p.key===selectedEvent.person)?.label}</span>
                    <span style={{...T.caption,color:C.textMuted}}>{'\u00B7'}</span>
                    <span style={{...T.caption,color:C.textSecond}}>{selectedEvent.date}</span>
                  </div>
                  <div style={{marginTop:'6px',display:'inline-flex',alignItems:'center',gap:'5px',background:'rgba(255,255,255,0.6)',borderRadius:'20px',padding:'4px 10px'}}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="#9793A0" strokeWidth="1.2"/><path d="M5.5 3v2.5l1.5 1.5" stroke="#9793A0" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    <span style={{...T.caption,color:C.textSecond,fontWeight:600}}>{fmtHour(selectedEvent.start)} {'\u2013'} {fmtHour(selectedEvent.end)}</span>
                  </div>
                </div>
                <button onClick={()=>setSelectedEvent(null)} style={{background:'rgba(255,255,255,0.6)',border:'none',borderRadius:'50%',width:'28px',height:'28px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:C.textMuted,fontSize:'16px',lineHeight:1,flexShrink:0}}>{'\u00D7'}</button>
              </div>
            </div>
            <div style={{padding:'14px 16px',display:'flex',gap:'8px'}}>
              <button onClick={()=>setEditingEvent({...selectedEvent})}
                style={{flex:1,padding:'10px 14px',borderRadius:'10px',border:`1.5px solid ${C.border}`,background:C.bg,color:C.textPrimary,fontFamily:FONT,...T.bodySm,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.background=C.lavVeil;e.currentTarget.style.borderColor=C.brightLav;e.currentTarget.style.color=C.brightLav}}
                onMouseLeave={e=>{e.currentTarget.style.background=C.bg;e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textPrimary}}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                Edit
              </button>
              <button onClick={()=>deleteEv(selectedEvent.id)}
                style={{flex:1,padding:'10px 14px',borderRadius:'10px',border:'none',background:'linear-gradient(135deg,#FF7776,#FEA877)',color:'#fff',fontFamily:FONT,...T.bodySm,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',boxShadow:'0 2px 8px rgba(255,119,118,0.35)',transition:'all 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 14px rgba(255,119,118,0.5)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='0 2px 8px rgba(255,119,118,0.35)'}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.7 7.5h6.6L11 4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit event form */}
      {editingEvent&&(
        <div onClick={()=>setEditingEvent(null)}
          style={{position:'fixed',inset:0,background:'rgba(45,32,74,0.35)',zIndex:600,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div onClick={e=>e.stopPropagation()}
            style={{background:'#fff',borderRadius:'18px',padding:'24px',width:'420px',maxWidth:'92vw',display:'flex',flexDirection:'column',gap:'14px',boxShadow:'0 24px 64px rgba(45,32,74,0.25)',fontFamily:FONT}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{...T.heading,color:C.textPrimary}}>Edit Event</span>
              <button onClick={()=>setEditingEvent(null)} style={{background:'none',border:'none',fontSize:'22px',color:C.textMuted,cursor:'pointer'}}>{'\u00D7'}</button>
            </div>
            <input value={editingEvent.title} onChange={e=>setEditingEvent(ev=>({...ev,title:e.target.value}))}
              style={{width:'100%',padding:'11px 14px',borderRadius:'10px',border:`1.5px solid ${C.border}`,fontFamily:FONT,color:C.textPrimary,outline:'none',boxSizing:'border-box',...T.bodyMd}}
              onFocus={e=>e.currentTarget.style.borderColor=C.brightLav}
              onBlur={e=>e.currentTarget.style.borderColor=C.border}
            />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px'}}>
              {[
                {label:'Date', val:editingEvent.date, type:'date', key:'date'},
                {label:'Start',val:`${String(Math.floor(editingEvent.start)).padStart(2,'0')}:${String(Math.round((editingEvent.start%1)*60)).padStart(2,'0')}`, type:'time', key:'start'},
                {label:'End',  val:`${String(Math.floor(editingEvent.end)).padStart(2,'0')}:${String(Math.round((editingEvent.end%1)*60)).padStart(2,'0')}`, type:'time', key:'end'},
              ].map(({label,val,type,key})=>(
                <div key={key}>
                  <div style={{...T.label,color:C.textMuted,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'5px'}}>{label}</div>
                  <input type={type} defaultValue={val}
                    onChange={e=>{
                      if(key==='date') setEditingEvent(ev=>({...ev,date:e.target.value}))
                      else {
                        const h=parseInt(e.target.value.split(':')[0])+parseInt(e.target.value.split(':')[1])/60
                        setEditingEvent(ev=>({...ev,[key]:h}))
                      }
                    }}
                    style={{width:'100%',padding:'8px',borderRadius:'8px',border:`1.5px solid ${C.border}`,fontFamily:FONT,color:C.textPrimary,outline:'none',boxSizing:'border-box',...T.bodySm}}/>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button
                onClick={()=>saveEdit(editingEvent)}
                style={{flex:1,padding:'11px',borderRadius:'10px',border:'none',background:'linear-gradient(135deg,#A873EF,#D39EF6)',color:'#fff',fontFamily:FONT,...T.body,fontWeight:700,cursor:'pointer',boxShadow:'0 2px 8px rgba(168,115,239,0.35)'}}>
                Save Changes
              </button>
              <button onClick={()=>setEditingEvent(null)}
                style={{padding:'11px 18px',borderRadius:'10px',border:`1.5px solid ${C.border}`,background:C.bg,color:C.textMuted,fontFamily:FONT,...T.body,cursor:'pointer'}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <div style={{display:'flex',alignItems:'center',gap:'12px',flexShrink:0}}>
        <button onClick={()=>setWeekOffset(0)}
          style={{padding:'8px 18px',borderRadius:'20px',border:'none',background:weekOffset===0?C.brightLav:C.card,color:weekOffset===0?'#fff':C.textSecond,fontFamily:FONT,...T.bodySm,fontWeight:700,cursor:'pointer',boxShadow:C.shadowSm}}>
          Today
        </button>
        {[[-1,'\u2039'],[1,'\u203A']].map(([d,lbl])=>(
          <button key={d} onClick={()=>setWeekOffset(w=>w+d)}
            style={{width:'34px',height:'34px',borderRadius:'50%',border:`1px solid ${C.border}`,background:C.card,cursor:'pointer',fontSize:'16px',color:C.textSecond,display:'flex',alignItems:'center',justifyContent:'center'}}
            onMouseEnter={e=>e.currentTarget.style.background=C.lavVeil}
            onMouseLeave={e=>e.currentTarget.style.background=C.card}>{lbl}</button>
        ))}
        <span style={{...T.headingSm,color:C.textPrimary}}>
          {weekDates[0].toLocaleDateString('en-US',{month:'long',day:'numeric'})} {'\u2013'} {weekDates[6].toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}
        </span>
        <button onClick={openAdd}
          style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',borderRadius:'20px',border:'none',background:'linear-gradient(135deg,#FF7776,#FEA877)',color:'#fff',fontFamily:FONT,...T.bodySm,fontWeight:700,cursor:'pointer',boxShadow:'0 2px 8px rgba(255,119,118,0.35)'}}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Add Event
        </button>
        <div style={{display:'flex',gap:'8px',marginLeft:'auto'}}>
          {PEOPLE.map(p=>{
            const on=visible.includes(p.key)
            return (
              <button key={p.key} onClick={()=>togglePerson(p.key)}
                style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 13px',borderRadius:'20px',border:`1.5px solid ${on?p.color:C.border}`,background:on?p.bg:C.card,cursor:'pointer',opacity:on?1:0.45,transition:'all 0.15s',fontFamily:FONT}}>
                <div style={{width:'8px',height:'8px',borderRadius:'50%',background:p.color,flexShrink:0}}/>
                <span style={{...T.bodySm,fontWeight:700,color:on?p.textColor:C.textMuted}}>{p.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main 3/4 + 1/4 */}
      <div style={{display:'flex',gap:'16px',alignItems:'flex-start',flex:1,minHeight:0}}>

        {/* Calendar column: card + connectors */}
        <div style={{flex:'0 0 74%',minWidth:0,display:'flex',flexDirection:'column',gap:'12px'}}>

        {/* Calendar card */}
        <div style={{background:C.card,borderRadius:'16px',border:`1px solid ${C.border}`,boxShadow:C.shadowSm,overflow:'hidden',display:'flex',flexDirection:'column'}}>

          {/* Day headers */}
          <div style={{display:'grid',gridTemplateColumns:'44px repeat(7,1fr)',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
            <div style={{borderRight:`1px solid ${C.border}`}}/>
            {weekDates.map((d,i)=>{
              const dStr=dateKey(d), isToday=dStr===TODAY
              return (
                <div key={i} onClick={openAdd}
                  style={{padding:'10px 2px',textAlign:'center',borderRight:i<6?`1px solid ${C.border}`:'none',cursor:'pointer',background:isToday?'rgba(168,115,239,0.04)':'transparent',position:'relative'}}
                  onMouseEnter={e=>{if(!isToday)e.currentTarget.style.background='rgba(168,115,239,0.04)'}}
                  onMouseLeave={e=>{if(!isToday)e.currentTarget.style.background='transparent'}}>
                  {isToday&&<div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:'linear-gradient(90deg,#FF7776,#FEA877)'}}/>}
                  <div style={{...T.label,color:isToday?C.brightLav:C.textMuted,textTransform:'uppercase',letterSpacing:'0.06em'}}>{d.toLocaleDateString('en-US',{weekday:'short'})}</div>
                  {isToday
                    ?<div style={{width:'32px',height:'32px',borderRadius:'50%',background:'linear-gradient(135deg,#FF7776,#FEA877)',display:'flex',alignItems:'center',justifyContent:'center',margin:'4px auto 0'}}>
                       <span style={{...T.headingSm,color:'#fff'}}>{d.getDate()}</span>
                     </div>
                    :<span style={{...T.headingSm,color:C.textPrimary,display:'block',marginTop:'4px'}}>{d.getDate()}</span>
                  }
                </div>
              )
            })}
          </div>

          {/* Time grid */}
          <div ref={gridRef} style={{overflowY:'auto',maxHeight:`${HOUR_H*13}px`}}>
            <div style={{display:'grid',gridTemplateColumns:'44px repeat(7,1fr)'}}>
              <div style={{borderRight:`1px solid ${C.border}`}}>
                {HOURS.map(h=>(
                  <div key={h} style={{height:`${HOUR_H}px`,display:'flex',alignItems:'flex-start',justifyContent:'flex-end',paddingRight:'8px',paddingTop:'4px',borderBottom:`1px solid rgba(45,32,64,0.04)`}}>
                    <span style={{...T.micro,color:C.textMuted}}>{fmtHour(h)}</span>
                  </div>
                ))}
              </div>
              {weekDates.map((d,di)=>{
                const dStr=dateKey(d), isToday=dStr===TODAY
                const laid=layoutEvents(allEvents.filter(e=>e.date===dStr&&visible.includes(e.person)))
                return (
                  <div key={di} style={{position:'relative',borderRight:di<6?`1px solid ${C.border}`:'none',background:isToday?'rgba(168,155,181,0.04)':'transparent'}}>
                    {HOURS.map(h=>(
                      <div key={h} onClick={openAdd}
                        style={{height:`${HOUR_H}px`,borderBottom:`1px solid rgba(45,32,64,0.04)`,cursor:'pointer'}}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(168,115,239,0.03)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}/>
                    ))}
                    <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,pointerEvents:'none'}}>
                      {laid.map(({ev,colIdx,totalCols})=>{
                        const p=PEOPLE.find(p=>p.key===ev.person)
                        const top=(ev.start-6)*HOUR_H
                        const height=Math.max((ev.end-ev.start)*HOUR_H-2,22)
                        const w=100/totalCols
                        return (
                          <div key={ev.id}
                            onClick={e=>{ e.stopPropagation(); setSelectedEvent(ev) }}
                            style={{position:'absolute',top:`${top}px`,left:`calc(${colIdx*w}% + 2px)`,width:`calc(${w}% - 4px)`,height:`${height}px`,background:p?.bg||'#EBDBFC',borderRadius:'6px',padding:'3px 6px',overflow:'hidden',cursor:'pointer',pointerEvents:'all',boxSizing:'border-box'}}>
                            <div style={{...T.caption,color:p?.textColor||C.brightLav,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',lineHeight:1.3}}>{ev.title}</div>
                            {height>32&&<div style={{...T.micro,color:p?.textColor,opacity:0.75,marginTop:'1px'}}>{fmtHour(ev.start)}{'\u2013'}{fmtHour(ev.end)}</div>}
                          </div>
                        )
                      })}
                    </div>
                    {isToday&&(
                      <div style={{position:'absolute',left:0,right:0,top:`${nowTop}px`,display:'flex',alignItems:'center',zIndex:10,pointerEvents:'none'}}>
                        <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#FF7776',marginLeft:'-4px',flexShrink:0}}/>
                        <div style={{flex:1,height:'1.5px',background:'#FF7776',opacity:0.8}}/>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dinner strip */}
          <div style={{display:'grid',gridTemplateColumns:'44px repeat(7,1fr)',borderTop:`1px solid ${C.border}`,flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',borderRight:`1px solid ${C.border}`,padding:'10px 4px'}}>
              <span style={{...T.micro,color:C.textMuted,writingMode:'vertical-rl',transform:'rotate(180deg)'}}>Dinner</span>
            </div>
            {weekDates.map((d,i)=>{
              const dStr=dateKey(d), dinner=dinnerHome[dStr], isToday=dStr===TODAY
              return (
                <div key={i} style={{padding:'8px 6px',borderRight:i<6?`1px solid rgba(45,32,64,0.06)`:'none'}}>
                  {dinner
                    ?<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px'}}>
                        <span style={{display:'block',textAlign:'center',...T.caption,color:isToday?'#fff':C.textPrimary,background:isToday?C.brightLav:'#EBDBFC',borderRadius:'20px',padding:'3px 8px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%',boxSizing:'border-box'}}>{dinner.meal}</span>
                        <div style={{display:'flex',flexWrap:'wrap',gap:'3px',width:'63px',justifyContent:'center'}}>
                          {PEOPLE.map(p=>{
                            const eating=dinner.people.includes(p.key)
                            return (
                              <div key={p.key} onClick={()=>toggleDinner(dStr,p.key)} title={p.label}
                                style={{width:'28px',height:'28px',minWidth:'28px',flex:'0 0 28px',borderRadius:'50%',background:eating?p.dotBg:'transparent',border:`2px solid ${eating?p.dotBg:C.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:800,color:eating?p.dotText:C.textMuted,cursor:'pointer',opacity:eating?1:0.35,transition:'all 0.15s'}}>
                                {p.initial}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    :<span style={{display:'block',textAlign:'center',...T.bodySm,color:C.textMuted,paddingTop:'8px'}}>{'\u2013'}</span>
                  }
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{padding:'10px 18px',display:'flex',gap:'18px',borderTop:`1px solid ${C.border}`,flexShrink:0}}>
            {PEOPLE.map(p=>(
              <div key={p.key} onClick={()=>togglePerson(p.key)}
                style={{display:'flex',alignItems:'center',gap:'6px',cursor:'pointer',opacity:visible.includes(p.key)?1:0.4}}>
                <div style={{width:'9px',height:'9px',borderRadius:'50%',background:p.color}}/>
                <span style={{...T.caption,color:C.textSecond,fontWeight:500}}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Integrations strip — matches prototype int-scroll pattern */}
        <div className="int-scroll">
          {/* Google Calendar */}
          <div className="int-snap"
            onClick={gcalStatus === 'disconnected' && connectors?.gcal?.connect ? connectors.gcal.connect : undefined}>
            <div className="int-icon-wrap" style={{background:gcalStatus==='connected'?'#4285F4':'#D39EF6'}}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="4" width="12" height="9" rx="2" stroke={gcalStatus==='connected'?'#fff':'#EBDBFC'} strokeWidth="1.5"/>
                <path d="M2 8h12M6 4V2M10 4V2" stroke={gcalStatus==='connected'?'#fff':'#EBDBFC'} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="int-name">Google Cal</div>
            <div className="int-status" style={{color:gcalStatus==='connected'?C.textPrimary:gcalStatus==='loading'?'#FEA877':C.textMuted}}>
              <div className="int-dot" style={{background:gcalStatus==='connected'?'#94F2DB':gcalStatus==='loading'?'#FEA877':'#FF7776'}}/>
              {gcalStatus==='connected' ? 'Live' : gcalStatus==='loading' ? 'Syncing' : 'Connect'}
            </div>
          </div>
          {/* Future integrations go here as siblings */}
        </div>

        </div>{/* end calendar column */}

        {/* Sidebar */}
        <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:'12px',alignSelf:'stretch',overflow:'hidden'}}>

          <MiniMonth selectedDate={selectedDate} onSelect={d=>setSelectedDate(d)}/>

          {/* Today's Tasks */}
          <div style={{background:C.card,borderRadius:'14px',border:`1px solid ${C.border}`,boxShadow:C.shadowSm,display:'flex',flexDirection:'column',flex:1,minHeight:0,overflow:'hidden'}}>
            <div style={{padding:'14px 16px 12px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <span style={{...T.headingSm,color:C.textPrimary}}>Today's Tasks</span>
              <button onClick={()=>navigate('/tasks')} style={{...T.caption,color:C.brightLav,background:'none',border:'none',cursor:'pointer',fontFamily:FONT,fontWeight:700}}>All {'\u2192'}</button>
            </div>
            <div style={{overflowY:'auto',flex:1}}>
              {agendaItems.length===0
                ?<div style={{padding:'20px',textAlign:'center',...T.bodySm,color:C.textMuted,fontStyle:'italic'}}>All done!</div>
                :agendaItems.map((item,i)=>(
                  <div key={item.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 14px',borderBottom:i<agendaItems.length-1?`1px solid ${C.border}`:'none'}}>
                    <div onClick={()=>completeTask(item.id)}
                      style={{width:'16px',height:'16px',borderRadius:'4px',border:`1.5px solid ${C.border}`,flexShrink:0,cursor:'pointer',transition:'all 0.15s',background:'transparent'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.brightLav;e.currentTarget.style.background=C.lavVeil}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background='transparent'}}
                    />
                    <div style={{flex:1,minWidth:0,...T.bodySm,fontWeight:600,color:C.textPrimary,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</div>
                    <div style={{display:'flex',alignItems:'center',gap:'5px',flexShrink:0}}>
                      <span style={{...T.label,color:item.tagColor,background:item.tagBg,borderRadius:'8px',padding:'2px 8px',whiteSpace:'nowrap'}}>{item.tagLabel}</span>
                      {item.est&&<span style={{...T.label,color:C.textMuted,whiteSpace:'nowrap'}}>{item.est}</span>}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Upcoming */}
          <div style={{background:C.card,borderRadius:'14px',border:`1px solid ${C.border}`,boxShadow:C.shadowSm,overflow:'hidden',flexShrink:0}}>
            <div style={{padding:'14px 16px 12px',borderBottom:`1px solid ${C.border}`}}>
              <span style={{...T.headingSm,color:C.textPrimary}}>Upcoming</span>
            </div>
            {[
              {date:'Apr 10',title:'Date Night',                color:'#A873EF',bg:'#EBDBFC'},
              {date:'Apr 15',title:'Spring Break \u2014 Liam',  color:'#1A7A60',bg:'#D4F8EE'},
              {date:'May 15',title:"Mom's 60th Birthday",       color:'#FF7776',bg:'#FFE8E8'},
            ].map((ev,i,arr)=>(
              <div key={i} style={{display:'flex',gap:'12px',alignItems:'center',padding:'10px 16px',borderBottom:i<arr.length-1?`1px solid ${C.border}`:'none'}}>
                <div style={{flexShrink:0,background:ev.bg,borderRadius:'8px',padding:'5px 9px'}}>
                  <span style={{...T.label,color:ev.color,whiteSpace:'nowrap'}}>{ev.date}</span>
                </div>
                <span style={{...T.bodySm,fontWeight:600,color:C.textPrimary}}>{ev.title}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}