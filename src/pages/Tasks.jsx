import { useState, useRef, useEffect } from 'react'

// Inject responsive styles once
const RESPONSIVE_CSS = `
  .tasks-widgets { display: flex; gap: 8px; flex-wrap: nowrap; margin-bottom: 16px; }
  .tasks-widget-card { flex: 1; min-width: 0; }
  .tasks-widget-num   { font-size: clamp(18px, 2vw, 28px); }
  .tasks-widget-icon  { width: clamp(22px, 2vw, 32px); height: clamp(22px, 2vw, 32px); }
  .tasks-widget-label { font-size: clamp(8px, 0.65vw, 11px); margin-top: 3px; }
  .tasks-widget-sub   { font-size: clamp(7px, 0.6vw, 10px); margin-top: 1px; }
  .task-two-col { display: grid; grid-template-columns: 1fr 1fr; }
  .tasks-ai-cards { display: flex; gap: 10px; align-items: flex-end; align-self: stretch; }
  .tasks-hamburger { display: none; }
  @media (max-width: 500px) {
    .tasks-widgets { display: none; }
    .task-two-col { grid-template-columns: 1fr; }
    .tasks-ai-cards { display: none !important; }
    .tasks-hamburger { display: flex !important; }
  }
  @keyframes confetti-fall {
    0%   { transform: translateY(-10px) rotate(0deg);    opacity: 1; }
    100% { transform: translateY(120px) rotate(900deg);  opacity: 0; }
  }
  .confetti-piece { position: fixed; pointer-events: none; animation: confetti-fall 1.2s ease-out forwards; z-index: 9999; }
  @keyframes orb-pulse {
    0%, 100% { transform: scale(1);    opacity: 0.9; }
    50%       { transform: scale(1.08); opacity: 1;   }
  }
  @keyframes popup-in {
    from { opacity: 0; transform: scale(0.95) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes orb-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes orb-active {
    0%, 100% { transform: scale(1.05); }
    50%       { transform: scale(1.18); }
  }
  .orb-idle    { animation: orb-pulse 3s ease-in-out infinite; }
  .orb-loading { animation: orb-active 0.8s ease-in-out infinite; }
`
function InjectStyles() {
  useEffect(() => {
    let el = document.getElementById('moad-tasks-styles')
    if (!el) { el = document.createElement('style'); el.id = 'moad-tasks-styles'; document.head.appendChild(el) }
    el.textContent = RESPONSIVE_CSS
  }, [])
  return null
}

// ─── MOAD DESIGN TOKENS ──────────────────────────────────────────────────────
const C = {
  bg:             '#F9FAFE',
  card:           '#FFFFFF',
  border:         'rgba(168,115,239,0.10)',
  textPrimary:    '#2D1F4A',
  textSecond:     '#9793A0',
  textMuted:      '#C0BACC',
  brightLavender: '#A873EF',
  mauve:          '#D39EF6',
  lavenderVeil:   '#EBDBFC',
  grapefruitPink: '#FF7776',
  tangerineDream: '#FEA877',
  navajoWhite:    '#FEDBA9',
  aquamarine:     '#94F2DB',
  teaGreen:       '#D6EEC9',
  shadowSm:       '0 2px 12px rgba(100,60,180,0.10), 0 1px 3px rgba(100,60,180,0.06)',
  shadowMd:       '0 8px 28px rgba(100,60,180,0.16), 0 2px 8px rgba(100,60,180,0.08)',
}
const FONT = "'Plus Jakarta Sans', -apple-system, sans-serif"

const P = {
  purple1:    { bg: '#A873EF', color: '#FFFFFF'  },
  purple2:    { bg: '#D39EF6', color: '#2D1F4A'  },
  purple3:    { bg: '#EBDBFC', color: '#A873EF'  },
  grape1:     { bg: '#FF7776', color: '#FFFFFF'  },
  grape2:     { bg: '#FFE8E8', color: '#FF7776'  },
  tangerine1: { bg: '#FEA877', color: '#2D1F4A'  },
  tangerine2: { bg: '#FEDBA9', color: '#2D1F4A'  },
  aqua1:      { bg: '#94F2DB', color: '#2D1F4A'  },
  aqua2:      { bg: '#D4F8EE', color: '#2D1F4A'  },
  green:      { bg: '#D6EEC9', color: '#2D1F4A'  },
  grey1:      { bg: '#9793A0', color: '#FFFFFF'  },
  grey2:      { bg: '#EDEDF0', color: '#9793A0'  },
}

const SUBTAG = {
  Finance:       P.green,
  Household:     P.tangerine2,
  Cars:          P.grape2,
  Kids:          P.aqua2,
  Family:        P.purple3,
  Hobbies:       P.purple3,
  Travel:        P.aqua1,
  Miscellaneous: P.grey2,
}

// Section config — all labels #2D1F4A, color lives in icon badge only
const SECTIONS = [
  { key: 'today',     label: 'Today / Urgent', labelColor: '#2D1F4A', countPill: P.purple3,    iconBg: '#A873EF', iconColor: '#FFFFFF', icon: 'flame'    },
  { key: 'week',      label: 'This Week',       labelColor: '#2D1F4A', countPill: P.grape1,     iconBg: '#FF7776', iconColor: '#FFFFFF', icon: 'calendar' },
  { key: 'nextweek',  label: 'Next Week',       labelColor: '#2D1F4A', countPill: P.aqua1,      iconBg: '#94F2DB', iconColor: '#FFFFFF', icon: 'calendar' },
  { key: 'waiting',   label: 'Waiting',         labelColor: '#2D1F4A', countPill: P.tangerine2, iconBg: '#FEDBA9', iconColor: '#FFFFFF', icon: 'clock'    },
  { key: 'delegate',  label: 'To Delegate',     labelColor: '#2D1F4A', countPill: P.tangerine2, iconBg: '#FEDBA9', iconColor: '#FFFFFF', icon: 'user'     },
  { key: 'backlog',   label: 'Backlog',         labelColor: '#2D1F4A', countPill: P.tangerine1, iconBg: '#FEA877', iconColor: '#FFFFFF', icon: 'inbox'    },
  { key: 'completed', label: 'Completed',       labelColor: '#2D1F4A', countPill: P.green,      iconBg: '#D6EEC9', iconColor: '#FFFFFF', icon: 'check'    },
]

