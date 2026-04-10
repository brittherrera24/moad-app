// ── Google Calendar Connector ────────────────────────────────────────────────
// App-level integration. Connect once, stays connected forever.
// Uses silent token refresh after first consent (no popups on subsequent loads).
// Token persisted in localStorage. App.jsx manages connection state.

const CLIENT_ID    = import.meta.env.VITE_GCAL_CLIENT_ID
const API_KEY      = import.meta.env.VITE_GCAL_API_KEY
const PERSONAL_CAL = import.meta.env.VITE_GCAL_PERSONAL_ID
const WORK_CAL     = import.meta.env.VITE_GCAL_WORK_ID
const SCOPES       = 'https://www.googleapis.com/auth/calendar.readonly'
const TOKEN_KEY    = 'moad_gcal_token'
const CONNECTED_KEY = 'moad_gcal_connected'

let gapiInited = false
let gisInited  = false
let tokenClient = null

// ── Script loading ──────────────────────────────────────────────────────────

// Wait for a global to appear on window (handles script tag existing but not yet executed)
function waitForGlobal(name, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (window[name]) { resolve(window[name]); return }
    const start = Date.now()
    const check = setInterval(() => {
      if (window[name]) { clearInterval(check); resolve(window[name]) }
      else if (Date.now() - start > timeoutMs) { clearInterval(check); reject(new Error(`${name} not available after ${timeoutMs}ms`)) }
    }, 50)
  })
}

function addScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.defer = true
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

async function ensureGapi() {
  if (gapiInited) return

  // Add script tag if missing, then wait for the global to be defined
  await addScript('https://apis.google.com/js/api.js')
  await waitForGlobal('gapi')

  // Load the client module
  if (!window.gapi.client) {
    await new Promise((resolve, reject) => {
      window.gapi.load('client', {
        callback: resolve,
        onerror: () => reject(new Error('gapi client module failed to load')),
        timeout: 10000,
        ontimeout: () => reject(new Error('gapi client module timed out')),
      })
    })
  }

  if (!window.gapi.client) throw new Error('gapi.client still undefined after load')

  await window.gapi.client.init({ apiKey: API_KEY })
  await window.gapi.client.load('calendar', 'v3')
  gapiInited = true
}

async function ensureGis() {
  if (gisInited) return
  await addScript('https://accounts.google.com/gsi/client')
  await waitForGlobal('google')
  gisInited = true
}

function initTokenClient() {
  return new Promise((resolve, reject) => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          reject(response)
        } else {
          // Persist token + mark as connected
          const tokenObj = window.gapi.client.getToken()
          try {
            localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenObj))
            localStorage.setItem(CONNECTED_KEY, 'true')
          } catch (err) { console.warn('Could not persist gcal token:', err) }
          resolve(response.access_token)
        }
      },
    })
  })
}

// ── Public API ──────────────────────────────────────────────────────────────

export function isConfigured() {
  return !!(CLIENT_ID && API_KEY)
}

// Has the user ever connected Google Calendar?
export function isConnected() {
  try { return localStorage.getItem(CONNECTED_KEY) === 'true' }
  catch (err) { console.warn('localStorage error:', err); return false }
}

// First-time connect: MUST be called from a click handler (browser popup policy).
// After this, silent refresh handles everything.
export async function connect() {
  await ensureGapi()
  await ensureGis()
  const p = initTokenClient()
  tokenClient.requestAccessToken({ prompt: 'consent' })
  return p
}

// Silent token refresh: no popup, no user interaction.
// Works after user has granted consent at least once.
// Times out after 8 seconds to prevent hanging forever.
async function silentRefresh() {
  await ensureGapi()
  await ensureGis()
  const p = initTokenClient()
  tokenClient.requestAccessToken({ prompt: 'none' })
  return Promise.race([
    p,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Silent refresh timed out after 8s')), 8000)
    ),
  ])
}

