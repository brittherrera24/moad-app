import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { INITIAL_TASK_DATA } from '../taskData'

const FONT = "'Plus Jakarta Sans', -apple-system, sans-serif"

const C = {
  bg:          '#F9FAFE',
  card:        '#FFFFFF',
  border:      'rgba(168,115,239,0.12)',
  textPrimary: '#2D1F4A',
  textSecond:  '#9793A0',
  textMuted:   '#C0BACC',
  brightLav:   '#A873EF',
  lavVeil:     '#EBDBFC',
  shadowSm:    '0 2px 12px rgba(100,60,180,0.08)',
  shadowMd:    '0 6px 24px rgba(100,60,180,0.13)',
}

const PEOPLE = [
  { key:'brittani', label:'Britt', color:'#A873EF', bg:'#EBDBFC', textColor:'#A873EF', dotBg:'#A873EF', dotText:'#fff', initial:'B' },
  { key:'chris',    label:'Chris', color:'#FEA877', bg:'#FEF0DC', textColor:'#B85A00', dotBg:'#FEA877', dotText:'#fff', initial:'C' },
  { key:'liam',     label:'Liam',  color:'#94F2DB', bg:'#D4F8EE', textColor:'#1A7A60', dotBg:'#94F2DB', dotText:'#2D1F4A', initial:'L' },
  { key:'ethan',    label:'Ethan', color:'#FF7776', bg:'#FFE8E8', textColor:'#CC2020', dotBg:'#FF7776', dotText:'#fff', initial:'E' },
]

const SEED_EVENTS = [
  { id:1,  title:'Grocery Run',     person:'brittani', date:'2026-04-05', start:10,  end:11   },
  { id:2,  title:'Team Meeting',    person:'brittani', date:'2026-04-06', start:8,   end:9    },
  { id:3,  title:'School',          person:'liam',     date:'2026-04-06', start:8,   end:15   },
  { id:4,  title:'Project Review',  person:'brittani', date:'2026-04-06', start:12,  end:13   },
  { id:5,  title:'Dentist',         person:'brittani', date:'2026-04-07', start:9,   end:10   },
  { id:6,  title:'Soccer Practice', person:'liam',     date:'2026-04-07', start:15,  end:17   },
  { id:7,  title:'BJJ Class',       person:'chris',    date:'2026-04-07', start:18,  end:19.5 },
  { id:8,  title:'Piano',           person:'liam',     date:'2026-04-08', start:10,  end:11   },
  { id:9,  title:'Client Call',     person:'brittani', date:'2026-04-08', start:14,  end:15   },
  { id:10, title:'Work',            person:'ethan',    date:'2026-04-08', start:14,  end:22   },
  { id:11, title:'Work',            person:'ethan',    date:'2026-04-09', start:10,  end:18   },
  { id:12, title:'Date Night',      person:'brittani', date:'2026-04-10', start:19,  end:22   },
  { id:13, title:'Date Night',      person:'chris',    date:'2026-04-10', start:19,  end:22   },
  { id:14, title:'Art Class',       person:'liam',     date:'2026-04-11', start:10,  end:12   },
  { id:15, title:'Electrician Job', person:'chris',    date:'2026-04-06', start:7,   end:16   },
  { id:16, title:'Electrician Job', person:'chris',    date:'2026-04-07', start:7,   end:16   },
  { id:17, title:'Electrician Job', person:'chris',    date:'2026-04-08', start:7,   end:16   },
  { id:18, title:'Electrician Job', person:'chris',    date:'2026-04-09', start:7,   end:16   },
]

const INITIAL_DINNERS = {
  '2026-04-05': { meal:'Spaghetti',     people:['brittani','chris','liam','ethan'] },
  '2026-04-06': { meal:'Chicken Tacos', people:['brittani','chris','liam'] },
  '2026-04-07': { meal:'Salmon',        people:['brittani','chris','liam','ethan'] },
  '2026-04-08': { meal:'Pizza Night',   people:['brittani','chris','liam','ethan'] },
  '2026-04-09': { meal:'Stir Fry',      people:['brittani','liam'] },
  '2026-04-10': { meal:'Date Night',    people:['brittani','chris'] },
  '2026-04-11': { meal:'Pot Roast',     people:['brittani','chris','liam','ethan'] },
}

