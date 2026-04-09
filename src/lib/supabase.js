import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = (url && key) ? createClient(url, key) : null

// ── Task helpers: convert between app's nested format and flat DB rows ──────

const SECTIONS = ['today','week','nextweek','backlog','waiting','delegate','completed']

function toDbTask(task, section) {
  return {
    id:           task.id,
    title:        task.title,
    category:     task.category || null,
    type:         task.type || null,
    client:       task.client || null,
    sub_tag:      task.subTag || null,
    section,
    est:          task.est || null,
    due:          task.due || null,
    recur:        task.recur || null,
    details:      task.details || null,
    assignee:     task.assignee || null,
    xp:           task.xp || 0,
    completed_at: task.completedAt || null,
    created_at:   task.createdAt || null,
  }
}

function toAppTask(row) {
  const t = { id: row.id, title: row.title }
  if (row.category)     t.category = row.category
  if (row.type)         t.type = row.type
  if (row.client)       t.client = row.client
  if (row.sub_tag)      t.subTag = row.sub_tag
  if (row.est)          t.est = row.est
  if (row.due)          t.due = row.due
  if (row.recur)        t.recur = row.recur
  if (row.details)      t.details = row.details
  if (row.assignee)     t.assignee = row.assignee
  if (row.xp)           t.xp = row.xp
  if (row.completed_at) t.completedAt = row.completed_at
  if (row.created_at)   t.createdAt = row.created_at
  return t
}

export async function loadTasks() {
  if (!supabase) return null
  const { data, error } = await supabase.from('tasks').select('*')
  if (error) { console.error('loadTasks:', error); return null }
  if (!data || data.length === 0) return null

  const nested = {}
  for (const s of SECTIONS) nested[s] = []
  for (const row of data) {
    const section = SECTIONS.includes(row.section) ? row.section : 'today'
    nested[section].push(toAppTask(row))
  }
  return nested
}

export async function saveTasks(taskData) {
  if (!supabase || !taskData) return
  const rows = []
  for (const section of SECTIONS) {
    if (!taskData[section]) continue
    for (const task of taskData[section]) {
      rows.push(toDbTask(task, section))
    }
  }
  // Deduplicate by ID (keep last occurrence in case same task is in multiple sections)
  const seen = new Map()
  for (const row of rows) seen.set(row.id, row)
  const uniqueRows = [...seen.values()]
  // Upsert current rows, then delete any IDs no longer in taskData
  if (uniqueRows.length > 0) {
    const { error: upsertError } = await supabase.from('tasks').upsert(uniqueRows, { onConflict: 'id' })
    if (upsertError) { console.error('saveTasks upsert:', upsertError); return }
  }
  // Remove tasks that were deleted from the app
  const currentIds = uniqueRows.map(r => r.id)
  const { data: existing } = await supabase.from('tasks').select('id')
  const toDelete = (existing || []).map(r => r.id).filter(id => !currentIds.includes(id))
  if (toDelete.length > 0) {
    const { error: delError } = await supabase.from('tasks').delete().in('id', toDelete)
    if (delError) console.error('saveTasks delete old:', delError)
  }
}

// ── Event helpers ───────────────────────────────────────────────────────────

export async function loadEvents() {
  if (!supabase) return null
  const { data, error } = await supabase.from('calendar_events').select('*')
  if (error) { console.error('loadEvents:', error); return null }
  if (!data || data.length === 0) return null
  return data.map(row => ({
    id:     row.id,
    title:  row.title,
    person: row.person,
    date:   row.date,
    start:  row.start_hour,
    end:    row.end_hour,
  }))
}

export async function saveEvents(events) {
  if (!supabase || !events) return
  // Delete all existing rows (id is TEXT so this filter works)
  const { error: delError } = await supabase.from('calendar_events').delete().not('id', 'is', null)
  if (delError) { console.error('saveEvents delete:', delError); return }
  if (events.length > 0) {
    const rows = events.map(e => ({
      id:         String(e.id),
      title:      e.title,
      person:     e.person,
      date:       e.date,
      start_hour: e.start,
      end_hour:   e.end,
    }))
    const { error: insError } = await supabase.from('calendar_events').insert(rows)
    if (insError) console.error('saveEvents insert:', insError)
  }
}

// ── Meal helpers ────────────────────────────────────────────────────────────

export async function loadMeals() {
  if (!supabase) return null
  const { data, error } = await supabase.from('meals').select('*')
  if (error) { console.error('loadMeals:', error); return null }
  if (!data || data.length === 0) return null
  const obj = {}
  for (const row of data) {
    obj[row.date] = { meal: row.meal, people: row.people || [] }
  }
  return obj
}

export async function saveMeals(mealsObj) {
  if (!supabase || !mealsObj) return
  const { error: delError } = await supabase.from('meals').delete().neq('date', '')
  if (delError) console.error('saveMeals delete:', delError)
  const rows = Object.entries(mealsObj).map(([date, { meal, people }]) => ({
    date, meal, people: people || [],
  }))
  if (rows.length > 0) {
    const { error: insError } = await supabase.from('meals').insert(rows)
    if (insError) console.error('saveMeals insert:', insError)
  }
}