import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const FONT = "'Plus Jakarta Sans', -apple-system, sans-serif"

const NAV = [
  { path: '/',             label: 'Home',         icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 8l7-6 7 6v8a1 1 0 01-1 1H3a1 1 0 01-1-1V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6 17V10h6v7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
  { path: '/tasks',        label: 'Tasks',        icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="M5 9l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { path: '/calendar',     label: 'Calendar',     icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 8h14M6 2v4M12 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { path: '/health',       label: 'Health',       icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 14.5C9 14.5 3 10.5 3 6.5a3.5 3.5 0 017 0 3.5 3.5 0 017 0c0 4-6 8-6 8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/></svg> },
  { path: '/fitness',      label: 'Fitness',      icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 9h2M15 9h2M3 9h12M3 7v4M15 7v4M5 6v6M13 6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { path: '/meals',        label: 'Meals',        icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="6" y1="2" x2="6" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="2" x2="12" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M4 2v5a2 2 0 004 0V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { path: '/finance',      label: 'Finance',      icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="9" y1="2" x2="9" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 5H7.5a2.5 2.5 0 000 5h3a2.5 2.5 0 010 5H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { path: '/knitting',     label: 'Knitting',     icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 14C4 8 14 4 14 4M14 14C14 8 4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { path: '/household',    label: 'Household',    icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 9l7-7 7 7M4 7v8a1 1 0 001 1h3v-4h4v4h3a1 1 0 001-1V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { path: '/achievements', label: 'Achievements', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2l1.8 3.6L15 6.3l-3 2.9.7 4.1L9 11.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  const W = collapsed ? '60px' : '210px'

  return (
    <div style={{
      width: W, minWidth: W, maxWidth: W,
      height: '100vh',
      background: '#EBDBFC',
      display: 'flex', flexDirection: 'column',
      padding: '14px 0',
      flexShrink: 0,
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
      fontFamily: FONT,
      borderRight: '1px solid rgba(168,115,239,0.12)',
    }}>

      {/* Logo + collapse toggle */}
      <div style={{ display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? '0 0 14px' : '0 12px 14px', gap:'8px' }}>
        {!collapsed && (
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'linear-gradient(135deg,#FF7776,#FEA877)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 2px 8px rgba(255,119,118,0.30)' }}>
              <span style={{ fontSize:'14px', fontWeight:800, color:'#FFFFFF' }}>M</span>
            </div>
            <span style={{ fontSize:'15px', fontWeight:800, color:'#2D1F4A', letterSpacing:'-0.4px' }}>MOAD</span>
          </div>
        )}
        {collapsed && (
          <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'linear-gradient(135deg,#FF7776,#FEA877)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(255,119,118,0.30)' }}>
            <span style={{ fontSize:'14px', fontWeight:800, color:'#FFFFFF' }}>M</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{ width:'24px', height:'24px', borderRadius:'6px', border:'none', background:'rgba(168,115,239,0.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'background 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,115,239,0.30)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(168,115,239,0.15)' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition:'transform 0.22s' }}>
            <path d="M7.5 2L4 6l3.5 4" stroke="#A873EF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Nav items */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'1px', padding:'0 8px', overflowY:'auto', overflowX:'hidden' }}>
        {NAV.map(({ path, label, icon }) => {
          const active = location.pathname === path
          return (
            <button key={path}
              onClick={() => navigate(path)}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: collapsed ? '10px 0' : '9px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: '10px', border: 'none', width: '100%',
                background: active ? '#FFFFFF' : 'transparent',
                color: active ? '#A873EF' : '#5C4A7A',
                fontSize: '13px', fontWeight: active ? 700 : 500,
                fontFamily: FONT, cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: active ? '0 2px 8px rgba(168,115,239,0.15)' : 'none',
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}
              onMouseEnter={e => { if(!active) e.currentTarget.style.background = 'rgba(255,255,255,0.5)' }}
              onMouseLeave={e => { if(!active) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ flexShrink:0, opacity: active ? 1 : 0.75 }}>{icon}</span>
              {!collapsed && <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{label}</span>}
            </button>
          )
        })}
      </div>

      {/* Bottom: settings + avatar */}
      <div style={{ padding:'8px', borderTop:'1px solid rgba(168,115,239,0.15)', marginTop:'4px', display:'flex', flexDirection:'column', gap:'1px' }}>
        <button
          style={{ display:'flex', alignItems:'center', gap:'10px', padding: collapsed ? '9px 0' : '9px 10px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius:'10px', border:'none', background:'transparent', color:'#5C4A7A', fontSize:'13px', fontWeight:500, fontFamily:FONT, cursor:'pointer', width:'100%', transition:'background 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          title={collapsed ? 'Settings' : undefined}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink:0, opacity:0.75 }}>
            <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.1 4.1l1.4 1.4M12.5 12.5l1.4 1.4M4.1 13.9l1.4-1.4M12.5 5.5l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {!collapsed && <span>Settings</span>}
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:'10px', padding: collapsed ? '9px 0' : '9px 10px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius:'10px', cursor:'pointer', transition:'background 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          title={collapsed ? 'Brittani' : undefined}
        >
          <div style={{ width:'26px', height:'26px', borderRadius:'50%', background:'linear-gradient(135deg,#FEA877,#FF7776)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:800, color:'#FFFFFF', flexShrink:0 }}>B</div>
          {!collapsed && <span style={{ fontSize:'13px', fontWeight:600, color:'#2D1F4A', fontFamily:FONT }}>Brittani</span>}
        </div>
      </div>

    </div>
  )
}