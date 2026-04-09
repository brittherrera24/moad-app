const CLIENT_ID    = import.meta.env.VITE_GCAL_CLIENT_ID
const API_KEY      = import.meta.env.VITE_GCAL_API_KEY
const PERSONAL_CAL = import.meta.env.VITE_GCAL_PERSONAL_ID
const WORK_CAL     = import.meta.env.VITE_GCAL_WORK_ID
const SCOPES       = 'https://www.googleapis.com/auth/calendar.readonly'

let gapiLoaded = false
let gisLoaded  = false

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src; s.async = true; s.defer = true
    s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
}

async function ensureGapi() {
  if (gapiLoaded) return
  await loadScript('https://apis.google.com/js/api.js')
  await new Promise((resolve) => { window.gapi.load('client', resolve) })
  await window.gapi.client.init({ apiKey: API_KEY })
  await window.gapi.client.load('calendar', 'v3')
  gapiLoaded = true
}

async function ensureGis() {
  if (gisLoaded) return
  await loadScript('https://accounts.google.com/gsi/client')
  gisLoaded = true
}

export function isConfigured() {
  return !!(CLIENT_ID && API_KEY)
}

export async function requestAccessToken() {
  await ensureGapi()
  await ensureGis()
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenModel({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) reject(response)
        else resolve(response.access_token)
      },
    })
    tokenClient.requestAccessToken()
  })
}

export function hasToken() {
  return !!(window.gapi?.client?.getToken())
}

export function disconnect() {
  const token = window.gapi?.client?.getToken()
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token)
    window.gapi.client.setToken(null)
  }
}

async function fetchCalendarEvents(calendarId, timeMin, timeMax) {
  try {
    const response = await window.gapi.client.calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    })
    return response.result.items || []
  } catch (err) {
    console.error(`fetchCalendarEvents(${calendarId}):`, err)
    return []
  }
}

function toMoadEvent(gcalEvent, person) {
  const startDt = gcalEvent.start?.dateTime || gcalEvent.start?.date
  const endDt   = gcalEvent.end?.dateTime   || gcalEvent.end?.date
  if (!startDt) return null
  const startDate = new Date(startDt)
  const endDate   = new Date(endDt)
  const isAllDay  = !gcalEvent.start?.dateTime
  const startHour = isAllDay ? 6 : startDate.getHours() + startDate.getMinutes() / 60
  const endHour   = isAllDay ? 7 : endDate.getHours() + endDate.getMinutes() / 60
  const year  = startDate.getFullYear()
  const month = String(startDate.getMonth() + 1).padStart(2, '0')
  const day   = String(startDate.getDate()).padStart(2, '0')
  return {
    id:     `gcal-${gcalEvent.id}`,
    title:  gcalEvent.summary || '(No title)',
    person,
    date:   `${year}-${month}-${day}`,
    start:  startHour,
    end:    endHour,
    isGcal: true,
  }
}

export async function fetchEvents(timeMin, timeMax) {
  const events = []
  if (PERSONAL_CAL) {
    const personal = await fetchCalendarEvents(PERSONAL_CAL, timeMin, timeMax)
    events.push(...personal.map(e => toMoadEvent(e, 'brittani')).filter(Boolean))
  }
  if (WORK_CAL) {
    const work = await fetchCalendarEvents(WORK_CAL, timeMin, timeMax)
    events.push(...work.map(e => toMoadEvent(e, 'brittani')).filter(Boolean))
  }
  return events
}