// Initialize on app load. Tries to restore saved token; if expired, silently refreshes.
// Returns true if we have a working token, false if user needs to click connect.
export async function init() {
  if (!isConfigured()) return false
  if (!isConnected()) return false

  try {
    await ensureGapi()
  } catch (err) {
    console.warn('Google Calendar: gapi failed to load', err)
    return false
  }

  // Try restoring saved token
  try {
    const saved = localStorage.getItem(TOKEN_KEY)
    if (saved) {
      const tokenObj = JSON.parse(saved)
      if (tokenObj?.access_token) {
        window.gapi.client.setToken(tokenObj)

        // Test if the token still works with a lightweight request
        try {
          await window.gapi.client.calendar.calendarList.list({ maxResults: 1 })
          return true
        } catch (expiredErr) {
          console.log('Google Calendar: saved token expired, refreshing silently...', expiredErr.status || '')
          // Token expired; fall through to silent refresh
        }
      }
    }
  } catch (err) {
    console.warn('Google Calendar: error restoring token:', err)
  }

  // Silent refresh (no popup)
  try {
    await silentRefresh()
    return true
  } catch (err) {
    console.warn('Google Calendar: silent refresh failed. User may need to reconnect.', err)
    // If silent refresh fails, mark as disconnected so the button shows
    localStorage.removeItem(CONNECTED_KEY)
    localStorage.removeItem(TOKEN_KEY)
    return false
  }
}

// Disconnect: revoke token, clear storage
export async function disconnect() {
  try {
    await ensureGapi()
    const token = window.gapi.client.getToken()
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token)
      window.gapi.client.setToken(null)
    }
  } catch (err) {
    console.warn('Error during disconnect:', err)
  }
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(CONNECTED_KEY)
}

// ── Event Fetching ──────────────────────────────────────────────────────────

async function fetchCalendarEvents(calendarId, timeMin, timeMax) {
  const response = await window.gapi.client.calendar.events.list({
    calendarId,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 100,
  })
  return response.result.items || []
}

function toMoadEvent(gcalEvent, person) {
  const startDt = gcalEvent.start?.dateTime || gcalEvent.start?.date
  const endDt   = gcalEvent.end?.dateTime   || gcalEvent.end?.date
  if (!startDt) return null

  const startDate = new Date(startDt)
  const endDate   = new Date(endDt)

  const isAllDay = !gcalEvent.start?.dateTime
  const startHour = isAllDay ? 6 : startDate.getHours() + startDate.getMinutes() / 60
  const endHour   = isAllDay ? 7 : endDate.getHours() + endDate.getMinutes() / 60

  const year  = startDate.getFullYear()
  const month = String(startDate.getMonth() + 1).padStart(2, '0')
  const day   = String(startDate.getDate()).padStart(2, '0')

  return {
    id:       `gcal-${gcalEvent.id}`,
    title:    gcalEvent.summary || '(No title)',
    person,
    date:     `${year}-${month}-${day}`,
    start:    startHour,
    end:      endHour,
    isGcal:   true,
    calendarId: gcalEvent.organizer?.email || '',
  }
}

// Fetch events from all configured calendars in parallel.
export async function fetchEvents(timeMin, timeMax) {
  const calendars = []
  if (PERSONAL_CAL) calendars.push({ id: PERSONAL_CAL, label: 'personal' })
  if (WORK_CAL)     calendars.push({ id: WORK_CAL,     label: 'work' })

  if (calendars.length === 0) return []

  const results = await Promise.allSettled(
    calendars.map(cal => fetchCalendarEvents(cal.id, timeMin, timeMax))
  )

  const events = []
  results.forEach((result, i) => {
    const cal = calendars[i]
    if (result.status === 'fulfilled') {
      const mapped = result.value.map(ev => toMoadEvent(ev, 'brittani')).filter(Boolean)
      events.push(...mapped)
      console.log(`Google Calendar (${cal.label}): loaded ${mapped.length} events`)
    } else {
      const err = result.reason
      const code = err?.result?.error?.code || err?.status
      if (code === 404) {
        console.warn(
          `Google Calendar (${cal.label}): "${cal.id}" not found. ` +
          `Make sure this calendar is shared with the account you signed in with.`
        )
      } else {
        console.warn(`Google Calendar (${cal.label}): fetch failed -`, err)
      }
    }
  })

  return events
}