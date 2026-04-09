import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

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

const PAGE_META = {
  '/':             { title:'Home',          greeting:true  },
  '/tasks':        { title:'Tasks',         greeting:false },
  '/calendar':     { title:'Calendar',      greeting:false },
  '/health':       { title:'Health',        greeting:false },
  '/fitness':      { title:'Fitness',       greeting:false },
  '/meals':        { title:'Meals',         greeting:false },
  '/finance':      { title:'Finance',       greeting:false },
  '/knitting':     { title:'Knitting',      greeting:false },
  '/household':    { title:'Household',     greeting:false },
  '/achievements': { title:'Achievements',  greeting:false },
}

const QUOTES = [
  'Every small step counts. You have got this.',
  'Progress, not perfection.',
  'One task at a time.',
  'You are doing great things.',
  'Make today count.',
]

function getDateString() {
  return new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})
    +' · '+new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})
}

export default function Header({ onAddCalendarEvent = ()=>{} }) {
  const location  = useLocation()
  const navigate  = useNavigate()
  const meta      = PAGE_META[location.pathname] || { title:'', greeting:false }
  const [dateStr, setDateStr]     = useState(getDateString())
  const [search,  setSearch]      = useState('')
  const [quote]                   = useState(()=>QUOTES[Math.floor(Math.random()*QUOTES.length)])
  const [quickOpen, setQuickOpen] = useState(false)
  const quickRef  = useRef()

  useEffect(()=>{
    const t=setInterval(()=>setDateStr(getDateString()),60000)
    return ()=>clearInterval(t)
  },[])

  useEffect(()=>{
    function handle(e) { if(quickRef.current&&!quickRef.current.contains(e.target)) setQuickOpen(false) }
    document.addEventListener('mousedown',handle)
    return ()=>document.removeEventListener('mousedown',handle)
  },[])

  const QUICK_ADD_ITEMS = [
    {
      label:'Task',
      icon:<svg width="16" height="16" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4 7l2.5 2.5L10 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      action:()=>{
        navigate('/tasks')
        setQuickOpen(false)
        setTimeout(()=>window.dispatchEvent(new Event('moad:openAddTask')), 200)
      },
      live:true,
    },
    {
      label:'Calendar Event',
      icon:<svg width="16" height="16" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1 6h12M4.5 1v2M9.5 1v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
      action:()=>{
        onAddCalendarEvent()
        setTimeout(()=>navigate('/calendar'), 0)
        setQuickOpen(false)
      },
      live:true,
    },
    {
      label:'Meal',
      icon:<svg width="16" height="16" viewBox="0 0 14 14" fill="none"><line x1="5" y1="1" x2="5" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="9" y1="1" x2="9" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M3 1v4a2 2 0 004 0V1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      action:null, live:false,
    },
    {
      label:'Health log',
      icon:<svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M7 12C7 12 2 8.5 2 5.5a2.5 2.5 0 015 0 2.5 2.5 0 015 0c0 3-5 6.5-5 6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
      action:null, live:false,
    },
    {
      label:'Workout',
      icon:<svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M1 7h1M12 7h1M2 7h10M2 5.5v3M12 5.5v3M4 4.5v5M10 4.5v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
      action:null, live:false,
    },
    {
      label:'Expense',
      icon:<svg width="16" height="16" viewBox="0 0 14 14" fill="none"><line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M9.5 3.5H5.75a2.25 2.25 0 000 4.5h2.5a2.25 2.25 0 010 4.5H4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
      action:null, live:false,
    },
  ]

  return (
    <div style={{
      position:'relative', zIndex:50,
      background:'#FFFFFF',
      borderBottom:'1px solid rgba(168,115,239,0.12)',
      boxShadow:'0 1px 0 rgba(168,115,239,0.08), 0 2px 8px rgba(45,32,74,0.04)',
      padding:'0 28px',
      height:'84px',
      flexShrink:0,
      display:'flex', alignItems:'center', gap:'28px',
      fontFamily:FONT,
    }}>

      {/* Left: hero title + quote + date */}
      <div style={{flexShrink:0, minWidth:0, display:'flex', flexDirection:'column', gap:'3px'}}>
        <div style={{...T.hero, color:'#2D1F4A', letterSpacing:'-0.5px', lineHeight:1.1}}>
          {meta.greeting ? 'Welcome, Brittani!' : meta.title}
        </div>
        <div style={{...T.caption, color:'#A873EF', fontStyle:'italic'}}>{quote}</div>
        <div style={{...T.caption, color:'#9793A0'}}>{dateStr}</div>
      </div>

      {/* Center: search */}
      <div style={{flex:1, position:'relative', maxWidth:'500px', margin:'0 auto'}}>
        <span style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',display:'flex',pointerEvents:'none'}}>
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#C0BACC" strokeWidth="1.4"/>
            <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="#C0BACC" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </span>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search tasks, events, meals..."
          style={{width:'100%',padding:'11px 16px 11px 40px',borderRadius:'24px',border:'1px solid rgba(168,115,239,0.15)',background:'#F9FAFE',fontFamily:FONT,...T.body,color:'#2D1F4A',boxShadow:'0 1px 4px rgba(168,115,239,0.08)',outline:'none',transition:'border-color 0.2s, box-shadow 0.2s',boxSizing:'border-box'}}
          onFocus={e=>{e.currentTarget.style.borderColor='#A873EF';e.currentTarget.style.boxShadow='0 0 0 3px rgba(168,115,239,0.12)'}}
          onBlur={e=>{e.currentTarget.style.borderColor='rgba(168,115,239,0.15)';e.currentTarget.style.boxShadow='0 1px 4px rgba(168,115,239,0.08)'}}
        />
      </div>

      {/* Right: FAB, bell, avatar */}
      <div style={{display:'flex',gap:'12px',alignItems:'center',flexShrink:0}}>

        {/* FAB + dropdown */}
        <div style={{position:'relative'}} ref={quickRef}>
          <button onClick={()=>setQuickOpen(o=>!o)}
            style={{width:'44px',height:'44px',borderRadius:'50%',background:'linear-gradient(135deg,#FF7776,#FEA877)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 10px rgba(255,119,118,0.40)',transition:'transform 0.15s, box-shadow 0.15s',flexShrink:0}}
            onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.08)';e.currentTarget.style.boxShadow='0 4px 16px rgba(255,119,118,0.50)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 2px 10px rgba(255,119,118,0.40)'}}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" style={{transform:quickOpen?'rotate(45deg)':'none',transition:'transform 0.2s'}}>
              <path d="M8 3v10M3 8h10" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          {quickOpen&&(
            <div style={{position:'absolute',top:'52px',right:0,background:'#FFFFFF',borderRadius:'16px',border:'1px solid rgba(168,115,239,0.15)',boxShadow:'0 8px 32px rgba(45,32,74,0.18)',padding:'8px',minWidth:'210px',zIndex:200}}>
              <div style={{...T.micro,color:'#9793A0',textTransform:'uppercase',letterSpacing:'0.08em',padding:'6px 12px 10px'}}>Quick Add</div>
              {QUICK_ADD_ITEMS.map(item=>(
                <button key={item.label} onClick={item.live && item.action ? ()=>item.action() : undefined}
                  style={{display:'flex',alignItems:'center',gap:'12px',width:'100%',padding:'10px 12px',borderRadius:'10px',border:'none',background:'transparent',textAlign:'left',fontFamily:FONT,...T.body,fontWeight:600,color:item.live?'#2D1F4A':'#C0BACC',cursor:item.live?'pointer':'default',transition:'background 0.12s'}}
                  onMouseEnter={e=>{if(item.live)e.currentTarget.style.background='#F3EAFD'}}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <span style={{color:item.live?'#A873EF':'#C0BACC',flexShrink:0,display:'flex'}}>{item.icon}</span>
                  {item.label}
                  {!item.live&&<span style={{marginLeft:'auto',...T.label,color:'#C0BACC'}}>Soon</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bell */}
        <button style={{width:'44px',height:'44px',borderRadius:'50%',background:'rgba(255,255,255,0.7)',border:'1px solid rgba(168,115,239,0.15)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 1px 4px rgba(168,115,239,0.08)',transition:'background 0.15s',flexShrink:0}}
          onMouseEnter={e=>e.currentTarget.style.background='#F9FAFE'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.7)'}>
          <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
            <path d="M7.5 2a4.5 4.5 0 014.5 4.5c0 2.5.7 3.5 1.2 4H1.8c.5-.5 1.2-1.5 1.2-4A4.5 4.5 0 017.5 2z" stroke="#9793A0" strokeWidth="1.3" fill="none"/>
            <path d="M6 11.5a1.5 1.5 0 003 0" stroke="#9793A0" strokeWidth="1.3" fill="none"/>
          </svg>
        </button>

        {/* Avatar */}
        <div style={{width:'44px',height:'44px',borderRadius:'50%',background:'linear-gradient(135deg,#FEA877,#FF7776)',display:'flex',alignItems:'center',justifyContent:'center',...T.bodyMd,color:'#FFFFFF',fontFamily:FONT,cursor:'pointer',flexShrink:0,boxShadow:'0 2px 8px rgba(255,119,118,0.30)',border:'2px solid rgba(255,255,255,0.8)'}}>B</div>
      </div>
    </div>
  )
}