const HOURS  = Array.from({ length:17 }, (_,i) => i+6)
const HOUR_H = 40
const TODAY  = '2026-04-08'

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function fmtHour(h) {
  if (h===12) return '12pm'
  if (h===0||h===24) return '12am'
  return h<12 ? `${h}am` : `${h-12}pm`
}
function getWeekDates(offset=0) {
  const base=new Date(2026,3,8), sun=new Date(base)
  sun.setDate(base.getDate()-base.getDay()+offset*7)
  return Array.from({length:7},(_,i)=>{ const d=new Date(sun); d.setDate(sun.getDate()+i); return d })
}

// Compute side-by-side columns for overlapping events (like Google Calendar)
function layoutEvents(events) {
  if (!events.length) return []
  const sorted = [...events].sort((a,b) => a.start - b.start)
  const columns = []
  const result = []

  for (const ev of sorted) {
    let placed = false
    for (let ci = 0; ci < columns.length; ci++) {
      const col = columns[ci]
      if (col[col.length-1].end <= ev.start) {
        col.push(ev)
        result.push({ ev, col: ci })
        placed = true
        break
      }
    }
    if (!placed) {
      columns.push([ev])
      result.push({ ev, col: columns.length-1 })
    }
  }

  return result.map(({ ev, col }) => {
    // Find how many columns overlap with this event
    let maxCols = 1
    for (const { ev: other, col: otherCol } of result) {
      if (other.id !== ev.id && !(other.end <= ev.start || other.start >= ev.end)) {
        maxCols = Math.max(maxCols, otherCol+1)
      }
    }
    maxCols = Math.max(maxCols, col+1)
    return { ev, col, totalCols: maxCols }
  })
}

const SUBTAG_COLORS = {
  Finance:      { bg:'#D6EEC9', color:'#2A6B40' },
  Household:    { bg:'#FEF0DC', color:'#B85A00' },
  Hobbies:      { bg:'#EBDBFC', color:'#A873EF' },
  Kids:         { bg:'#D4F8EE', color:'#1A7A60' },
  Family:       { bg:'#D4F8EE', color:'#1A7A60' },
  'Dev Lessons':{ bg:'#EBDBFC', color:'#A873EF' },
  Travel:       { bg:'#D4F8EE', color:'#1A7A60' },
  Miscellaneous:{ bg:'#F0EDF5', color:'#9793A0' },
}