// ─── TASK DATA ───────────────────────────────────────────────────────────────
const initialData = {
  today: [
    { id: 94,   createdAt: '2026-03-08T10:00:00Z', title: 'Block time reports: Oct - current',            category: 'work', type: 'internal', est: '20m' },
    { id: 91,   createdAt: '2026-03-18T10:00:00Z', title: 'Bank recs Jan 2025',                           category: 'work', type: 'internal', est: '1h' },
    { id: 9,    createdAt: '2026-03-25T10:00:00Z', title: 'BO - OVERDUE',                                 category: 'work', type: 'internal', est: '30m' },
    { id: 1466, createdAt: '2026-04-01T10:00:00Z', title: 'Add Heather to GoWP',                          category: 'work', type: 'client',   est: '30m' },
    { id: 54,   createdAt: '2026-04-05T10:00:00Z', title: 'Off-board Sophos',                             category: 'work', type: 'client',   client: 'Sophos',       est: '30m' },
    { id: 26,   createdAt: '2026-04-01T10:00:00Z', title: 'Close Bulwark',                                category: 'work', type: 'client',   client: 'Bulwark',      est: '30m' },
    { id: 53,   createdAt: '2026-03-25T10:00:00Z', title: 'Off-board Josh Bean',                          category: 'work', type: 'client',   client: 'Josh Bean',    est: '30m' },
    { id: 1576, title: 'Send Price Increase Emails in Phases',         category: 'work', type: 'internal', est: '2h' },
    { id: 62,   createdAt: '2026-03-18T10:00:00Z', title: 'Kyle Largent: clean up ClickUp mess',          category: 'work', type: 'client',   client: 'Kyle Largent', est: '30m' },
    { id: 1490, title: "Hannah's hours fix",                           category: 'work', type: 'internal', est: '1h' },
    { id: 154,  title: 'Deckmasters Privacy Policy',                   category: 'work', type: 'client',   client: 'Deckmasters',  est: '45m' },
    { id: 10,   createdAt: '2026-02-25T10:00:00Z', title: 'Update open invoices',                         category: 'work', type: 'internal', est: '1h' },
    { id: 167,  title: "BurnBot: Review Alejandro's GA4 plugin setup", category: 'work', type: 'client',   client: 'BurnBot',      est: '1h' },
    { id: 1071, title: 'Call for Unitus statements',                   category: 'work', type: 'internal', est: '1h' },
    { id: 1075, title: 'Run Wednesday meeting through AI',             category: 'work', type: 'client',   est: '1h' },
    { id: 1236, title: 'Send Stellar J invoice - 1 year at $59',      category: 'work', type: 'client',   client: 'Stellar J',    est: '1h' },
    { id: 1239, title: 'Point Daniela site - email A record',         category: 'work', type: 'client',   est: '1h' },
    { id: 1007, title: 'Codefinity Lessons',                           category: 'personal', subTag: 'Hobbies', est: '1h',  recur: 'daily' },
    { id: 1560, title: 'Fix repository API issue',                     category: 'personal', subTag: 'Hobbies', est: '30m', due: '2026-04-09' },
  ],
  week: [
    { id: 51,   title: 'Cascade Tech: identify theme, coordinate GoWP update', category: 'work', type: 'client', client: 'Cascade Tech', assignee: 'Holly', est: '30m' },
    { id: 4,    title: 'MPC: Check block time; follow up with Julie on SOW',   category: 'work', type: 'client', client: 'MPC',          est: '15m' },
    { id: 25,   title: 'Pautzke issue',                                category: 'work', type: 'client',   client: 'Pautzke',      est: '30m' },
    { id: 1009, title: 'Send CFTH retainer and monthly plan invoice',  category: 'work', type: 'client',   client: 'CFTH',         est: '1h' },
    { id: 169,  title: 'Investigate connecting SalesAt Claude to Drive', category: 'work', type: 'internal', est: '45m' },
    { id: 11,   title: 'Investigate phishing/spam emails impersonating Abby', category: 'work', type: 'internal', est: '15m' },
    { id: 1728, title: 'Bank Recs Feb 2025',                           category: 'work', type: 'internal', est: '2h' },
    { id: 1729, title: 'Bank Recs March 2025',                         category: 'work', type: 'internal', est: '2h' },
    { id: 1973, title: 'What is this MPC ClickUp list?',               category: 'work', type: 'client',   client: 'MPC',          est: '30m' },
    { id: 6,    title: 'Cascade Tech: Add CAPTCHA to forms',           category: 'work', type: 'client',   client: 'Cascade Tech', est: '20m' },
    { id: 30,   title: 'Cascade Tech forms cleanup',                   category: 'work', type: 'client',   client: 'Cascade Tech', est: '30m' },
    { id: 61,   title: 'Clean out old clients in ClickUp',             category: 'work', type: 'internal', est: '30m' },
    { id: 170,  title: 'Update build instructions: Termageddon for GA4', category: 'work', type: 'internal', est: '30m' },
  ],
  nextweek: [
    { id: 55,   title: "Clean up ClickUp for Sarah's Garden",          category: 'work', type: 'client',   client: "Sarah's Garden", est: '30m' },
    { id: 1498, title: 'HH Wood Recycler Pricing Changes eff. 4/13',  category: 'work', type: 'client',   client: 'H & H',          est: '30m', due: '2026-04-14' },
    { id: 114,  title: 'Add employee annual reviews to calendar',      category: 'work', type: 'internal', est: '20m' },
    { id: 101,  title: 'Registered agents: Nevada + Missouri',         category: 'work', type: 'internal', est: '30m' },
    { id: 1378, title: 'March Invoices',                               category: 'work', type: 'internal', est: '1h' },
    { id: 57,   title: 'GoDaddy for Abby: spykerimaging hosting',     category: 'work', type: 'internal', assignee: 'Abby', est: '20m' },
    { id: 82,   title: 'Investigate clients on hosting without maintenance', category: 'work', type: 'client', est: '45m' },
    { id: 143,  title: 'Look into certifications',                     category: 'personal', subTag: 'Miscellaneous', est: '30m' },
    { id: 1794, title: 'Update Personal Resume',                       category: 'personal', subTag: 'Miscellaneous', est: '30m' },
    { id: 64,   title: 'PDF for Calli',                                category: 'personal', subTag: 'Family',        est: '30m' },
  ],
  backlog: [
    { id: 80,  title: 'Plan for notifying hosting-only clients',               category: 'work', type: 'client',   est: '30m' },
    { id: 81,  title: 'Email series for non-maintenance clients',              category: 'work', type: 'client',   est: '15m' },
    { id: 84,  title: 'PCI Compliance (DSS 4.0): Stripe, Shopify review',     category: 'work', type: 'client',   est: '30m' },
    { id: 85,  title: 'PCI: Review Connections Cafe, Alder Creek, Premier',   category: 'work', type: 'client',   est: '30m' },
    { id: 90,  title: 'Go through recurring invoices for tax issues',          category: 'work', type: 'internal', est: '1h' },
    { id: 92,  title: 'Bank rec January 2026',                                 category: 'work', type: 'internal', est: '1h' },
    { id: 93,  title: 'Bank rec February 2026',                                category: 'work', type: 'internal', est: '1h' },
    { id: 95,  title: 'New DOR apportionment process',                         category: 'work', type: 'internal', est: '30m' },
    { id: 96,  title: 'Oregon DOR 2022: payroll done incorrectly',             category: 'work', type: 'internal', est: '20m' },
    { id: 97,  title: 'WA DOR follow-up on apportionments 2025',              category: 'work', type: 'internal', est: '15m' },
    { id: 100, title: 'NWMC liability insurance: find / change carrier',       category: 'work', type: 'internal', est: '30m' },
    { id: 102, title: 'NWMC codes & important info: save to Drive',           category: 'work', type: 'internal', est: '30m' },
    { id: 103, title: 'Hosting & maintenance list: clean up Airtable',        category: 'work', type: 'internal', est: '30m' },
    { id: 104, title: 'GSuite: clean up users',                                category: 'work', type: 'internal', est: '30m' },
    { id: 106, title: '2FA: shared email/alias for team access',              category: 'work', type: 'internal', est: '15m' },
    { id: 107, title: 'Company intranet/dashboard setup',                      category: 'work', type: 'internal', est: '1h' },
    { id: 110, title: 'Company SLA & proposal documents',                     category: 'work', type: 'internal', est: '30m' },
    { id: 112, title: 'Company SOPs',                                          category: 'work', type: 'internal', est: '30m' },
    { id: 113, title: 'Hiring process documentation',                          category: 'work', type: 'internal', est: '30m' },
    { id: 115, title: 'ClickUp full cleanup',                                  category: 'work', type: 'internal', est: '30m' },
    { id: 120, title: 'TARDIS / Personal AI project',                          category: 'work', type: 'internal', est: '30m' },
    { id: 121, title: 'Client dashboard (AI project)',                         category: 'work', type: 'internal', est: '30m' },
    { id: 122, title: 'Triage email automation (AI project)',                  category: 'work', type: 'internal', est: '15m' },
    { id: 123, title: 'Company wiki (AI project)',                             category: 'work', type: 'internal', est: '30m' },
    { id: 36,  title: 'Fix ImprovMX: help@ alias',                            category: 'work', type: 'internal', est: '1h' },
    { id: 37,  title: 'Troubleshoot SupportBee forwarding to Holly',          category: 'work', type: 'internal', est: '15m' },
    { id: 130, title: "Chris' 2021-2023 taxes",                                category: 'personal', subTag: 'Finance',       est: '2h' },
    { id: 131, title: 'Our 2024 taxes',                                        category: 'personal', subTag: 'Finance',       est: '2h' },
    { id: 132, title: '2025 taxes',                                            category: 'personal', subTag: 'Finance',       est: '2h' },
    { id: 133, title: 'Update debt spreadsheet to current',                    category: 'personal', subTag: 'Finance',       est: '30m' },
    { id: 134, title: 'Sew bathroom curtains',                                 category: 'personal', subTag: 'Household',     est: '2h' },
    { id: 135, title: 'Pick paint for bathroom',                               category: 'personal', subTag: 'Household',     est: '2h' },
    { id: 136, title: 'Paint bathroom',                                        category: 'personal', subTag: 'Household',     est: '2h' },
    { id: 138, title: 'Clean up room and organize',                            category: 'personal', subTag: 'Household',     est: '45m' },
    { id: 140, title: "Hubby's sweater",                                       category: 'personal', subTag: 'Hobbies',       est: '30m' },
    { id: 141, title: 'Sew jumpsuit',                                          category: 'personal', subTag: 'Hobbies',       est: '2h' },
    { id: 142, title: 'Order maverick quillow fabric (~$60)',                  category: 'personal', subTag: 'Hobbies',       est: '15m' },
  ],
  waiting: [
    { id: 1006, title: 'Danielle at Bloom Services: broken Yoast plugin',     category: 'work', type: 'client', client: 'Bloom Services', est: '30m', details: "Waiting on Danielle's response." },
    { id: 1007, title: 'Poolmasters: waiting on Eric for Mailchimp',          category: 'work', type: 'client', client: 'Poolmasters',    est: '30m' },
    { id: 1008, title: 'Send Poolmasters invoice',                             category: 'work', type: 'client', client: 'Poolmasters',    est: '1h',  details: 'Waiting on Eric approval.' },
    { id: 20,   title: 'Schedule call with Scott at CCSI re: security scan',  category: 'work', type: 'client', client: 'CCSI',           est: '15m', details: 'Include Abby.' },
    { id: 171,  title: 'BurnBot: Follow up on reverse proxy and DNS',         category: 'work', type: 'client', client: 'BurnBot',        est: '15m', details: 'Waiting on Abby.' },
    { id: 56,   title: "Check hosting & maintenance for Sarah's Garden",      category: 'work', type: 'client', client: "Sarah's Garden", est: '15m', due: '2026-04-15', details: 'Invoice sends mid April.' },
    { id: 1003, title: 'Send SOW to CFTH (Charlene) for branding retainer',  category: 'work', type: 'client', client: 'CFTH',           est: '20m' },
    { id: 22,   title: 'CCSI: Check if they finished their updates',          category: 'work', type: 'client', client: 'CCSI',           est: '30m' },
    { id: 1057, title: 'Stellar J - Decision needed for Staging Site',        category: 'work', type: 'client', client: 'Stellar J',      est: '15m', details: 'Waiting on Stellar J.' },
    { id: 1631, title: 'Payroll',                                              category: 'work', type: 'internal', est: '2h', recur: 'weekly' },
  ],
  delegate:  [],
  completed: [],
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const EST_MINS = { '15m':15,'30m':30,'45m':45,'1h':60,'2h':120,'3h+':180 }
const sumMins  = ts => ts.reduce((s,t) => s+(EST_MINS[t.est]||0),0)
const fmtMins  = m => { if(!m) return '0h'; const h=Math.floor(m/60),r=m%60; return r?`${h}h ${r}m`:`${h}h` }
const fmtDue   = str => {
  if(!str) return null
  const d=new Date(str+'T00:00:00'), today=new Date(); today.setHours(0,0,0,0)
  const diff=Math.round((d-today)/86400000)
  if(diff<0)   return { label:`${Math.abs(diff)}d overdue`, overdue:true }
  if(diff===0) return { label:'Today',    overdue:false }
  if(diff===1) return { label:'Tomorrow', overdue:false }
  if(diff<7)   return { label:`${diff}d`, overdue:false }
  return { label:d.toLocaleDateString('en-US',{month:'short',day:'numeric'}), overdue:false }
}
const fmtDaysInList = createdAt => {
  if(!createdAt) return null
  const diff = Math.round((Date.now() - new Date(createdAt)) / 86400000)
  if(diff < 1)  return null
  if(diff < 7)  return { label:`${diff}d`, old: false }
  if(diff < 30) return { label:`${Math.floor(diff/7)}w`, old: true }
  return { label:`${Math.floor(diff/30)}mo`, old: true }
}

// ─── SVG ICONS ───────────────────────────────────────────────────────────────
function Icon({ name, size=20, color='currentColor' }) {
  const s = { width:size, height:size, display:'block', flexShrink:0 }
  switch(name) {
    case 'flame':    return <svg style={s} viewBox="0 0 20 20" fill="none"><path d="M10 3s2.5 3 2.5 6c0 1.4-.5 2.6-1.3 3.5.4-.7.8-1.6.8-2.5 0-2-2-4-2-4s-2 2-2 4c0 .9.4 1.8.8 2.5C7.5 11.6 7 10.4 7 9c0-3 3-6 3-6z" fill={color}/><path d="M10 17a5 5 0 01-5-5c0-3 2.5-5.5 5-7 2.5 1.5 5 4 5 7a5 5 0 01-5 5z" stroke={color} strokeWidth="1.4" fill={color} fillOpacity="0.15"/></svg>
    case 'calendar': return <svg style={s} viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="13" rx="2.5" stroke={color} strokeWidth="1.4"/><path d="M3 9h14" stroke={color} strokeWidth="1.4"/><line x1="7" y1="2" x2="7" y2="6" stroke={color} strokeWidth="1.4" strokeLinecap="round"/><line x1="13" y1="2" x2="13" y2="6" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></svg>
    case 'clock':    return <svg style={s} viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.4"/><path d="M10 6.5v4l2.5 2.5" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></svg>
    case 'inbox':    return <svg style={s} viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="12" rx="2" stroke={color} strokeWidth="1.4"/><path d="M3 12h4l1.5 2h3L13 12h4" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/></svg>
    case 'user':     return <svg style={s} viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke={color} strokeWidth="1.4"/><path d="M3 18c0-4 3.1-7 7-7s7 3 7 7" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></svg>
    case 'check':    return <svg style={s} viewBox="0 0 20 20" fill="none"><path d="M4 10l4.5 4.5L16 6" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'filter':   return <svg style={s} viewBox="0 0 20 20" fill="none"><line x1="2" y1="5" x2="18" y2="5" stroke={color} strokeWidth="1.4" strokeLinecap="round"/><circle cx="6"  cy="5"  r="2" fill={color}/><line x1="2" y1="10" x2="18" y2="10" stroke={color} strokeWidth="1.4" strokeLinecap="round"/><circle cx="14" cy="10" r="2" fill={color}/><line x1="2" y1="15" x2="18" y2="15" stroke={color} strokeWidth="1.4" strokeLinecap="round"/><circle cx="9"  cy="15" r="2" fill={color}/></svg>
    case 'search':   return <svg style={s} viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="5.5" stroke={color} strokeWidth="1.4"/><path d="M13.5 13.5L17 17" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></svg>
    case 'move':     return <svg style={s} viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10l6-6 6 6M4 14l6 6 6-6" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'edit':     return <svg style={s} viewBox="0 0 20 20" fill="none"><path d="M14.5 3.5l2 2L6 16H4v-2L14.5 3.5z" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/><path d="M12.5 5.5l2 2" stroke={color} strokeWidth="1.4"/></svg>
    default: return null
  }
}

// ─── PILL ────────────────────────────────────────────────────────────────────
function Pill({ label, pill }) {
  return (
    <span style={{
      fontSize:'10px', fontWeight:600, fontFamily:FONT,
      display:'inline-flex', alignItems:'center',
      padding:'2px 8px', borderRadius:'20px',
      background:pill.bg, color:pill.color, whiteSpace:'nowrap',
    }}>{label}</span>
  )
}

// ─── MOVE DROPDOWN ───────────────────────────────────────────────────────────
function MoveMenu({ currentSection, onMove, onClose }) {
  const ref = useRef()
  useEffect(() => {
    function handle(e) { if(ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  return (
    <div ref={ref} style={{
      position:'absolute', right:0, top:'calc(100% + 4px)', zIndex:100,
      background:C.card, border:`1px solid ${C.border}`, borderRadius:'12px',
      boxShadow:C.shadowMd, padding:'6px', minWidth:'160px',
    }}>
      <div style={{ fontSize:'9px', fontWeight:700, color:C.textMuted, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'0.08em', padding:'4px 8px 6px' }}>Move to</div>
      {SECTIONS.filter(s => s.key !== currentSection).map(s => (
        <button key={s.key} onClick={() => { onMove(s.key); onClose() }}
          style={{ display:'block', width:'100%', textAlign:'left', padding:'7px 10px', borderRadius:'8px', border:'none', background:'transparent', fontSize:'12px', fontWeight:500, fontFamily:FONT, color:s.labelColor, cursor:'pointer', transition:'background 0.12s' }}
          onMouseEnter={e=>{ e.currentTarget.style.background=C.bg }}
          onMouseLeave={e=>{ e.currentTarget.style.background='transparent' }}
        >{s.label}</button>
      ))}
    </div>
  )
}

// ─── TASK ROW ────────────────────────────────────────────────────────────────
function TaskRow({ task, sectionKey, onComplete, onDelete, onMove, onEdit, onOpenEdit, isLast }) {
  const [hov, setHov]           = useState(false)
  const [showMove, setShowMove] = useState(false)
  const [editing, setEditing]   = useState(false)
  const [editVal, setEditVal]   = useState(task.title)
  const inputRef = useRef()
  const due = fmtDue(task.due)
  const dil = fmtDaysInList(task.createdAt)
  const isPersonal = task.category === 'personal'

  function startEdit(e) {
    e.stopPropagation()
    setEditVal(task.title)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function saveEdit() {
    const trimmed = editVal.trim()
    if (trimmed && trimmed !== task.title) onEdit(sectionKey, task.id, { title: trimmed })
    setEditing(false)
  }

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position:'relative',
        display:'flex', alignItems:'center', gap:'10px',
        padding:'10px 14px',
        background: hov ? C.bg : 'transparent',
        borderBottom: isLast ? 'none' : '1px solid rgba(45,32,64,0.05)',
        transition:'background 0.12s',
      }}
    >
      {/* Checkbox */}
      <div
        onClick={e => onComplete(sectionKey, task.id, e)}
        style={{
          width:'15px', height:'15px', borderRadius:'4px', flexShrink:0,
          border:`1.5px solid ${hov ? C.brightLavender : C.lavenderVeil}`,
          background:'transparent', cursor:'pointer', transition:'all 0.15s',
        }}
        onMouseEnter={e=>{ e.currentTarget.style.background='rgba(168,115,239,0.10)' }}
        onMouseLeave={e=>{ e.currentTarget.style.background='transparent' }}
      />

      {/* Title + details */}
      <div style={{ flex:1, minWidth:0 }}>
        {editing ? (
          <input
            ref={inputRef}
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={e => { if (e.key==='Enter') saveEdit(); if (e.key==='Escape') { setEditing(false); setEditVal(task.title) } }}
            style={{
              width:'100%', fontSize:'13px', fontWeight:500, fontFamily:FONT,
              color:C.textPrimary, background:'transparent',
              border:'none', borderBottom:`1.5px solid ${C.brightLavender}`,
              outline:'none', padding:'0', lineHeight:'18px', boxSizing:'border-box',
            }}
          />
        ) : (
          <div
            onClick={startEdit}
            title="Click to edit"
            style={{ fontSize:'13px', fontWeight:500, color:C.textPrimary, fontFamily:FONT, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', lineHeight:'18px', cursor:'text' }}
          >
            {task.title}
          </div>
        )}
        {task.details && !editing && (
          <div style={{ fontSize:'11px', color:C.textSecond, fontFamily:FONT, marginTop:'1px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {task.details}
          </div>
        )}
      </div>

      {/* Right pills */}
      <div style={{ display:'flex', gap:'5px', alignItems:'center', flexShrink:0 }}>
        {isPersonal && task.subTag  && <Pill label={task.subTag}   pill={SUBTAG[task.subTag]||P.grey2} />}
        {!isPersonal && task.client && <Pill label={task.client}   pill={P.purple3} />}
        {!isPersonal && !task.client && <Pill label="Internal"     pill={P.aqua2} />}
        {task.assignee              && <Pill label={task.assignee} pill={P.tangerine1} />}
        {task.recur                 && <Pill label={task.recur}    pill={P.purple3} />}
        {due && <Pill label={due.label} pill={due.overdue ? P.grape1 : P.tangerine2} />}
        {dil && <span style={{ fontSize:'9px', fontWeight:700, padding:'2px 6px', borderRadius:'20px', background: dil.old ? '#FFE8E8' : C.bg, color: dil.old ? '#FF7776' : C.textMuted, fontFamily:FONT, border:`1px solid ${dil.old ? '#FFE8E8' : C.border}` }}>{dil.label}</span>}
        {task.est && <span style={{ fontSize:'10px', fontWeight:600, color:C.textMuted, fontFamily:FONT, minWidth:'28px', textAlign:'right' }}>{task.est}</span>}
      </div>

      {/* Action buttons — visible on hover */}
      {hov && (
        <div style={{ display:'flex', gap:'2px', alignItems:'center', flexShrink:0, position:'relative' }}>
          {/* Edit */}
          <button
            onClick={e=>{ e.stopPropagation(); onOpenEdit(task, sectionKey) }}
            title="Edit task"
            style={{ background:'none', border:'none', cursor:'pointer', color:C.textMuted, padding:'3px', borderRadius:'5px', display:'flex', alignItems:'center', transition:'color 0.15s, background 0.15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.color=C.brightLavender; e.currentTarget.style.background=C.lavenderVeil }}
            onMouseLeave={e=>{ e.currentTarget.style.color=C.textMuted; e.currentTarget.style.background='none' }}
          >
            <Icon name="edit" size={13} color="currentColor" />
          </button>
          {/* Move */}
          <button
            onClick={e=>{ e.stopPropagation(); setShowMove(v=>!v) }}
            title="Move to section"
            style={{ background:'none', border:'none', cursor:'pointer', color:C.textMuted, padding:'3px', borderRadius:'5px', display:'flex', alignItems:'center', transition:'color 0.15s, background 0.15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.color=C.brightLavender; e.currentTarget.style.background=C.lavenderVeil }}
            onMouseLeave={e=>{ e.currentTarget.style.color=C.textMuted; e.currentTarget.style.background='none' }}
          >
            <Icon name="move" size={14} color="currentColor" />
          </button>
          {/* Delete */}
          <button
            onClick={() => onDelete(sectionKey, task.id)}
            style={{ background:'none', border:'none', cursor:'pointer', color:C.textMuted, fontSize:'16px', lineHeight:1, padding:'3px', borderRadius:'5px', fontFamily:FONT, display:'flex', alignItems:'center', transition:'color 0.15s, background 0.15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.color=C.grapefruitPink; e.currentTarget.style.background='#FFE8E8' }}
            onMouseLeave={e=>{ e.currentTarget.style.color=C.textMuted; e.currentTarget.style.background='none' }}
          >×</button>
          {/* Move dropdown */}
          {showMove && (
            <MoveMenu
              currentSection={sectionKey}
              onMove={toKey => onMove(sectionKey, task.id, toKey)}
              onClose={() => setShowMove(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ─── TASK EDIT DRAWER ────────────────────────────────────────────────────────
function TaskEditDrawer({ task, sectionKey, sections, onSave, onClose }) {
  const [form, setForm] = useState({ ...task })
  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const inp = {
    width:'100%', padding:'8px 12px', borderRadius:'8px', border:`1.5px solid ${C.border}`,
    fontSize:'13px', fontFamily:FONT, color:C.textPrimary, background:C.bg,
    outline:'none', boxSizing:'border-box', transition:'border-color 0.15s',
  }
  const label = { fontSize:'10px', fontWeight:700, color:C.textSecond, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'5px', display:'block' }
  const row = { marginBottom:'14px' }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(45,32,74,0.30)', zIndex:300 }} />

      {/* Drawer */}
      <div style={{ position:'fixed', top:0, right:0, width:'360px', height:'100vh', background:C.card, zIndex:301, boxShadow:'-8px 0 40px rgba(45,32,74,0.18)', display:'flex', flexDirection:'column', overflowY:'auto' }}>
        {/* Header */}
        <div style={{ padding:'20px 20px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:'16px', fontWeight:800, color:C.textPrimary, fontFamily:FONT }}>Edit Task</div>
            <div style={{ fontSize:'11px', color:C.textSecond, fontFamily:FONT, marginTop:'2px' }}>{SECTION_LABEL[sectionKey]}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.textMuted, fontSize:'22px', cursor:'pointer', lineHeight:1, fontFamily:FONT }}>×</button>
        </div>

        {/* Form */}
        <div style={{ padding:'20px', flex:1, overflowY:'auto' }}>
          {/* Title */}
          <div style={row}>
            <span style={label}>Title</span>
            <input value={form.title||''} onChange={e=>f('title',e.target.value)}
              style={inp} placeholder="Task title"
              onFocus={e=>{ e.currentTarget.style.borderColor=C.brightLavender }}
              onBlur={e=>{ e.currentTarget.style.borderColor=C.border }}
            />
          </div>

          {/* Details / notes */}
          <div style={row}>
            <span style={label}>Notes</span>
            <textarea value={form.details||''} onChange={e=>f('details',e.target.value)}
              rows={3} placeholder="Add notes..."
              style={{ ...inp, resize:'vertical', lineHeight:'1.5' }}
              onFocus={e=>{ e.currentTarget.style.borderColor=C.brightLavender }}
              onBlur={e=>{ e.currentTarget.style.borderColor=C.border }}
            />
          </div>

          {/* Section */}
          <div style={row}>
            <span style={label}>Section</span>
            <select value={form.section||sectionKey} onChange={e=>f('section',e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              {sections.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>

          {/* Category */}
          <div style={row}>
            <span style={label}>Category</span>
            <div style={{ display:'flex', gap:'8px' }}>
              {['work','personal'].map(cat => (
                <button key={cat} onClick={()=>f('category',cat)}
                  style={{ flex:1, padding:'8px', borderRadius:'8px', border:`1.5px solid ${form.category===cat?C.brightLavender:C.border}`, background:form.category===cat?C.lavenderVeil:C.bg, color:form.category===cat?C.brightLavender:C.textSecond, fontSize:'12px', fontWeight:700, fontFamily:FONT, cursor:'pointer', transition:'all 0.15s', textTransform:'capitalize' }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Work fields */}
          {form.category==='work' && (
            <>
              <div style={row}>
                <span style={label}>Type</span>
                <div style={{ display:'flex', gap:'8px' }}>
                  {['client','internal'].map(t => (
                    <button key={t} onClick={()=>f('type',t)}
                      style={{ flex:1, padding:'8px', borderRadius:'8px', border:`1.5px solid ${form.type===t?C.brightLavender:C.border}`, background:form.type===t?C.lavenderVeil:C.bg, color:form.type===t?C.brightLavender:C.textSecond, fontSize:'12px', fontWeight:700, fontFamily:FONT, cursor:'pointer', transition:'all 0.15s', textTransform:'capitalize' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {form.type==='client' && (
                <div style={row}>
                  <span style={label}>Client</span>
                  <input value={form.client||''} onChange={e=>f('client',e.target.value)}
                    style={inp} placeholder="Client name"
                    onFocus={e=>{ e.currentTarget.style.borderColor=C.brightLavender }}
                    onBlur={e=>{ e.currentTarget.style.borderColor=C.border }}
                  />
                </div>
              )}
              <div style={row}>
                <span style={label}>Assignee</span>
                <input value={form.assignee||''} onChange={e=>f('assignee',e.target.value)}
                  style={inp} placeholder="e.g. Holly, Abby"
                  onFocus={e=>{ e.currentTarget.style.borderColor=C.brightLavender }}
                  onBlur={e=>{ e.currentTarget.style.borderColor=C.border }}
                />
              </div>
            </>
          )}

          {/* Personal sub-tag */}
          {form.category==='personal' && (
            <div style={row}>
              <span style={label}>Tag</span>
              <select value={form.subTag||''} onChange={e=>f('subTag',e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                <option value="">No tag</option>
                {Object.keys(SUBTAG).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Est + Due side by side */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
            <div>
              <span style={label}>Estimate</span>
              <select value={form.est||''} onChange={e=>f('est',e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                <option value="">None</option>
                {['15m','30m','45m','1h','2h','3h+'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <span style={label}>Due date</span>
              <input type="date" value={form.due||''} onChange={e=>f('due',e.target.value)}
                style={{ ...inp, color: form.due ? C.textPrimary : C.textMuted }}
                onFocus={e=>{ e.currentTarget.style.borderColor=C.brightLavender }}
                onBlur={e=>{ e.currentTarget.style.borderColor=C.border }}
              />
            </div>
          </div>

          {/* Recur */}
          <div style={row}>
            <span style={label}>Recurrence</span>
            <select value={form.recur||''} onChange={e=>f('recur',e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              <option value="">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 20px', borderTop:`1px solid ${C.border}`, display:'flex', gap:'8px', flexShrink:0 }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:'10px', border:`1px solid ${C.border}`, background:'transparent', color:C.textSecond, fontSize:'12px', fontWeight:600, fontFamily:FONT, cursor:'pointer' }}>Cancel</button>
          <button onClick={()=>onSave(sectionKey, task.id, form, form.section||sectionKey)}
            style={{ flex:2, padding:'10px', borderRadius:'10px', border:'none', background:`linear-gradient(135deg,${C.grapefruitPink},${C.tangerineDream})`, color:'#fff', fontSize:'12px', fontWeight:700, fontFamily:FONT, cursor:'pointer', boxShadow:'0 2px 8px rgba(255,119,118,0.25)' }}>
            Save changes
          </button>
        </div>
      </div>
    </>
  )
}

const SECTION_LABEL = Object.fromEntries(SECTIONS.map(s=>[s.key,s.label]))
function Section({ config, tasks, onComplete, onDelete, onMove, onEdit, onOpenEdit, onAdd, onClearCompleted, progressBar }) {
  const [open, setOpen]     = useState(config.key==='today'||config.key==='week')
  const [adding, setAdding] = useState(false)
  const [draft, setDraft]   = useState({ title:'', category:'work', type:'client', client:'', subTag:'', est:'', due:'' })

  const personal = tasks.filter(t => t.category==='personal')
  const work     = tasks.filter(t => t.category==='work')
  const mins     = fmtMins(sumMins(tasks))

  function submitAdd() {
    if(!draft.title.trim()) return
    onAdd(config.key, { ...draft, id:Date.now(), title:draft.title.trim() })
    setDraft({ title:'', category:'work', type:'client', client:'', subTag:'', est:'', due:'' })
    setAdding(false)
  }

  const sel = {
    fontSize:'11px', fontFamily:FONT, padding:'6px 10px', borderRadius:'8px',
    border:`1.5px solid ${C.border}`, background:C.card, color:C.textPrimary, outline:'none', cursor:'pointer',
  }

  return (
    <div
      style={{ background:C.card, borderRadius:'16px', border:`1px solid ${C.border}`, boxShadow:C.shadowSm, marginBottom:'10px', overflow:'hidden', transition:'box-shadow 0.2s, transform 0.2s' }}
      onMouseEnter={e=>{ e.currentTarget.style.boxShadow=C.shadowMd; e.currentTarget.style.transform='translateY(-1px)' }}
      onMouseLeave={e=>{ e.currentTarget.style.boxShadow=C.shadowSm; e.currentTarget.style.transform='translateY(0)' }}
    >
      {/* ── Section header — large heading size whether open or closed ── */}
      <div
        onClick={() => setOpen(o=>!o)}
        style={{
          display:'flex', alignItems:'center', gap:'14px',
          padding:'16px 20px',
          cursor:'pointer', userSelect:'none',
          borderBottom: open ? `1px solid ${C.border}` : 'none',
        }}
      >
        {/* Icon badge — larger */}
        <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:config.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon name={config.icon} size={22} color={config.iconColor} />
        </div>

        {/* Label — Type/Heading 20px 800, always this size */}
        <span style={{ fontSize:'20px', fontWeight:800, fontFamily:FONT, color:config.labelColor, flex:1, letterSpacing:'-0.2px' }}>
          {config.label}
        </span>

        {/* Time estimate */}
        <span style={{ fontSize:'12px', fontWeight:600, fontFamily:FONT, color:C.textSecond }}>~{mins}</span>

        {/* Clear All — completed section only */}
        {onClearCompleted && tasks.length > 0 && (
          <button onClick={e=>{ e.stopPropagation(); onClearCompleted() }}
            style={{ fontSize:'10px', fontWeight:700, fontFamily:FONT, color:C.grapefruitPink, background:'#FFE8E8', border:'none', borderRadius:'20px', padding:'4px 12px', cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.background=C.grapefruitPink; e.currentTarget.style.color='#fff' }}
            onMouseLeave={e=>{ e.currentTarget.style.background='#FFE8E8'; e.currentTarget.style.color=C.grapefruitPink }}
          >Clear all</button>
        )}

        {/* Count pill */}
        <span style={{ fontSize:'12px', fontWeight:700, fontFamily:FONT, padding:'4px 12px', borderRadius:'20px', background:config.countPill.bg, color:config.countPill.color }}>
          {tasks.length}
        </span>

        {/* Chevron */}
        <span style={{ fontSize:'12px', color:C.textMuted, display:'inline-block', transform:open?'rotate(0)':'rotate(-90deg)', transition:'transform 0.2s', lineHeight:1 }}>▾</span>
      </div>

      {/* ── Body ── */}
      {open && (
        <div>
          {/* Progress bar — today section only */}
          {progressBar && (
            <div style={{ padding:'12px 16px 4px', display:'flex', alignItems:'center', gap:'12px' }}>
              <span style={{ fontSize:'10px', fontWeight:700, color:C.textSecond, fontFamily:FONT, whiteSpace:'nowrap' }}>Today</span>
              <div style={{ flex:1, height:'8px', background:'#EBDBFC', borderRadius:'99px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${progressBar.pct}%`, background:'linear-gradient(90deg,#FF7776,#FFBDBC)', borderRadius:'99px', transition:'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
              </div>
              <span style={{ fontSize:'10px', fontWeight:800, color:'#FF7776', fontFamily:FONT, whiteSpace:'nowrap' }}>{progressBar.done}/{progressBar.total}</span>
            </div>
          )}
          <div className="task-two-col" style={{ borderBottom:`1px solid ${C.border}` }}>
            {/* Work col — left */}
            <div style={{ borderRight:`1px solid ${C.border}` }}>
              <div style={{ fontSize:'10px', fontWeight:700, color:C.textMuted, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'0.08em', padding:'10px 14px 6px' }}>
                Work · {work.length}
              </div>
              {work.length===0
                ? <p style={{ fontSize:'12px', color:C.textMuted, fontFamily:FONT, fontStyle:'italic', padding:'6px 14px 14px', margin:0 }}>Nothing here</p>
                : work.map((t,i) => <TaskRow key={t.id} task={t} sectionKey={config.key} onComplete={onComplete} onDelete={onDelete} onMove={onMove} onEdit={onEdit} onOpenEdit={onOpenEdit} isLast={i===work.length-1} />)
              }
            </div>
            {/* Personal col — right */}
            <div>
              <div style={{ fontSize:'10px', fontWeight:700, color:C.textMuted, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'0.08em', padding:'10px 14px 6px' }}>
                Personal · {personal.length}
              </div>
              {personal.length===0
                ? <p style={{ fontSize:'12px', color:C.textMuted, fontFamily:FONT, fontStyle:'italic', padding:'6px 14px 14px', margin:0 }}>Nothing here</p>
                : personal.map((t,i) => <TaskRow key={t.id} task={t} sectionKey={config.key} onComplete={onComplete} onDelete={onDelete} onMove={onMove} onEdit={onEdit} onOpenEdit={onOpenEdit} isLast={i===personal.length-1} />)
              }
            </div>
          </div>

          {/* Add task */}
          <div style={{ padding:'10px 16px' }}>
            {!adding ? (
              <button onClick={()=>setAdding(true)}
                style={{ background:'none', border:'none', fontSize:'12px', fontWeight:600, fontFamily:FONT, color:C.textMuted, cursor:'pointer', padding:'2px 0', transition:'color 0.15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.color=C.brightLavender }}
                onMouseLeave={e=>{ e.currentTarget.style.color=C.textMuted }}
              >+ Add task</button>
            ) : (
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center' }}>
                <input autoFocus value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))}
                  onKeyDown={e=>{ if(e.key==='Enter') submitAdd(); if(e.key==='Escape') setAdding(false) }}
                  placeholder="Task title..."
                  style={{ ...sel, flex:'1 1 180px', cursor:'text', fontWeight:500, fontSize:'12px', background:C.bg }} />
                <select value={draft.category} onChange={e=>setDraft(d=>({...d,category:e.target.value}))} style={sel}>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                </select>
                {draft.category==='work' ? (
                  <>
                    <select value={draft.type} onChange={e=>setDraft(d=>({...d,type:e.target.value}))} style={sel}>
                      <option value="client">Client</option>
                      <option value="internal">Internal</option>
                    </select>
                    {draft.type==='client' && <input value={draft.client} onChange={e=>setDraft(d=>({...d,client:e.target.value}))} placeholder="Client" style={{ ...sel, width:'90px', cursor:'text', background:C.bg }} />}
                  </>
                ) : (
                  <select value={draft.subTag} onChange={e=>setDraft(d=>({...d,subTag:e.target.value}))} style={sel}>
                    <option value="">Tag</option>
                    {Object.keys(SUBTAG).map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                )}
                <select value={draft.est} onChange={e=>setDraft(d=>({...d,est:e.target.value}))} style={sel}>
                  <option value="">Est.</option>
                  {['15m','30m','45m','1h','2h','3h+'].map(v=><option key={v} value={v}>{v}</option>)}
                </select>
                <input type="date" value={draft.due} onChange={e=>setDraft(d=>({...d,due:e.target.value}))} style={{ ...sel, color:C.textSecond }} />
                <button onClick={submitAdd} style={{ padding:'7px 16px', borderRadius:'8px', border:'none', background:`linear-gradient(135deg,${C.grapefruitPink},${C.tangerineDream})`, color:'#fff', fontSize:'12px', fontWeight:700, fontFamily:FONT, cursor:'pointer', boxShadow:'0 2px 8px rgba(255,119,118,0.25)' }}>Add</button>
                <button onClick={()=>setAdding(false)} style={{ padding:'7px 12px', borderRadius:'8px', border:`1px solid ${C.border}`, background:'transparent', color:C.textSecond, fontSize:'12px', fontFamily:FONT, cursor:'pointer' }}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Tasks({ taskData, setTaskData }) {
  // Local state mirrors shared App state — stays in sync via useEffect
  const [data, setData] = useState(taskData || initialData)

  // When App state changes (e.g. Calendar checks off a task), sync here
  useEffect(() => {
    if (taskData) setData(taskData)
  }, [taskData])

  // Wrap setData to also update App state
  function updateData(updater) {
    setData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (setTaskData) setTaskData(next)
      return next
    })
  }
  const [completedToday, setCompletedToday] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filter, setFilter]         = useState({ category:'all', subTag:'' })
  const [search, setSearch]         = useState('')

  // AI state
  const [triageLoading, setTriageLoading]     = useState(false)
  const [triageResult,  setTriageResult]      = useState(null)
  const [briefing,      setBriefing]          = useState(null)
  const [briefingLoading, setBriefingLoading] = useState(false)
  const [orbState, setOrbState]               = useState('idle')

  function pushNotif(title, body) {
    if(Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' })
    }
  }

  // Manual triage state
  const [manualTriageOpen, setManualTriageOpen] = useState(false)
  const [triageOrder, setTriageOrder]           = useState([])
  const [dragIdx, setDragIdx]                   = useState(null)
  const [hamburgerOpen, setHamburgerOpen]       = useState(false)

  // Manual quick add state (orange + button)
  const [manualAddOpen, setManualAddOpen] = useState(false)

  // Header Task button fires this event — opens the full form
  useEffect(()=>{
    function handler() {
      setManualAddOpen(true)
      setTimeout(()=>manualInputRef.current?.focus(), 100)
    }
    window.addEventListener('moad:openAddTask', handler)
    return ()=>window.removeEventListener('moad:openAddTask', handler)
  }, [])
  const [manualTitle, setManualTitle]     = useState('')
  const [manualSection, setManualSection] = useState('today')
  const [manualCat, setManualCat]         = useState('work')
  const [manualType, setManualType]       = useState('internal')
  const [manualClient, setManualClient]   = useState('')
  const [manualEst, setManualEst]         = useState('')
  const [manualDue, setManualDue]         = useState('')

  function resetManualForm() {
    setManualTitle(''); setManualSection('today'); setManualCat('work')
    setManualType('internal'); setManualClient(''); setManualEst(''); setManualDue('')
  }
  const manualInputRef = useRef()

  // AI Quick Add state (orange AI card)
  const [quickAddOpen, setQuickAddOpen]   = useState(false)
  const [quickInput, setQuickInput]       = useState('')
  const [quickLoading, setQuickLoading]   = useState(false)
  const [quickPreview, setQuickPreview]   = useState(null)
  const [dictating, setDictating]         = useState(false)
  const quickInputRef = useRef()
  const recognitionRef = useRef(null)

  function startDictation() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Speech recognition is not supported in this browser. Try Chrome.'); return }
    if (dictating) {
      recognitionRef.current?.stop()
      setDictating(false)
      return
    }
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = false
    rec.onstart = () => setDictating(true)
    rec.onresult = e => {
      const transcript = Array.from(e.results).map(r=>r[0].transcript).join('')
      setQuickInput(transcript)
      setQuickPreview(null)
    }
    rec.onerror = () => setDictating(false)
    rec.onend = () => setDictating(false)
    recognitionRef.current = rec
    rec.start()
    // Open AI card input, close manual form
    setQuickAddOpen(true)
    setManualAddOpen(false)
    setTimeout(() => quickInputRef.current?.focus(), 100)
  }

  async function runQuickAdd() {
    if (!quickInput.trim()) return
    setQuickLoading(true)
    setQuickPreview(null)
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system: `You are a task parser for Brittani, an Operations & Account Manager at NW Media Collective. Parse natural language into a task object. Return ONLY valid JSON with these fields:
- title: string (clean task title)
- section: one of "today" | "week" | "nextweek" | "backlog" | "waiting" | "delegate"
- category: "work" | "personal"
- type: "client" | "internal" (only if work)
- client: string or "" (client name if mentioned)
- subTag: one of "Finance"|"Household"|"Cars"|"Kids"|"Family"|"Hobbies"|"Travel"|"Miscellaneous"|"" (only if personal)
- est: one of "15m"|"30m"|"45m"|"1h"|"2h"|"3h+"|""
- due: "YYYY-MM-DD" or ""
- recur: "daily"|"weekly"|""
No markdown, no explanation, just JSON.`,
          messages: [{ role: 'user', content: quickInput }]
        })
      })
      const d = await res.json()
      const text = d.content?.[0]?.text || '{}'
      const clean = text.replace(/```json|```/g, '').trim()
      setQuickPreview(JSON.parse(clean))
    } catch {
      setQuickPreview({ title: quickInput.trim(), section: 'today', category: 'work', type: 'internal', client: '', est: '', due: '', recur: '' })
    }
    setQuickLoading(false)
  }

  const idCounterRef = useRef(0)
  function nextId() { idCounterRef.current += 1; return idCounterRef.current + 9000000 }

  function confirmQuickAdd() {
    if (!quickPreview) return
    const { section, ...task } = quickPreview
    addTask(section || 'today', { ...task, id: nextId() })
    setQuickInput('')
    setQuickPreview(null)
    setQuickAddOpen(false)
  }

  function fireConfetti(x, y) {
    const colors = ['#A873EF','#FF7776','#FEA877','#94F2DB','#D6EEC9','#FEDBA9','#D39EF6','#EBDBFC']
    for(let i=0; i<24; i++) {
      const el = document.createElement('div')
      el.className = 'confetti-piece'
      el.style.left  = (x + (Math.random()-0.5)*80) + 'px'
      el.style.top   = (y - 10) + 'px'
      el.style.width  = (8 + Math.random()*10) + 'px'
      el.style.height = (8 + Math.random()*10) + 'px'
      el.style.background = colors[Math.floor(Math.random()*colors.length)]
      el.style.animationDelay = (Math.random()*0.4) + 's'
      el.style.animationDuration = (0.8 + Math.random()*0.6) + 's'
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px'
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 1600)
    }
  }

  const hasFilter = filter.category!=='all' || filter.subTag!==''

  function applyFilter(tasks) {
    return tasks.filter(t => {
      if(filter.category==='personal' && t.category!=='personal') return false
      if(filter.category==='work'     && t.category!=='work')     return false
      if(filter.category==='client'   && t.type!=='client')       return false
      if(filter.category==='internal' && t.type!=='internal')     return false
      if(filter.subTag && t.subTag!==filter.subTag) return false
      if(search) { const q=search.toLowerCase(); return t.title.toLowerCase().includes(q)||(t.client||'').toLowerCase().includes(q) }
      return true
    })
  }

  function complete(section, id, e) {
    if(e) fireConfetti(e.clientX, e.clientY)
    setCompletedToday(n => n+1)
    updateData(d => {
      const task=(d[section]||[]).find(t=>t.id===id); if(!task) return d
      pushNotif('Task complete!', `"${task.title}" marked done. +10 XP`, task.id)
      return { ...d, [section]:d[section].filter(t=>t.id!==id), completed:[{...task,completedAt:new Date().toISOString(),fromSection:section},...d.completed] }
    })
  }
  function remove(section,id) { updateData(d=>({...d,[section]:(d[section]||[]).filter(t=>t.id!==id)})) }
  function edit(section, id, changes) { updateData(d => ({ ...d, [section]: (d[section]||[]).map(t => t.id===id ? { ...t, ...changes } : t) })) }
  function move(fromSection, id, toSection) {
    updateData(d => {
      const task=(d[fromSection]||[]).find(t=>t.id===id); if(!task) return d
      return { ...d, [fromSection]:d[fromSection].filter(t=>t.id!==id), [toSection]:[...(d[toSection]||[]),task] }
    })
  }
  // Edit drawer state
  const [editDrawer, setEditDrawer] = useState(null) // { task, sectionKey }

  function openEditDrawer(task, sectionKey) {
    setEditDrawer({ task: { ...task, section: sectionKey }, sectionKey })
  }

  function saveDrawerEdit(sectionKey, id, form, targetSection) {
    const { section: _s, ...changes } = form
    if (targetSection !== sectionKey) {
      // Move + update
      updateData(d => {
        const task = (d[sectionKey]||[]).find(t=>t.id===id)
        if (!task) return d
        const updated = { ...task, ...changes }
        return { ...d, [sectionKey]: d[sectionKey].filter(t=>t.id!==id), [targetSection]: [...(d[targetSection]||[]), updated] }
      })
    } else {
      edit(sectionKey, id, changes)
    }
    setEditDrawer(null)
  }
  function addTask(section, task) {
    const stamped = { ...task, createdAt: task.createdAt || new Date().toISOString() }
    updateData(d => ({ ...d, [section]: [...(d[section]||[]), stamped] }))
  }

  function openManualTriage() {
    setTriageOrder([...data.today])
    setManualTriageOpen(true)
  }

  function applyManualTriage() {
    updateData(d => ({ ...d, today: triageOrder }))
    setManualTriageOpen(false)
  }

  // ── AI: TRIAGE ──────────────────────────────────────────────────────────────
  async function runTriage() {
    setTriageLoading(true)
    setOrbState('loading')
    setTriageResult(null)
    const allTasks = [
      ...data.today.map(t=>({...t,section:'today'})),
      ...data.week.map(t=>({...t,section:'week'})),
      ...data.waiting.map(t=>({...t,section:'waiting'})),
    ]
    const taskList = allTasks.map(t=>`[${t.section}] ${t.title}${t.client?' ('+t.client+')':''}${t.due?' due:'+t.due:''}${t.est?' ~'+t.est:''}`).join('\n')
    try {
      const res = await fetch('/api/claude', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          system: `You are a productivity assistant for Brittani, an Operations & Account Manager at NW Media Collective. She works Mon-Thu. Today is ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}. Analyze her task list and return ONLY a JSON object with: { "priority": [top 3 task titles as strings], "defer": [2-3 task titles to move to next week], "insight": "one punchy sentence about her workload", "focus": "one suggested focus area for today" }. No markdown, no explanation, just JSON.`,
          messages:[{ role:'user', content:`Here are my current tasks:\n\n${taskList}\n\nGive me a triage.` }]
        })
      })
      const d = await res.json()
      const text = d.content?.[0]?.text || '{}'
      const clean = text.replace(/```json|```/g,'').trim()
      const parsed = JSON.parse(clean)
      setTriageResult(parsed)
      setOrbState('done')
    } catch {
      setTriageResult({ insight:'Could not connect to AI. Check your connection.', priority:[], defer:[], focus:'' })
      setOrbState('idle')
    }
    setTriageLoading(false)
  }

  // ── AI: DAILY BRIEFING ──────────────────────────────────────────────────────
  async function loadBriefing() {
    if(briefingLoading) return
    setBriefingLoading(true)
    const totalOpen = SECTIONS.filter(s=>s.key!=='completed').reduce((sum,s)=>sum+(data[s.key]||[]).length,0)
    const overdue = data.today.filter(t=>t.due && new Date(t.due+'T00:00:00') < new Date()).length
    const clientCount = [...data.today,...data.week,...data.waiting].filter(t=>t.type==='client').length
    try {
      const res = await fetch('/api/claude', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 150,
          system: `You are a friendly, concise AI assistant for Brittani. Write a single punchy briefing sentence (max 20 words) about her day. Be warm but direct. No fluff.`,
          messages:[{ role:'user', content:`Tasks today: ${data.today.length}. Total open: ${totalOpen}. Overdue: ${overdue}. Client tasks: ${clientCount}. Today is ${new Date().toLocaleDateString('en-US',{weekday:'long'})}.` }]
        })
      })
      const d = await res.json()
      setBriefing(d.content?.[0]?.text || "You have got this. Let's make today count.")
    } catch {
      setBriefing("You have got this. Let's make today count.")
    }
    setBriefingLoading(false)
  }

  // Auto-load briefing on mount — placed after loadBriefing declaration
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadBriefing() }, [])

  const widgets = [
    { label:'Today',     icon:'flame',    value:data.today.length,    iconBg:'#A873EF', iconColor:'#FFFFFF', numColor:'#A873EF', sub:`~${fmtMins(sumMins(data.today))} est.` },
    { label:'This Week', icon:'calendar', value:data.week.length,      iconBg:'#FF7776', iconColor:'#FFFFFF', numColor:C.textPrimary, sub:`~${fmtMins(sumMins(data.week))} est.` },
    { label:'Next Week', icon:'calendar', value:data.nextweek.length,  iconBg:'#94F2DB', iconColor:'#FFFFFF', numColor:C.textPrimary, sub:`~${fmtMins(sumMins(data.nextweek))} est.` },
    { label:'Backlog',   icon:'inbox',    value:data.backlog.length,   iconBg:'#FEA877', iconColor:'#FFFFFF', numColor:C.textPrimary, sub:`${data.backlog.filter(t=>t.category==='personal').length} personal` },
    { label:'Waiting',   icon:'clock',    value:data.waiting.length,   iconBg:'#FEDBA9', iconColor:'#FFFFFF', numColor:C.textPrimary, sub:`${data.waiting.filter(t=>t.type==='client').length} client` },
    { label:'Done',      icon:'check',    value:data.completed.length, iconBg:'#D6EEC9', iconColor:'#FFFFFF', numColor:C.textPrimary, sub:'this session' },
  ]

  // Shared AI card style
  const aiCard = { width:'180px', minWidth:'180px', borderRadius:'16px', boxShadow:C.shadowMd, padding:'16px 14px', boxSizing:'border-box', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', gap:'10px', cursor:'pointer', transition:'box-shadow 0.2s' }
  const orbSize = 56
  const orbInner = { width:`${orbSize}px`, height:`${orbSize}px`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', flexShrink:0 }

  return (
    <div style={{ fontFamily:FONT, background:C.bg, minHeight:'100vh' }}>
      <InjectStyles />

      {/* ── Scrollable content ── */}
      <div style={{ padding:'20px 24px' }}>

      {/* ── AI cards + action buttons row ── */}
      <div style={{ display:'flex', alignItems:'stretch', justifyContent:'space-between', gap:'16px', marginBottom:'16px' }}>

        {/* Left: icon buttons + manual form + gamification panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px', flex:1 }}>

          {/* Icon buttons */}
          <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
            {/* Quick Add — orange (manual, no AI) */}
            <button data-open-task-form onClick={()=>{ setManualAddOpen(o=>!o); setQuickAddOpen(false); setTimeout(()=>manualInputRef.current?.focus(),100) }}
              title="Quick Add (manual)"
              style={{ width:'44px', height:'44px', borderRadius:'50%', border:'none', background:'linear-gradient(135deg,#FF7776,#FEA877)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 10px rgba(255,119,118,0.40)', transition:'transform 0.15s, box-shadow 0.15s', flexShrink:0 }}
              onMouseEnter={e=>{ e.currentTarget.style.transform='scale(1.08)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(255,119,118,0.55)' }}
              onMouseLeave={e=>{ e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 2px 10px rgba(255,119,118,0.40)' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            {/* Manual Triage — purple */}
            <button onClick={openManualTriage}
              title="Manual Triage"
              style={{ width:'44px', height:'44px', borderRadius:'50%', border:'none', background:'linear-gradient(135deg,#D39EF6,#A873EF)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 10px rgba(168,115,239,0.40)', transition:'transform 0.15s, box-shadow 0.15s', flexShrink:0 }}
              onMouseEnter={e=>{ e.currentTarget.style.transform='scale(1.08)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(168,115,239,0.55)' }}
              onMouseLeave={e=>{ e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 2px 10px rgba(168,115,239,0.40)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <line x1="3" y1="5" x2="13" y2="5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                <line x1="3" y1="8" x2="10" y2="8" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                <line x1="3" y1="11" x2="7" y2="11" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Manual quick add — floating popup */}
          {manualAddOpen && (
            <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(45,32,74,0.35)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}
              onClick={e=>{ if(e.target===e.currentTarget){ setManualAddOpen(false); resetManualForm() } }}
            >
              <div style={{ background:C.card, borderRadius:'16px', border:`1px solid ${C.border}`, padding:'20px', display:'flex', flexDirection:'column', gap:'12px', boxShadow:'0 24px 64px rgba(45,32,74,0.24)', width:'440px', maxWidth:'90vw', animation:'popup-in 0.18s ease' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:'14px', fontWeight:800, color:C.textPrimary, fontFamily:FONT }}>Quick Add Task</span>
                  <button onClick={()=>{ setManualAddOpen(false); resetManualForm() }} style={{ background:'none', border:'none', color:C.textMuted, cursor:'pointer', fontSize:'18px', lineHeight:1, fontFamily:FONT, padding:'0 2px' }}>×</button>
                </div>

                {/* Title */}
                <input
                  ref={manualInputRef}
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                  onKeyDown={e => { if(e.key==='Escape'){ setManualAddOpen(false); resetManualForm() } }}
                  placeholder="What needs to be done?"
                  style={{ padding:'10px 14px', borderRadius:'10px', border:`1.5px solid ${C.border}`, fontSize:'14px', fontFamily:FONT, color:C.textPrimary, outline:'none', background:C.bg, boxSizing:'border-box', width:'100%', fontWeight:600 }}
                  onFocus={e=>{ e.currentTarget.style.borderColor='#A873EF' }}
                  onBlur={e=>{ e.currentTarget.style.borderColor=C.border }}
                />

                {/* Row 1: Category + Section */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                    <label style={{ fontSize:'9px', fontWeight:700, color:C.textMuted, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'0.06em' }}>Category</label>
                    <div style={{ display:'flex', gap:'6px' }}>
                      {['work','personal'].map(c => (
                        <button key={c} onClick={()=>setManualCat(c)}
                          style={{ flex:1, padding:'6px 8px', borderRadius:'8px', border:`1.5px solid ${manualCat===c ? '#A873EF' : C.border}`, background: manualCat===c ? '#EBDBFC' : C.bg, color: manualCat===c ? '#A873EF' : C.textSecond, fontSize:'12px', fontWeight:600, fontFamily:FONT, cursor:'pointer', textTransform:'capitalize', transition:'all 0.12s' }}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                    <label style={{ fontSize:'9px', fontWeight:700, color:C.textMuted, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'0.06em' }}>Add to</label>
                    <select value={manualSection} onChange={e=>setManualSection(e.target.value)}
                      style={{ padding:'6px 10px', borderRadius:'8px', border:`1.5px solid ${C.border}`, background:C.bg, fontSize:'12px', fontFamily:FONT, color:C.textPrimary, outline:'none', cursor:'pointer' }}>
                      {SECTIONS.filter(s=>s.key!=='completed').map(s=>(
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Type + Client (work) OR Sub-tag (personal) */}
                {manualCat === 'work' && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                      <label style={{ fontSize:'9px', fontWeight:700, color:C.textMuted, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'0.06em' }}>Type</label>
                      <div style={{ display:'flex', gap:'6px' }}>
                        {['internal','client'].map(t => (
                          <button key={t} onClick={()=>setManualType(t)}
                            style={{ flex:1, padding:'6px 8px', borderRadius:'8px', border:`1.5px solid ${manualType===t ? '#94F2DB' : C.border}`, background: manualType===t ? '#D4F8EE' : C.bg, color: manualType===t ? '#1A7A60' : C.textSecond, fontSize:'12px', fontWeight:600, fontFamily:FONT, cursor:'pointer', textTransform:'capitalize', transition:'all 0.12s' }}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                      <label style={{ fontSize:'9px', fontWeight:700, color:C.textMuted, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'0.06em' }}>Client</label>
                      <input value={manualClient} onChange={e=>setManualClient(e.target.value)}
                        placeholder={manualType==='client' ? 'Client name...' : 'N/A'}
                        disabled={manualType==='internal'}
                        style={{ padding:'6px 10px', borderRadius:'8px', border:`1.5px solid ${C.border}`, background: manualType==='internal' ? '#F5F5F8' : C.bg, fontSize:'12px', fontFamily:FONT, color:C.textPrimary, outline:'none', opacity: manualType==='internal' ? 0.5 : 1 }}
                        onFocus={e=>{ e.currentTarget.style.borderColor='#A873EF' }}
                        onBlur={e=>{ e.currentTarget.style.borderColor=C.border }}
                      />
                    </div>
                  </div>
                )}
                {manualCat === 'personal' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                    <label style={{ fontSize:'9px', fontWeight:700, color:C.textMuted, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'0.06em' }}>Category</label>
                    <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                      {['Finance','Household','Hobbies','Kids','Family','Dev Lessons','Travel','Miscellaneous'].map(tag => (
                        <button key={tag} onClick={()=>setManualClient(manualClient===tag ? '' : tag)}
                          style={{ padding:'5px 10px', borderRadius:'8px', border:`1.5px solid ${manualClient===tag ? '#A873EF' : C.border}`, background: manualClient===tag ? '#EBDBFC' : C.bg, color: manualClient===tag ? '#A873EF' : C.textSecond, fontSize:'11px', fontWeight:600, fontFamily:FONT, cursor:'pointer', transition:'all 0.12s' }}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Row 3: Est + Due */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                    <label style={{ fontSize:'9px', fontWeight:700, color:C.textMuted, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'0.06em' }}>Est. time</label>
                    <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                      {['15m','30m','45m','1h','2h','3h+'].map(e => (
                        <button key={e} onClick={()=>setManualEst(manualEst===e ? '' : e)}
                          style={{ padding:'5px 8px', borderRadius:'7px', border:`1.5px solid ${manualEst===e ? '#FEA877' : C.border}`, background: manualEst===e ? '#FEF0DC' : C.bg, color: manualEst===e ? '#2D1F4A' : C.textSecond, fontSize:'11px', fontWeight:600, fontFamily:FONT, cursor:'pointer', transition:'all 0.12s' }}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                    <label style={{ fontSize:'9px', fontWeight:700, color:C.textMuted, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'0.06em' }}>Due date</label>
                    <input type="date" value={manualDue} onChange={e=>setManualDue(e.target.value)}
                      style={{ padding:'6px 10px', borderRadius:'8px', border:`1.5px solid ${C.border}`, background:C.bg, fontSize:'12px', fontFamily:FONT, color:C.textPrimary, outline:'none', cursor:'pointer' }}
                      onFocus={e=>{ e.currentTarget.style.borderColor='#A873EF' }}
                      onBlur={e=>{ e.currentTarget.style.borderColor=C.border }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:'10px', paddingTop:'4px' }}>
                  <button
                    onClick={()=>{
                      if(!manualTitle.trim()) return
                      addTask(manualSection, {
                        id: nextId(),
                        title: manualTitle.trim(),
                        category: manualCat,
                        type: manualCat === 'work' ? manualType : undefined,
                        client: manualCat === 'work' && manualType === 'client' ? manualClient : undefined,
                        subTag: manualCat === 'personal' && manualClient ? manualClient : undefined,
                        est: manualEst || undefined,
                        due: manualDue || undefined,
                      })
                      setManualAddOpen(false); resetManualForm()
                    }}
                    disabled={!manualTitle.trim()}
                    style={{ flex:1, padding:'10px', borderRadius:'10px', border:'none', background: manualTitle.trim() ? 'linear-gradient(135deg,#FF7776,#FEA877)' : '#E8E3F0', color: manualTitle.trim() ? '#fff' : '#B0A8C0', fontSize:'13px', fontWeight:700, fontFamily:FONT, cursor: manualTitle.trim() ? 'pointer' : 'default', transition:'all 0.15s', boxShadow: manualTitle.trim() ? '0 2px 8px rgba(255,119,118,0.35)' : 'none' }}>
                    Add Task
                  </button>
                  <button onClick={()=>{ setManualAddOpen(false); resetManualForm() }}
                    style={{ padding:'10px 20px', borderRadius:'10px', border:`1.5px solid ${C.border}`, background:'transparent', color:C.textMuted, fontSize:'13px', fontFamily:FONT, cursor:'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Gamification panel */}
          <div style={{ background:C.card, borderRadius:'16px', border:`1px solid ${C.border}`, boxShadow:C.shadowSm, padding:'14px 16px', display:'flex', flexDirection:'column', gap:'10px' }}>

            {/* Level + XP bar */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'linear-gradient(135deg,#FEDBA9,#FEA877)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1.5l1.3 2.8 3 .4-2.2 2.1.5 3L7 8.4l-2.6 1.4.5-3L2.7 4.7l3-.4z" fill="white"/>
                </svg>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
                  <span style={{ fontSize:'11px', fontWeight:700, color:C.textPrimary, fontFamily:FONT }}>
                    Level {Math.floor(completedToday / 5)} · {completedToday * 10} XP
                  </span>
                  <span style={{ fontSize:'10px', color:C.textMuted, fontFamily:FONT }}>
                    {completedToday === 0 ? 'Complete tasks to earn XP' : `${50 - (completedToday * 10) % 50} XP to next level`}
                  </span>
                </div>
                <div style={{ height:'6px', background:'#EBDBFC', borderRadius:'99px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${(completedToday * 10) % 50 * 2}%`, background:'linear-gradient(90deg,#D39EF6,#A873EF)', borderRadius:'99px', transition:'width 0.5s ease' }} />
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display:'flex', gap:'8px' }}>
              {[
                { val: completedToday,        label:'Done today',    color:'#FF7776', bg:'#FFE8E8' },
                { val: data.today.length,     label:'Remaining',     color:'#A873EF', bg:'#EBDBFC' },
                { val: `${completedToday * 10}`, label:'XP earned',  color:'#FEA877', bg:'#FEF0DC' },
              ].map(s => (
                <div key={s.label} style={{ flex:1, background:s.bg, borderRadius:'10px', padding:'8px 10px', textAlign:'center' }}>
                  <div style={{ fontSize:'18px', fontWeight:800, color:s.color, fontFamily:FONT, lineHeight:1 }}>{s.val}</div>
                  <div style={{ fontSize:'9px', fontWeight:600, color:C.textSecond, fontFamily:FONT, marginTop:'3px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Right: AI cards */}
        <div className="tasks-ai-cards">

          {/* ── AI Quick Add card — orange ── */}
          <div style={{ ...aiCard, background:'linear-gradient(135deg,#FEDBA9 0%,#FEA877 40%,#FF7776 100%)' }}
            onClick={()=>{ if(!quickAddOpen){ setQuickAddOpen(true); setTimeout(()=>quickInputRef.current?.focus(),100) } }}
            onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 12px 36px rgba(255,119,118,0.45)' }}
            onMouseLeave={e=>{ e.currentTarget.style.boxShadow=C.shadowMd }}
          >
            <div style={{ flex:1 }} />
            <div style={{ ...orbInner, background:'radial-gradient(circle at 35% 35%, #fff 0%, #FEDBA9 25%, #FEA877 55%, #FF7776 85%)', boxShadow: dictating ? '0 0 0 6px rgba(255,255,255,0.2), 0 4px 16px rgba(255,119,118,0.6)' : '0 4px 16px rgba(255,119,118,0.5), inset 0 2px 4px rgba(255,255,255,0.4)', transition:'box-shadow 0.3s' }}
              className={dictating||quickLoading ? 'orb-loading' : 'orb-idle'}
              onClick={e=>{ e.stopPropagation(); startDictation() }}
            >
              <div style={{ position:'absolute', top:'18%', left:'22%', width:'28%', height:'18%', borderRadius:'50%', background:'rgba(255,255,255,0.5)', filter:'blur(2px)' }} />
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'12px', fontWeight:800, color:'#FFFFFF', fontFamily:FONT }}>AI Quick Add</div>
              <div style={{ fontSize:'9px', fontWeight:600, color:'rgba(255,255,255,0.75)', fontFamily:FONT, marginTop:'2px' }}>{dictating ? 'Listening...' : 'Tap orb to speak'}</div>
            </div>
            <button onClick={e=>{ e.stopPropagation(); startDictation() }}
              style={{ width:'32px', height:'32px', borderRadius:'50%', border:'none', background: dictating ? 'rgba(255,80,80,0.7)' : 'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'background 0.15s', flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                {dictating ? <rect x="4" y="4" width="6" height="6" rx="1.5" fill="white"/> : <><rect x="5" y="1.5" width="4" height="7" rx="2" fill="white"/><path d="M2.5 6.5a4.5 4.5 0 009 0" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none"/><line x1="7" y1="11" x2="7" y2="13" stroke="white" strokeWidth="1.3" strokeLinecap="round"/></>}
              </svg>
            </button>
          </div>

          {/* AI Quick Add floating input popup */}
          {quickAddOpen && (
            <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(45,32,74,0.35)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}
              onClick={e=>{ if(e.target===e.currentTarget){ setQuickAddOpen(false); setQuickInput(''); setQuickPreview(null); recognitionRef.current?.stop() } }}
            >
              <div style={{ background:'linear-gradient(135deg,#FEDBA9 0%,#FEA877 40%,#FF7776 100%)', borderRadius:'16px', padding:'20px', display:'flex', flexDirection:'column', gap:'10px', boxShadow:'0 24px 64px rgba(255,119,118,0.35)', width:'360px', maxWidth:'90vw', animation:'popup-in 0.18s ease' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:'13px', fontWeight:800, color:'#FFFFFF', fontFamily:FONT }}>AI Quick Add</span>
                  <button onClick={()=>{ setQuickAddOpen(false); setQuickInput(''); setQuickPreview(null); recognitionRef.current?.stop() }}
                    style={{ background:'rgba(255,255,255,0.2)', border:'none', color:'#fff', cursor:'pointer', fontSize:'14px', borderRadius:'6px', width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FONT }}>×</button>
                </div>
                <input ref={quickInputRef} value={quickInput}
                  onChange={e=>{ setQuickInput(e.target.value); setQuickPreview(null) }}
                  onKeyDown={e=>{ if(e.key==='Enter') runQuickAdd(); if(e.key==='Escape'){ setQuickAddOpen(false); setQuickInput(''); setQuickPreview(null); recognitionRef.current?.stop() } }}
                  placeholder={dictating ? 'Listening...' : 'Describe your task naturally...'}
                  style={{ width:'100%', padding:'10px 14px', borderRadius:'10px', border: dictating ? '1.5px solid rgba(255,255,255,0.7)' : '1.5px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.2)', color:'#FFFFFF', fontSize:'13px', fontFamily:FONT, outline:'none', boxSizing:'border-box' }}
                />
                <div style={{ display:'flex', gap:'8px' }}>
                  <button onClick={e=>{ e.stopPropagation(); startDictation() }}
                    style={{ width:'40px', height:'40px', borderRadius:'50%', border:'none', background: dictating ? 'rgba(255,80,80,0.7)' : 'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'background 0.15s', flexShrink:0 }}>
                    <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                      {dictating ? <rect x="4" y="4" width="6" height="6" rx="1.5" fill="white"/> : <><rect x="5" y="1.5" width="4" height="7" rx="2" fill="white"/><path d="M2.5 6.5a4.5 4.5 0 009 0" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none"/><line x1="7" y1="11" x2="7" y2="13" stroke="white" strokeWidth="1.3" strokeLinecap="round"/></>}
                    </svg>
                  </button>
                  <button onClick={runQuickAdd} disabled={quickLoading||!quickInput.trim()}
                    style={{ flex:1, padding:'10px', borderRadius:'10px', border:'none', background: quickLoading||!quickInput.trim() ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.35)', color:'#FFFFFF', fontSize:'13px', fontWeight:700, fontFamily:FONT, cursor: quickLoading||!quickInput.trim() ? 'default':'pointer', transition:'background 0.15s' }}>
                    {quickLoading ? 'Parsing...' : 'Add with AI'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── AI Triage card — purple ── */}
          <div style={{ ...aiCard, background:'linear-gradient(135deg,#D39EF6 0%,#A873EF 100%)' }}
            onClick={runTriage}
            onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 12px 36px rgba(168,115,239,0.45)' }}
            onMouseLeave={e=>{ e.currentTarget.style.boxShadow=C.shadowMd }}
          >
            <div style={{ flex:1 }} />
            <div style={{ ...orbInner, background:'radial-gradient(circle at 35% 35%, #fff 0%, #D39EF6 30%, #A873EF 70%, #7040C0 100%)', boxShadow:'0 4px 16px rgba(168,115,239,0.5), inset 0 2px 4px rgba(255,255,255,0.4)' }}
              className={orbState==='loading' ? 'orb-loading' : 'orb-idle'}
            >
              <div style={{ position:'absolute', top:'18%', left:'22%', width:'28%', height:'18%', borderRadius:'50%', background:'rgba(255,255,255,0.5)', filter:'blur(2px)' }} />
              <div style={{ position:'absolute', top:'4px', left:'4px', right:'4px', bottom:'4px', borderRadius:'50%', border:'1.5px solid rgba(255,255,255,0.3)', animationName:'orb-spin', animationDuration:'8s', animationTimingFunction:'linear', animationIterationCount:'infinite', animationPlayState: orbState==='loading'?'running':'paused' }} />
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'12px', fontWeight:800, color:'#FFFFFF', fontFamily:FONT }}>
                {triageLoading ? 'Thinking...' : orbState==='done' ? 'Triaged ✓' : 'AI Triage'}
              </div>
              <div style={{ fontSize:'9px', fontWeight:600, color:'rgba(255,255,255,0.75)', fontFamily:FONT, marginTop:'2px' }}>
                {triageLoading ? 'Analyzing...' : 'Tap to prioritize'}
              </div>
            </div>
            <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v4.5M7 8.5v.8" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.3"/>
              </svg>
            </div>
          </div>

        </div>{/* end tasks-ai-cards */}
      </div>{/* end title+AI row */}

      {/* ── Widgets row — full width, hidden on mobile ── */}
      <div className="tasks-widgets">
        {widgets.map(w => (
          <div key={w.label} className="tasks-widget-card"
            style={{ background:C.card, borderRadius:'16px', border:`1px solid ${C.border}`, boxShadow:C.shadowSm, padding:'12px', display:'flex', flexDirection:'column', justifyContent:'space-between', transition:'box-shadow 0.2s', cursor:'default', boxSizing:'border-box', overflow:'hidden', flex:1 }}
            onMouseEnter={e=>{ e.currentTarget.style.boxShadow=C.shadowMd }}
            onMouseLeave={e=>{ e.currentTarget.style.boxShadow=C.shadowSm }}
          >
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
              <div className="tasks-widget-num" style={{ fontWeight:800, color:w.numColor, lineHeight:1, fontFamily:FONT }}>{w.value}</div>
              <div className="tasks-widget-icon" style={{ borderRadius:'8px', background:w.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name={w.icon} color={w.iconColor} size={14} />
              </div>
            </div>
            <div>
              <div className="tasks-widget-label" style={{ fontWeight:700, color:C.textMuted, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'0.06em' }}>{w.label}</div>
              <div className="tasks-widget-sub" style={{ fontWeight:500, color:C.textMuted, fontFamily:FONT }}>{w.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── AI Quick Add preview ── */}
      {quickPreview && (
        <div style={{ background:C.card, borderRadius:'12px', border:`1.5px solid ${C.brightLavender}`, boxShadow:C.shadowMd, padding:'12px 16px', marginBottom:'12px', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#A873EF', flexShrink:0 }} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:C.textPrimary, fontFamily:FONT }}>{quickPreview.title}</div>
            <div style={{ display:'flex', gap:'5px', marginTop:'4px', flexWrap:'wrap' }}>
              <span style={{ fontSize:'9px', fontWeight:700, padding:'2px 7px', borderRadius:'20px', background:C.lavenderVeil, color:'#A873EF', fontFamily:FONT, textTransform:'uppercase' }}>{quickPreview.section}</span>
              {quickPreview.client && <span style={{ fontSize:'9px', fontWeight:700, padding:'2px 7px', borderRadius:'20px', background:C.lavenderVeil, color:'#A873EF', fontFamily:FONT }}>{quickPreview.client}</span>}
              {quickPreview.subTag && <span style={{ fontSize:'9px', fontWeight:700, padding:'2px 7px', borderRadius:'20px', background:C.teaGreen, color:'#2D1F4A', fontFamily:FONT }}>{quickPreview.subTag}</span>}
              {quickPreview.est && <span style={{ fontSize:'9px', fontWeight:600, color:C.textMuted, fontFamily:FONT }}>{quickPreview.est}</span>}
              {quickPreview.due && <span style={{ fontSize:'9px', fontWeight:700, padding:'2px 7px', borderRadius:'20px', background:C.navajoWhite, color:'#2D1F4A', fontFamily:FONT }}>Due {quickPreview.due}</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
            <button onClick={()=>setQuickPreview(null)} style={{ padding:'6px 12px', borderRadius:'8px', border:`1px solid ${C.border}`, background:'transparent', color:C.textSecond, fontSize:'11px', fontWeight:600, fontFamily:FONT, cursor:'pointer' }}>Edit</button>
            <button onClick={confirmQuickAdd} style={{ padding:'6px 14px', borderRadius:'8px', border:'none', background:'linear-gradient(135deg,#D39EF6,#A873EF)', color:'#fff', fontSize:'11px', fontWeight:700, fontFamily:FONT, cursor:'pointer', boxShadow:C.shadowSm }}>Add task</button>
          </div>
        </div>
      )}
      {/* ── AI Briefing strip — auto loads ── */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', background:C.card, borderRadius:'12px', border:`1px solid ${C.border}`, boxShadow:C.shadowSm, padding:'10px 16px', marginBottom:'12px' }}>
        <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'linear-gradient(135deg,#D39EF6,#A873EF)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2C4.24 2 2 4.24 2 7s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" fill="rgba(255,255,255,0.3)"/>
            <path d="M5 5.5C5 4.67 5.67 4 6.5 4h1C8.33 4 9 4.67 9 5.5S8.33 7 7.5 7H7v2.5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
            <circle cx="7" cy="10.5" r="0.6" fill="white"/>
          </svg>
        </div>
        {briefingLoading ? (
          <span style={{ fontSize:'12px', color:C.textMuted, fontFamily:FONT, fontStyle:'italic' }}>Claude is thinking about your day...</span>
        ) : briefing ? (
          <>
            <span style={{ fontSize:'12px', fontWeight:600, color:C.textPrimary, fontFamily:FONT, flex:1 }}>{briefing}</span>
            <button onClick={()=>{ setBriefing(null); loadBriefing() }} style={{ background:'none', border:'none', color:C.textMuted, cursor:'pointer', fontSize:'11px', padding:'0 4px', fontFamily:FONT, flexShrink:0 }}>↻</button>
          </>
        ) : (
          <span style={{ fontSize:'12px', color:C.textSecond, fontFamily:FONT }}>
            <span style={{ fontWeight:700, color:'#A873EF' }}>Claude</span> · Your daily briefing
          </span>
        )}
      </div>

      {/* ── Triage results ── */}
      {triageResult && (
        <div style={{ background:C.card, borderRadius:'14px', border:`1px solid ${C.border}`, boxShadow:C.shadowSm, padding:'14px 16px', marginBottom:'14px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ width:'24px', height:'24px', borderRadius:'6px', background:'linear-gradient(135deg,#FEA877,#FF7776)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v4.5M6 8v.6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/><circle cx="6" cy="6" r="5" stroke="white" strokeWidth="1.2"/></svg>
              </div>
              <span style={{ fontSize:'12px', fontWeight:800, color:C.textPrimary, fontFamily:FONT }}>AI Triage Results</span>
            </div>
            <button onClick={()=>setTriageResult(null)} style={{ background:'none', border:'none', color:C.textMuted, cursor:'pointer', fontSize:'16px', fontFamily:FONT }}>×</button>
          </div>

          {/* Insight */}
          {triageResult.insight && (
            <div style={{ background:'linear-gradient(135deg,#EBDBFC,#D39EF6)', borderRadius:'10px', padding:'10px 12px', marginBottom:'12px' }}>
              <span style={{ fontSize:'12px', fontWeight:600, color:'#2D1F4A', fontFamily:FONT, fontStyle:'italic' }}>"{triageResult.insight}"</span>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
            {/* Focus */}
            {triageResult.focus && (
              <div>
                <div style={{ fontSize:'9px', fontWeight:700, color:C.textMuted, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px' }}>Focus area</div>
                <div style={{ fontSize:'12px', fontWeight:600, color:C.textPrimary, fontFamily:FONT, background:C.bg, borderRadius:'8px', padding:'8px 10px' }}>{triageResult.focus}</div>
              </div>
            )}
            {/* Priority */}
            {triageResult.priority?.length > 0 && (
              <div>
                <div style={{ fontSize:'9px', fontWeight:700, color:C.textMuted, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px' }}>Do first</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  {triageResult.priority.map((t,i) => (
                    <div key={i} style={{ fontSize:'11px', fontWeight:500, color:C.textPrimary, fontFamily:FONT, background:C.bg, borderRadius:'8px', padding:'6px 10px', borderLeft:'3px solid #A873EF' }}>{t}</div>
                  ))}
                </div>
              </div>
            )}
            {/* Defer */}
            {triageResult.defer?.length > 0 && (
              <div>
                <div style={{ fontSize:'9px', fontWeight:700, color:C.textMuted, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px' }}>Consider deferring</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  {triageResult.defer.map((t,i) => (
                    <div key={i} style={{ fontSize:'11px', fontWeight:500, color:C.textSecond, fontFamily:FONT, background:C.bg, borderRadius:'8px', padding:'6px 10px', borderLeft:'3px solid #FEDBA9' }}>{t}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div style={{ display:'flex', gap:'8px', marginBottom:filterOpen?'0':'16px', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1 }}>
          <span style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', display:'flex', pointerEvents:'none' }}>
            <Icon name="search" size={16} color={C.textMuted} />
          </span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks..."
            style={{ width:'100%', padding:'10px 12px 10px 34px', borderRadius:'24px', border:`1.5px solid ${C.border}`, fontSize:'13px', fontFamily:FONT, color:C.textPrimary, background:C.card, boxSizing:'border-box', boxShadow:C.shadowSm, outline:'none' }} />
        </div>
        <button onClick={()=>setFilterOpen(o=>!o)}
          style={{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 16px', borderRadius:'24px', border:`1.5px solid ${hasFilter?C.brightLavender:C.border}`, background:hasFilter?C.lavenderVeil:C.card, cursor:'pointer', fontSize:'12px', fontWeight:700, fontFamily:FONT, color:hasFilter?C.brightLavender:C.textSecond, boxShadow:C.shadowSm, transition:'all 0.15s' }}>
          <Icon name="filter" size={16} color={hasFilter?C.brightLavender:C.textSecond} />
          Filters
          {hasFilter && <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:C.brightLavender }} />}
        </button>
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'14px', padding:'16px 18px', marginBottom:'16px', boxShadow:C.shadowSm, display:'flex', gap:'24px', flexWrap:'wrap', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:'10px', fontWeight:700, color:C.textMuted, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px' }}>Category</div>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
              {[{k:'all',l:'All',p:P.purple1},{k:'personal',l:'Personal',p:P.purple3},{k:'work',l:'Work',p:P.aqua1},{k:'client',l:'Client',p:P.purple3},{k:'internal',l:'Internal',p:P.aqua2}].map(f => {
                const active=filter.category===f.k
                return <button key={f.k} onClick={()=>setFilter(p=>({...p,category:f.k}))} style={{ padding:'5px 14px', borderRadius:'20px', border:'none', background:active?f.p.bg:C.bg, color:active?f.p.color:C.textSecond, fontSize:'12px', fontWeight:600, fontFamily:FONT, cursor:'pointer', boxShadow:active?C.shadowSm:'none', transition:'all 0.15s' }}>{f.l}</button>
              })}
            </div>
          </div>
          <div>
            <div style={{ fontSize:'10px', fontWeight:700, color:C.textMuted, fontFamily:FONT, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px' }}>Personal tag</div>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
              {[{k:'',l:'Any'},...Object.keys(SUBTAG).map(k=>({k,l:k}))].map(f => {
                const active=filter.subTag===f.k; const ps=f.k?SUBTAG[f.k]:P.grey2
                return <button key={f.k||'any'} onClick={()=>setFilter(p=>({...p,subTag:f.k}))} style={{ padding:'5px 14px', borderRadius:'20px', border:'none', background:active?ps.bg:C.bg, color:active?ps.color:C.textSecond, fontSize:'12px', fontWeight:600, fontFamily:FONT, cursor:'pointer', boxShadow:active?C.shadowSm:'none', transition:'all 0.15s' }}>{f.l}</button>
              })}
            </div>
          </div>
          {hasFilter && <button onClick={()=>setFilter({category:'all',subTag:''})} style={{ padding:'5px 14px', borderRadius:'20px', border:`1px solid rgba(255,119,118,0.30)`, background:'transparent', color:C.grapefruitPink, fontSize:'12px', fontWeight:600, fontFamily:FONT, cursor:'pointer', marginTop:'auto' }}>Clear</button>}
        </div>
      )}

      {/* Sections */}
      {SECTIONS.map(config => {
        const total = config.key==='today' ? data.today.length + completedToday : 0
        const pb = config.key==='today' ? { pct: total===0?0:Math.round((completedToday/total)*100), done:completedToday, total } : null
        return <Section key={config.key} config={config} tasks={applyFilter(data[config.key]||[])} onComplete={complete} onDelete={remove} onMove={move} onEdit={edit} onOpenEdit={openEditDrawer} onAdd={addTask} onClearCompleted={config.key==='completed'?()=>updateData(d=>({...d,completed:[]})):null} progressBar={pb} />
      })}

      </div>{/* end scrollable content */}

      {editDrawer && (
        <TaskEditDrawer
          task={editDrawer.task}
          sectionKey={editDrawer.sectionKey}
          sections={SECTIONS}
          onSave={saveDrawerEdit}
          onClose={()=>setEditDrawer(null)}
        />
      )}

      {/* ── Mobile Hamburger Bottom Sheet ── */}
      {hamburgerOpen && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(45,32,74,0.45)', zIndex:200, display:'flex', alignItems:'flex-end' }}
          onClick={e=>{ if(e.target===e.currentTarget) setHamburgerOpen(false) }}
        >
          <div style={{ width:'100%', background:C.card, borderRadius:'20px 20px 0 0', boxShadow:'0 -8px 32px rgba(45,32,74,0.20)', padding:'16px 20px 32px' }}>
            <div style={{ width:'36px', height:'4px', borderRadius:'2px', background:C.border, margin:'0 auto 20px' }} />
            <div style={{ fontSize:'14px', fontWeight:800, color:C.textPrimary, fontFamily:FONT, marginBottom:'16px' }}>Actions</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>

              {/* Quick Add */}
              <button onClick={()=>{ setHamburgerOpen(false); setTimeout(()=>{ setQuickAddOpen(true); quickInputRef.current?.focus() },100) }}
                style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', borderRadius:'14px', border:`1px solid ${C.border}`, background:C.bg, cursor:'pointer', textAlign:'left', width:'100%', transition:'background 0.15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.background=C.lavenderVeil }}
                onMouseLeave={e=>{ e.currentTarget.style.background=C.bg }}
              >
                <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'#A873EF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:C.shadowSm }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:700, color:C.textPrimary, fontFamily:FONT }}>Quick Add</div>
                  <div style={{ fontSize:'11px', color:C.textSecond, fontFamily:FONT, marginTop:'1px' }}>Add a task manually</div>
                </div>
              </button>

              {/* AI Quick Add */}
              <button onClick={()=>{ setHamburgerOpen(false); startDictation() }}
                style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', borderRadius:'14px', border:`1px solid ${C.border}`, background:C.bg, cursor:'pointer', textAlign:'left', width:'100%', transition:'background 0.15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.background=C.lavenderVeil }}
                onMouseLeave={e=>{ e.currentTarget.style.background=C.bg }}
              >
                <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'linear-gradient(135deg,#D39EF6,#A873EF)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:C.shadowSm }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="6" y="2" width="4" height="7" rx="2" fill="white"/><path d="M3 8a5 5 0 0010 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/><line x1="8" y1="13" x2="8" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:700, color:C.textPrimary, fontFamily:FONT }}>AI Quick Add</div>
                  <div style={{ fontSize:'11px', color:C.textSecond, fontFamily:FONT, marginTop:'1px' }}>Speak or type naturally. Claude parses it</div>
                </div>
              </button>

              {/* AI Triage */}
              <button onClick={()=>{ setHamburgerOpen(false); runTriage() }}
                style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', borderRadius:'14px', border:`1px solid ${C.border}`, background:C.bg, cursor:'pointer', textAlign:'left', width:'100%', transition:'background 0.15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.background=C.lavenderVeil }}
                onMouseLeave={e=>{ e.currentTarget.style.background=C.bg }}
              >
                <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'linear-gradient(135deg,#FEA877,#FF7776)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:C.shadowSm }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2.5v5M8 10v1" stroke="white" strokeWidth="1.6" strokeLinecap="round"/><circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.3"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:700, color:C.textPrimary, fontFamily:FONT }}>AI Triage</div>
                  <div style={{ fontSize:'11px', color:C.textSecond, fontFamily:FONT, marginTop:'1px' }}>Let Claude prioritize your Today tasks</div>
                </div>
              </button>

              {/* Manual Triage */}
              <button onClick={()=>{ setHamburgerOpen(false); openManualTriage() }}
                style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', borderRadius:'14px', border:`1px solid ${C.border}`, background:C.bg, cursor:'pointer', textAlign:'left', width:'100%', transition:'background 0.15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.background=C.lavenderVeil }}
                onMouseLeave={e=>{ e.currentTarget.style.background=C.bg }}
              >
                <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'#FF7776', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:C.shadowSm }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="3" y1="5" x2="13" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/><line x1="3" y1="8" x2="13" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/><line x1="3" y1="11" x2="13" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:700, color:C.textPrimary, fontFamily:FONT }}>Manual Triage</div>
                  <div style={{ fontSize:'11px', color:C.textSecond, fontFamily:FONT, marginTop:'1px' }}>Drag to reorder Today tasks yourself</div>
                </div>
              </button>

            </div>
          </div>
        </div>
      )}

      {/* ── Manual Triage Modal ── */}
      {manualTriageOpen && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(45,32,74,0.45)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
          onClick={e=>{ if(e.target===e.currentTarget) setManualTriageOpen(false) }}
        >
          <div style={{ background:C.card, borderRadius:'20px', boxShadow:'0 24px 64px rgba(45,32,74,0.30)', width:'100%', maxWidth:'480px', maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'18px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:'16px', fontWeight:800, color:C.textPrimary, fontFamily:FONT }}>Manual Triage</div>
                <div style={{ fontSize:'11px', color:C.textSecond, fontFamily:FONT, marginTop:'2px' }}>Drag to reorder your Today tasks by priority</div>
              </div>
              <button onClick={()=>setManualTriageOpen(false)} style={{ background:'none', border:'none', color:C.textMuted, fontSize:'20px', cursor:'pointer', fontFamily:FONT, lineHeight:1 }}>×</button>
            </div>

            <div style={{ overflowY:'auto', flex:1, padding:'12px 16px' }}>
              {triageOrder.map((task, idx) => (
                <div key={task.id} draggable
                  onDragStart={()=>setDragIdx(idx)}
                  onDragOver={e=>{ e.preventDefault(); if(dragIdx===null||dragIdx===idx) return; const next=[...triageOrder]; const [moved]=next.splice(dragIdx,1); next.splice(idx,0,moved); setTriageOrder(next); setDragIdx(idx) }}
                  onDragEnd={()=>setDragIdx(null)}
                  style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'10px', marginBottom:'6px', background:dragIdx===idx?C.lavenderVeil:C.bg, border:`1px solid ${dragIdx===idx?C.brightLavender:C.border}`, cursor:'grab', userSelect:'none', transition:'background 0.12s', boxShadow:dragIdx===idx?C.shadowSm:'none' }}
                >
                  <div style={{ width:'22px', height:'22px', borderRadius:'6px', background:idx===0?'#A873EF':idx===1?'#FF7776':idx===2?'#FEA877':C.lavenderVeil, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:'10px', fontWeight:800, color:idx<3?'#FFFFFF':'#A873EF', fontFamily:FONT }}>{idx+1}</span>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink:0, opacity:0.3 }}>
                    <circle cx="4" cy="3" r="1" fill={C.textPrimary}/><circle cx="8" cy="3" r="1" fill={C.textPrimary}/>
                    <circle cx="4" cy="6" r="1" fill={C.textPrimary}/><circle cx="8" cy="6" r="1" fill={C.textPrimary}/>
                    <circle cx="4" cy="9" r="1" fill={C.textPrimary}/><circle cx="8" cy="9" r="1" fill={C.textPrimary}/>
                  </svg>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'12px', fontWeight:600, color:C.textPrimary, fontFamily:FONT, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task.title}</div>
                    {task.client && <div style={{ fontSize:'10px', color:C.textSecond, fontFamily:FONT }}>{task.client}</div>}
                  </div>
                  {task.est && <span style={{ fontSize:'10px', fontWeight:600, color:C.textMuted, fontFamily:FONT, flexShrink:0 }}>{task.est}</span>}
                </div>
              ))}
              {triageOrder.length===0 && (
                <p style={{ fontSize:'13px', color:C.textMuted, fontFamily:FONT, textAlign:'center', padding:'20px 0', fontStyle:'italic' }}>No tasks in Today to triage.</p>
              )}
            </div>

            <div style={{ padding:'14px 20px', borderTop:`1px solid ${C.border}`, display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button onClick={()=>setManualTriageOpen(false)} style={{ padding:'8px 16px', borderRadius:'12px', border:`1px solid ${C.border}`, background:'transparent', color:C.textSecond, fontSize:'12px', fontWeight:600, fontFamily:FONT, cursor:'pointer' }}>Cancel</button>
              <button onClick={applyManualTriage} style={{ padding:'8px 20px', borderRadius:'12px', border:'none', background:`linear-gradient(135deg,${C.grapefruitPink},${C.tangerineDream})`, color:'#fff', fontSize:'12px', fontWeight:700, fontFamily:FONT, cursor:'pointer', boxShadow:'0 2px 8px rgba(255,119,118,0.30)' }}>Apply order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
