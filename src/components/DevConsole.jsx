import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { onDevLog, devLog } from '../lib/devLog'
import './DevConsole.css'

const STAGES = ['bare', 'seedling', 'growing', 'thriving', 'lush']

export default function DevConsole({ user }) {
  const [open, setOpen] = useState(false)
  const [logs, setLogs] = useState([])
  const [plots, setPlots] = useState([])
  const [selectedPlot, setSelectedPlot] = useState('')
  const [selectedStage, setSelectedStage] = useState('seedling')
  const logEndRef = useRef(null)

  // Toggle on ~ key
  useEffect(() => {
    function onKey(e) {
      if (e.key === '`' || e.key === '~') setOpen(o => !o)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Subscribe to dev logs
  useEffect(() => {
    return onDevLog(setLogs)
  }, [])

  // Scroll to bottom on new log
  useEffect(() => {
    if (open) logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, open])

  // Load plots when opened
  useEffect(() => {
    if (!open || !user) return
    supabase
      .from('plots')
      .select('id, friend_id, growth_stage, friend:users!plots_friend_id_fkey(display_name)')
      .eq('owner_id', user.id)
      .then(({ data }) => {
        setPlots(data || [])
        if (data?.length) setSelectedPlot(data[0].id)
      })
  }, [open, user])

  async function clearCooldowns() {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { error } = await supabase
      .from('tend_actions')
      .delete()
      .eq('actor_id', user.id)
      .gte('created_at', todayStart.toISOString())
    if (error) devLog(`Clear cooldowns failed: ${error.message}`, 'error')
    else devLog("Today's cooldowns cleared — refresh to tend again.", 'info')
  }

  async function forceStage() {
    if (!selectedPlot) return
    const { error } = await supabase
      .from('plots')
      .update({ growth_stage: selectedStage })
      .eq('id', selectedPlot)
    if (error) devLog(`Force stage failed: ${error.message}`, 'error')
    else devLog(`Plot set to ${selectedStage} — reload garden to see it.`, 'info')
  }

  async function showSession() {
    const { data: { session } } = await supabase.auth.getSession()
    devLog(`user_id: ${session?.user?.id}`)
    devLog(`email: ${session?.user?.email}`)
    devLog(`expires: ${session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'n/a'}`)
  }

  if (!open) return null

  return (
    <div className="dev-console">
      <div className="dev-console__bar">
        <span className="dev-console__title">~ dev console</span>
        <button className="dev-console__close" onClick={() => setOpen(false)}>✕</button>
      </div>

      <div className="dev-console__log">
        {logs.length === 0 && <span className="dev-console__empty">no logs yet</span>}
        {logs.map((entry, i) => (
          <div key={i} className={`dev-console__entry dev-console__entry--${entry.level}`}>
            <span className="dev-console__time">{entry.time}</span>
            <span className="dev-console__msg">{entry.msg}</span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      <div className="dev-console__actions">
        <button className="dev-console__btn" onClick={clearCooldowns}>
          clear today's cooldowns
        </button>

        <button className="dev-console__btn" onClick={showSession}>
          show session
        </button>

        <div className="dev-console__row">
          <select
            className="dev-console__select"
            value={selectedPlot}
            onChange={e => setSelectedPlot(e.target.value)}
          >
            {plots.map(p => (
              <option key={p.id} value={p.id}>
                {p.friend ? p.friend.display_name : 'your plot'} ({p.growth_stage})
              </option>
            ))}
          </select>

          <select
            className="dev-console__select"
            value={selectedStage}
            onChange={e => setSelectedStage(e.target.value)}
          >
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <button className="dev-console__btn" onClick={forceStage}>
            force stage
          </button>
        </div>
      </div>
    </div>
  )
}