// ── ADD EVENT POPUP ───────────────────────────────────────────────────────────
function AddEventPopup({ onClose, onAdd, defaultDate }) {
  const [title,   setTitle]   = useState('')
  const [date,    setDate]    = useState(defaultDate || TODAY)
  const [start,   setStart]   = useState('09:00')
  const [end,     setEnd]     = useState('10:00')
  const [people,  setPeople]  = useState(['brittani'])
  const inputRef = useRef()
  useEffect(() => { inputRef.current?.focus() }, [])

  function togglePerson(key) {
    setPeople(prev => prev.includes(key)
      ? (prev.length > 1 ? prev.filter(k=>k!==key) : prev)
      : [...prev, key])
  }

  function submit() {
    if (!title.trim()) return
    const startH = parseInt(start.split(':')[0]) + parseInt(start.split(':')[1])/60
    const endH   = parseInt(end.split(':')[0])   + parseInt(end.split(':')[1])/60
    // Create one event per person selected
    people.forEach(personKey => {
      const p = PEOPLE.find(p=>p.key===personKey)
      onAdd({
        id: Date.now() + Math.random(),
        title: title.trim(),
        person: personKey,
        date,
        start: startH,
        end: endH,
        color: p.textColor,
        bg: p.bg,
      })
    })
    onClose()
  }

  return (
    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(45,32,74,0.35)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center'}}
      onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div style={{background:C.card,borderRadius:'16px',border:`1px solid ${C.border}`,padding:'20px',display:'flex',flexDirection:'column',gap:'14px',boxShadow:'0 24px 64px rgba(45,32,74,0.24)',width:'400px',maxWidth:'92vw',fontFamily:FONT}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:'15px',fontWeight:800,color:C.textPrimary}}>Add Event</span>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.textMuted,cursor:'pointer',fontSize:'20px',lineHeight:1,padding:'0 2px'}}>×</button>
        </div>

        <input ref={inputRef} value={title} onChange={e=>setTitle(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter') submit(); if(e.key==='Escape') onClose() }}
          placeholder="Event title..."
          style={{padding:'10px 14px',borderRadius:'10px',border:`1.5px solid ${C.border}`,fontSize:'14px',fontFamily:FONT,color:C.textPrimary,outline:'none',fontWeight:600,boxSizing:'border-box',width:'100%'}}
          onFocus={e=>e.currentTarget.style.borderColor=C.brightLav}
          onBlur={e=>e.currentTarget.style.borderColor=C.border}
        />

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px'}}>
          {[
            {label:'Date', el:<input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{padding:'7px 8px',borderRadius:'8px',border:`1.5px solid ${C.border}`,fontSize:'12px',fontFamily:FONT,color:C.textPrimary,outline:'none',width:'100%',boxSizing:'border-box'}}/>},
            {label:'Start',el:<input type="time" value={start} onChange={e=>setStart(e.target.value)} style={{padding:'7px 8px',borderRadius:'8px',border:`1.5px solid ${C.border}`,fontSize:'12px',fontFamily:FONT,color:C.textPrimary,outline:'none',width:'100%',boxSizing:'border-box'}}/>},
            {label:'End',  el:<input type="time" value={end} onChange={e=>setEnd(e.target.value)} style={{padding:'7px 8px',borderRadius:'8px',border:`1.5px solid ${C.border}`,fontSize:'12px',fontFamily:FONT,color:C.textPrimary,outline:'none',width:'100%',boxSizing:'border-box'}}/>},
          ].map(({label,el})=>(
            <div key={label}>
              <div style={{fontSize:'10px',fontWeight:700,color:C.textMuted,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'5px'}}>{label}</div>
              {el}
            </div>
          ))}
        </div>

        <div>
          <div style={{fontSize:'10px',fontWeight:700,color:C.textMuted,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'8px'}}>Who (select all that apply)</div>
          <div style={{display:'flex',gap:'6px'}}>
            {PEOPLE.map(p=>{
              const on=people.includes(p.key)
              return (
                <button key={p.key} onClick={()=>togglePerson(p.key)}
                  style={{flex:1,padding:'7px 4px',borderRadius:'8px',border:`1.5px solid ${on?p.color:C.border}`,background:on?p.bg:C.bg,cursor:'pointer',fontSize:'12px',fontWeight:700,color:on?p.textColor:C.textMuted,fontFamily:FONT,transition:'all 0.12s'}}>
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{display:'flex',gap:'10px',paddingTop:'2px'}}>
          <button onClick={submit} disabled={!title.trim()}
            style={{flex:1,padding:'11px',borderRadius:'10px',border:'none',background:title.trim()?'linear-gradient(135deg,#FF7776,#FEA877)':'#eee',color:title.trim()?'#fff':'#aaa',fontSize:'13px',fontWeight:700,fontFamily:FONT,cursor:title.trim()?'pointer':'default',transition:'all 0.15s'}}>
            Add Event
          </button>
          <button onClick={onClose}
            style={{padding:'11px 18px',borderRadius:'10px',border:`1.5px solid ${C.border}`,background:'transparent',color:C.textMuted,fontSize:'13px',fontFamily:FONT,cursor:'pointer'}}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MINI MONTH ───────────────────────────────────────────────────────────────
function MiniMonth({ selectedDate, onSelect }) {
  const [view, setView] = useState(new Date(2026,3,1))
  const today = new Date(2026,3,8)
  const year=view.getFullYear(), month=view.getMonth()
  const firstDay=new Date(year,month,1).getDay()
  const daysInMonth=new Date(year,month+1,0).getDate()
  const cells=Array.from({length:firstDay},()=>null).concat(Array.from({length:daysInMonth},(_,i)=>i+1))
  return (
    <div style={{background:C.card,borderRadius:'14px',border:`1px solid ${C.border}`,boxShadow:C.shadowSm,padding:'13px',fontFamily:FONT}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
        <button onClick={()=>setView(new Date(year,month-1,1))} style={{background:'none',border:'none',cursor:'pointer',color:C.textSecond,fontSize:'16px',padding:'2px 6px',borderRadius:'5px',lineHeight:1}}>‹</button>
        <span style={{fontSize:'12px',fontWeight:700,color:C.textPrimary}}>{view.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</span>
        <button onClick={()=>setView(new Date(year,month+1,1))} style={{background:'none',border:'none',cursor:'pointer',color:C.textSecond,fontSize:'16px',padding:'2px 6px',borderRadius:'5px',lineHeight:1}}>›</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:'3px'}}>
        {['S','M','T','W','T','F','S'].map((d,i)=>(
          <div key={i} style={{textAlign:'center',fontSize:'10px',fontWeight:700,color:C.textMuted,padding:'2px 0'}}>{d}</div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'1px'}}>
        {cells.map((day,i)=>{
          if(!day) return <div key={i}/>
          const d=new Date(year,month,day)
          const isTod=d.toDateString()===today.toDateString()
          const isSel=selectedDate&&d.toDateString()===selectedDate.toDateString()
          const hasEv=SEED_EVENTS.some(e=>e.date===dateKey(d))
          return (
            <div key={i} onClick={()=>onSelect(d)}
              style={{textAlign:'center',padding:'3px 1px',borderRadius:'5px',cursor:'pointer',background:isSel?C.brightLav:isTod?C.lavVeil:'transparent'}}
              onMouseEnter={e=>{if(!isSel&&!isTod)e.currentTarget.style.background=C.lavVeil}}
              onMouseLeave={e=>{if(!isSel&&!isTod)e.currentTarget.style.background='transparent'}}>
              <span style={{fontSize:'11px',fontWeight:isTod||isSel?800:400,color:isSel?'#fff':isTod?C.brightLav:C.textPrimary}}>{day}</span>
              {hasEv&&!isSel&&<div style={{width:'3px',height:'3px',borderRadius:'50%',background:C.brightLav,margin:'1px auto 0',opacity:0.5}}/>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function Calendar({ taskData, setTaskData, onOpenAddEvent }) {
  const navigate = useNavigate()
  const [weekOffset, setWeekOffset]     = useState(0)
  const [visible, setVisible]           = useState(['brittani','chris','liam','ethan'])
  const [dinnerHome, setDinnerHome]     = useState(INITIAL_DINNERS)
  const [selectedDate, setSelectedDate] = useState(new Date(2026,3,8))
  const [customEvents, setCustomEvents] = useState([])
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [addEventDate, setAddEventDate] = useState(TODAY)
  const calCardRef = useRef()
  const gridRef    = useRef()

  useEffect(()=>{ if(gridRef.current) gridRef.current.scrollTop=(8-6)*HOUR_H-4 },[])

  // Expose open handler to Header via prop if needed
  useEffect(()=>{
    if(onOpenAddEvent) onOpenAddEvent(()=>setShowAddEvent(true))
  },[onOpenAddEvent])

  const togglePerson = useCallback(key=>{
    setVisible(prev=>prev.includes(key)?(prev.length>1?prev.filter(k=>k!==key):prev):[...prev,key])
  },[])

  const toggleDinner = useCallback((dateStr,personKey)=>{
    setDinnerHome(prev=>{
      const day=prev[dateStr]; if(!day) return prev
      const eating=day.people.includes(personKey)
      return {...prev,[dateStr]:{...day,people:eating?day.people.filter(p=>p!==personKey):[...day.people,personKey]}}
    })
  },[])

  function completeTask(taskId) {
    if(!setTaskData) return
    setTaskData(prev=>{
      const task=prev.today.find(t=>t.id===taskId)
      if(!task) return prev
      return { ...prev, today:prev.today.filter(t=>t.id!==taskId), completed:[{...task,completedAt:new Date().toISOString()},...prev.completed] }
    })
  }

  const weekDates  = getWeekDates(weekOffset)
  const allEvents  = [...SEED_EVENTS, ...customEvents]

  const todayTasks = taskData?.today || INITIAL_TASK_DATA.today || []
  const agendaItems = todayTasks.slice(0,20).map(t=>{
    const isWork=t.category==='work'
    const tag=t.client||t.subTag||(isWork?'Internal':'Personal')
    const tagStyle=t.client
      ?{bg:'#FEF0DC',color:'#B85A00'}
      :t.subTag?(SUBTAG_COLORS[t.subTag]||{bg:'#EBDBFC',color:'#A873EF'})
      :isWork?{bg:'#EBDBFC',color:'#A873EF'}
      :{bg:'#D6EEC9',color:'#2A6B40'}
    return {id:t.id,est:t.est||'',title:t.title,tag,tagBg:tagStyle.bg,tagColor:tagStyle.color}
  })

  const nowTop=(14.3-6)*HOUR_H

  function openAdd(dateStr) {
    setAddEventDate(dateStr||TODAY)
    setShowAddEvent(true)
  }

  return (
    <div style={{fontFamily:FONT,background:C.bg,minHeight:'100vh',padding:'20px 24px',display:'flex',flexDirection:'column',gap:'14px'}}>

      {showAddEvent&&(
        <AddEventPopup
          defaultDate={addEventDate}
          onClose={()=>setShowAddEvent(false)}
          onAdd={ev=>setCustomEvents(prev=>[...prev,ev])}
        />
      )}

      {/* Nav bar */}
      <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
        <button onClick={()=>setWeekOffset(0)}
          style={{padding:'7px 16px',borderRadius:'20px',border:'none',background:weekOffset===0?C.brightLav:C.card,color:weekOffset===0?'#fff':C.textSecond,fontSize:'12px',fontWeight:700,fontFamily:FONT,cursor:'pointer',boxShadow:C.shadowSm}}>
          Today
        </button>
        {[[-1,'‹'],[1,'›']].map(([d,label])=>(
          <button key={d} onClick={()=>setWeekOffset(w=>w+d)}
            style={{width:'32px',height:'32px',borderRadius:'50%',border:`1px solid ${C.border}`,background:C.card,cursor:'pointer',fontSize:'15px',color:C.textSecond,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}
            onMouseEnter={e=>e.currentTarget.style.background=C.lavVeil}
            onMouseLeave={e=>e.currentTarget.style.background=C.card}>{label}</button>
        ))}
        <span style={{fontSize:'15px',fontWeight:800,color:C.textPrimary}}>
          {weekDates[0].toLocaleDateString('en-US',{month:'long',day:'numeric'})} – {weekDates[6].toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}
        </span>
        <button onClick={()=>openAdd(TODAY)}
          style={{display:'flex',alignItems:'center',gap:'5px',padding:'7px 14px',borderRadius:'20px',border:'none',background:'linear-gradient(135deg,#FF7776,#FEA877)',color:'#fff',fontSize:'12px',fontWeight:700,fontFamily:FONT,cursor:'pointer',boxShadow:'0 2px 8px rgba(255,119,118,0.35)'}}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="white" strokeWidth="1.6" strokeLinecap="round"/></svg>
          Add Event
        </button>
        <div style={{display:'flex',gap:'6px',marginLeft:'auto',flexWrap:'wrap'}}>
          {PEOPLE.map(p=>{
            const on=visible.includes(p.key)
            return (
              <button key={p.key} onClick={()=>togglePerson(p.key)}
                style={{display:'flex',alignItems:'center',gap:'5px',padding:'5px 11px',borderRadius:'20px',border:`1.5px solid ${on?p.color:C.border}`,background:on?p.bg:C.card,cursor:'pointer',opacity:on?1:0.45,transition:'all 0.15s',fontFamily:FONT}}>
                <div style={{width:'7px',height:'7px',borderRadius:'50%',background:p.color,flexShrink:0}}/>
                <span style={{fontSize:'12px',fontWeight:700,color:on?p.textColor:C.textMuted}}>{p.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main layout: 3/4 calendar + 1/4 sidebar */}
      <div style={{display:'flex',gap:'16px',alignItems:'stretch'}}>

        {/* Calendar card — 3/4 */}
        <div ref={calCardRef} style={{flex:'0 0 74%',minWidth:0,background:C.card,borderRadius:'16px',border:`1px solid ${C.border}`,boxShadow:C.shadowSm,overflow:'hidden',display:'flex',flexDirection:'column'}}>

          {/* Day headers */}
          <div style={{display:'grid',gridTemplateColumns:'40px repeat(7,1fr)',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
            <div style={{borderRight:`1px solid ${C.border}`}}/>
            {weekDates.map((d,i)=>{
              const dStr=dateKey(d), isToday=dStr===TODAY
              return (
                <div key={i} onClick={()=>openAdd(dStr)}
                  style={{padding:'10px 2px',textAlign:'center',borderRight:i<6?`1px solid ${C.border}`:'none',cursor:'pointer',background:isToday?'rgba(168,115,239,0.04)':'transparent',position:'relative',transition:'background 0.12s'}}
                  onMouseEnter={e=>{ if(!isToday) e.currentTarget.style.background='rgba(168,115,239,0.04)' }}
                  onMouseLeave={e=>{ if(!isToday) e.currentTarget.style.background='transparent' }}>
                  {isToday&&<div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:'linear-gradient(90deg,#FF7776,#FEA877)'}}/>}
                  <div style={{fontSize:'11px',fontWeight:600,color:isToday?C.brightLav:C.textMuted,textTransform:'uppercase',letterSpacing:'0.05em'}}>
                    {d.toLocaleDateString('en-US',{weekday:'short'})}
                  </div>
                  {isToday
                    ?<div style={{width:'30px',height:'30px',borderRadius:'50%',background:'linear-gradient(135deg,#FF7776,#FEA877)',display:'flex',alignItems:'center',justifyContent:'center',margin:'3px auto 0'}}>
                       <span style={{fontSize:'15px',fontWeight:800,color:'#fff'}}>{d.getDate()}</span>
                     </div>
                    :<span style={{fontSize:'16px',fontWeight:800,color:C.textPrimary,display:'block',marginTop:'3px'}}>{d.getDate()}</span>
                  }
                </div>
              )
            })}
          </div>

          {/* Scrollable grid */}
          <div ref={gridRef} style={{overflowY:'auto',flex:1}}>
            <div style={{display:'grid',gridTemplateColumns:'40px repeat(7,1fr)'}}>
              {/* Time labels */}
              <div style={{borderRight:`1px solid ${C.border}`}}>
                {HOURS.map(h=>(
                  <div key={h} style={{height:`${HOUR_H}px`,display:'flex',alignItems:'flex-start',justifyContent:'flex-end',paddingRight:'7px',paddingTop:'3px',borderBottom:`1px solid rgba(45,32,64,0.04)`}}>
                    <span style={{fontSize:'10px',fontWeight:600,color:C.textMuted}}>{fmtHour(h)}</span>
                  </div>
                ))}
              </div>
              {/* Day columns */}
              {weekDates.map((d,di)=>{
                const dStr=dateKey(d), isToday=dStr===TODAY
                const dayEvs=allEvents.filter(e=>e.date===dStr&&visible.includes(e.person))
                const laid=layoutEvents(dayEvs)
                return (
                  <div key={di} style={{position:'relative',borderRight:di<6?`1px solid ${C.border}`:'none',background:isToday?'rgba(168,155,181,0.04)':'transparent'}}>
                    {HOURS.map(h=>(
                      <div key={h} style={{height:`${HOUR_H}px`,borderBottom:`1px solid rgba(45,32,64,0.04)`}}
                        onClick={()=>openAdd(dStr)}/>
                    ))}
                    {/* Events — side by side when overlapping */}
                    <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,pointerEvents:'none'}}>
                      {laid.map(({ev,col,totalCols})=>{
                        const p=PEOPLE.find(p=>p.key===ev.person)
                        const top=(ev.start-6)*HOUR_H
                        const height=Math.max((ev.end-ev.start)*HOUR_H-2,20)
                        const pct=100/totalCols
                        return (
                          <div key={ev.id}
                            style={{position:'absolute',top:`${top}px`,left:`calc(${col*pct}% + 2px)`,width:`calc(${pct}% - 4px)`,height:`${height}px`,background:p?.bg||'#EBDBFC',borderRadius:'5px',padding:'2px 5px',overflow:'hidden',cursor:'pointer',pointerEvents:'all',boxSizing:'border-box'}}>
                            <div style={{fontSize:'10px',fontWeight:700,color:p?.textColor||C.brightLav,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.3}}>{ev.title}</div>
                            {height>28&&<div style={{fontSize:'9px',color:p?.textColor,opacity:0.75,marginTop:'1px'}}>{fmtHour(ev.start)}–{fmtHour(ev.end)}</div>}
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
          <div style={{display:'grid',gridTemplateColumns:'40px repeat(7,1fr)',borderTop:`1px solid ${C.border}`,background:C.card,flexShrink:0}}>
            <div style={{padding:'8px 6px',display:'flex',alignItems:'center',justifyContent:'center',borderRight:`1px solid ${C.border}`}}>
              <span style={{fontSize:'9px',fontWeight:700,color:C.textMuted,writingMode:'vertical-rl',transform:'rotate(180deg)'}}>Dinner</span>
            </div>
            {weekDates.map((d,i)=>{
              const dStr=dateKey(d), dinner=dinnerHome[dStr], isToday=dStr===TODAY
              return (
                <div key={i} style={{padding:'8px 4px',borderRight:i<6?`1px solid rgba(45,32,64,0.06)`:'none'}}>
                  {dinner?(
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px'}}>
                      <span style={{fontSize:'9px',fontWeight:600,color:isToday?'#fff':C.textPrimary,background:isToday?C.brightLav:'#EBDBFC',borderRadius:'20px',padding:'2px 7px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%',display:'block',textAlign:'center',boxSizing:'border-box'}}>{dinner.meal}</span>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'2px',justifyContent:'center',width:'34px'}}>
                        {PEOPLE.map(p=>{
                          const eating=dinner.people.includes(p.key)
                          return (
                            <div key={p.key} onClick={()=>toggleDinner(dStr,p.key)} title={p.label}
                              style={{width:'14px',height:'14px',minWidth:'14px',minHeight:'14px',flex:'0 0 14px',borderRadius:'50%',background:eating?p.dotBg:'transparent',border:eating?'none':`1.5px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'7px',fontWeight:800,color:eating?p.dotText:C.textMuted,cursor:'pointer',opacity:eating?1:0.2,transition:'all 0.15s'}}>
                              {p.initial}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ):<span style={{fontSize:'11px',color:C.textMuted,display:'block',textAlign:'center',paddingTop:'6px'}}>–</span>}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{padding:'9px 16px',display:'flex',gap:'16px',borderTop:`1px solid ${C.border}`,background:'rgba(255,255,255,0.6)',flexShrink:0}}>
            {PEOPLE.map(p=>(
              <div key={p.key} style={{display:'flex',alignItems:'center',gap:'5px',cursor:'pointer'}} onClick={()=>togglePerson(p.key)}>
                <div style={{width:'8px',height:'8px',borderRadius:'50%',background:p.color,opacity:visible.includes(p.key)?1:0.3}}/>
                <span style={{fontSize:'11px',color:C.textSecond,fontWeight:500,opacity:visible.includes(p.key)?1:0.4}}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar — 1/4, stretches to match calendar height */}
        <div style={{flex:1,minWidth:'180px',display:'flex',flexDirection:'column',gap:'12px',alignSelf:'stretch'}}>

          <MiniMonth selectedDate={selectedDate} onSelect={d=>{ setSelectedDate(d); openAdd(dateKey(d)) }}/>

          {/* Today's Tasks — fills remaining height, scrollable */}
          <div style={{background:C.card,borderRadius:'14px',border:`1px solid ${C.border}`,boxShadow:C.shadowSm,overflow:'hidden',display:'flex',flexDirection:'column',flex:1,minHeight:0}}>
            <div style={{padding:'12px 14px 10px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <span style={{fontSize:'13px',fontWeight:800,color:C.textPrimary}}>Today's Tasks</span>
              <button onClick={()=>navigate('/tasks')} style={{fontSize:'11px',color:C.brightLav,background:'none',border:'none',cursor:'pointer',fontFamily:FONT,fontWeight:600}}>All →</button>
            </div>
            <div style={{overflowY:'auto',flex:1}}>
              {agendaItems.length===0
                ?<div style={{padding:'16px',fontSize:'12px',color:C.textMuted,fontStyle:'italic'}}>No tasks today</div>
                :agendaItems.map((item,i)=>(
                  <div key={item.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 12px',borderBottom:i<agendaItems.length-1?`1px solid ${C.border}`:'none'}}>
                    {/* Checkbox */}
                    <div onClick={()=>completeTask(item.id)}
                      style={{width:'15px',height:'15px',borderRadius:'4px',border:`1.5px solid ${C.border}`,flexShrink:0,cursor:'pointer',transition:'border-color 0.15s'}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=C.brightLav}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
                    />
                    {/* Title */}
                    <div style={{flex:1,minWidth:0,fontSize:'12px',fontWeight:600,color:C.textPrimary,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</div>
                    {/* Tag + est inline */}
                    <div style={{display:'flex',alignItems:'center',gap:'4px',flexShrink:0}}>
                      <span style={{fontSize:'10px',fontWeight:700,color:item.tagColor,background:item.tagBg,borderRadius:'8px',padding:'1px 7px',whiteSpace:'nowrap'}}>{item.tag}</span>
                      {item.est&&<span style={{fontSize:'10px',color:C.textMuted,whiteSpace:'nowrap'}}>{item.est}</span>}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Upcoming */}
          <div style={{background:C.card,borderRadius:'14px',border:`1px solid ${C.border}`,boxShadow:C.shadowSm,overflow:'hidden',flexShrink:0}}>
            <div style={{padding:'12px 14px 10px',borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:'13px',fontWeight:800,color:C.textPrimary}}>Upcoming</span>
            </div>
            <div>
              {[
                {date:'Apr 10',title:'Date Night',         color:'#A873EF',bg:'#EBDBFC'},
                {date:'Apr 15',title:'Spring Break — Liam',color:'#1A7A60',bg:'#D4F8EE'},
                {date:'May 15',title:"Mom's 60th Birthday",color:'#FF7776',bg:'#FFE8E8'},
              ].map((ev,i,arr)=>(
                <div key={i} style={{display:'flex',gap:'10px',alignItems:'center',padding:'9px 14px',borderBottom:i<arr.length-1?`1px solid ${C.border}`:'none'}}>
                  <div style={{flexShrink:0,background:ev.bg,borderRadius:'7px',padding:'4px 7px'}}>
                    <div style={{fontSize:'10px',fontWeight:700,color:ev.color,whiteSpace:'nowrap'}}>{ev.date}</div>
                  </div>
                  <div style={{fontSize:'12px',fontWeight:600,color:C.textPrimary}}>{ev.title}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}