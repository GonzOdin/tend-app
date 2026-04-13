import { useState, useEffect } from 'react'
import BottomSheet from './BottomSheet'
import { supabase } from '../lib/supabase'
import './FriendPopup.css'

const STAGES = ['bare', 'seedling', 'growing', 'thriving', 'lush']
const STAGE_LABELS = { bare: 'Bare patch', seedling: 'Seedling', growing: 'Growing', thriving: 'Thriving', lush: 'Lush' }

const STAGE_ELEMENTS = {
  bare:     ['🌱'],
  seedling: ['🌿', '🌿'],
  growing:  ['🌸', '🌸', '🪨'],
  thriving: ['🌳', '🌸', '🔥'],
  lush:     ['🌳', '🌸', '🔥', '🏡'],
}

const PET_EMOJI = { cat: '🐱', dog: '🐶', fish: '🐠' }

const REMINDER_EMOJI = { birthday: '🎂', anniversary: '⭐', checkin: '🔔' }

function formatReminderDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function reminderDescription(r) {
  if (r.type === 'checkin') return `${REMINDER_EMOJI.checkin} Check-in · ${r.cadence}`
  const label = r.type === 'anniversary' ? (r.label || 'Anniversary') : 'Birthday'
  const date = r.reminder_date ? ` · ${formatReminderDate(r.reminder_date)}` : ''
  const lead = r.lead_days === 1 ? ' · day of' : r.lead_days === 7 ? ' · 1 week early' : ` · ${r.lead_days} days early`
  return `${REMINDER_EMOJI[r.type]} ${label}${date}${lead}`
}

function loadPlans(userId, friendId) {
  try {
    const raw = localStorage.getItem(`tend_plans_${userId}_${friendId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function savePlans(userId, friendId, plans) {
  localStorage.setItem(`tend_plans_${userId}_${friendId}`, JSON.stringify(plans))
}

export default function FriendPopup({ isOpen, onClose, friend, currentUser, onTend, onReachOut, onAddReminder, reminderVersion }) {
  const [reminders, setReminders] = useState([])
  const [plans, setPlans] = useState([])
  const [showAddPlan, setShowAddPlan] = useState(false)
  const [newPlanLabel, setNewPlanLabel] = useState('')
  const [newPlanDate, setNewPlanDate] = useState('')

  const isSelf = friend?.friendship_status === 'self'

  useEffect(() => {
    if (!isOpen || !friend || !currentUser || isSelf) return
    supabase
      .from('reminders')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('friend_id', friend.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setReminders(data || []))
  }, [isOpen, friend?.id, currentUser?.id, reminderVersion])

  useEffect(() => {
    if (!isOpen || !friend || !currentUser || isSelf) return
    setPlans(loadPlans(currentUser.id, friend.id))
    setShowAddPlan(false)
    setNewPlanLabel('')
    setNewPlanDate('')
  }, [isOpen, friend?.id])

  if (!friend) return null

  const { display_name, growth_stage, drift_state, friendship_status, pets = [] } = friend
  const stageIndex = STAGES.indexOf(growth_stage)
  const elements = STAGE_ELEMENTS[growth_stage] || STAGE_ELEMENTS.bare
  const isDrifting = drift_state
  const isVirtual = friendship_status === 'virtual'

  function handleAddPlan() {
    if (!newPlanLabel.trim()) return
    const updated = [...plans, {
      id: Date.now().toString(),
      label: newPlanLabel.trim(),
      date: newPlanDate,
    }]
    savePlans(currentUser.id, friend.id, updated)
    setPlans(updated)
    setNewPlanLabel('')
    setNewPlanDate('')
    setShowAddPlan(false)
  }

  function handleRemovePlan(id) {
    const updated = plans.filter(p => p.id !== id)
    savePlans(currentUser.id, friend.id, updated)
    setPlans(updated)
  }

  const upcomingPlans = plans
    .filter(p => !p.date || new Date(p.date + 'T00:00:00') >= new Date())
    .sort((a, b) => {
      if (!a.date) return 1
      if (!b.date) return -1
      return new Date(a.date) - new Date(b.date)
    })

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      {/* Mini plot */}
      <div className={`fp-plot ${isDrifting ? 'fp-plot--drifting' : ''} ${isVirtual ? 'fp-plot--virtual' : ''}`}>
        <div className="fp-plot__elements">
          {elements.map((emoji, i) => (
            <span key={i} className="fp-plot__element">{emoji}</span>
          ))}
          {pets.map((pet, i) => (
            <span key={`pet-${i}`} className="fp-plot__element">{PET_EMOJI[pet.type] || '🐾'}</span>
          ))}
        </div>
      </div>

      {/* Name + growth bar */}
      <div className="fp-header">
        <h2 className="fp-name">{display_name}</h2>
        <div className="fp-growth-bar">
          {STAGES.map((stage, i) => (
            <div
              key={stage}
              className={`fp-growth-bar__segment ${i <= stageIndex ? 'fp-growth-bar__segment--filled' : ''} ${i === stageIndex ? 'fp-growth-bar__segment--active' : ''}`}
              title={STAGE_LABELS[stage]}
            />
          ))}
        </div>
        <span className="fp-stage-label">{STAGE_LABELS[growth_stage]}</span>
      </div>

      {/* Primary actions */}
      <div className="fp-actions">
        <button className="btn btn--primary" onClick={onTend}>
          {isSelf ? 'Tend your plot' : 'Tend their plot'}
        </button>
        {!isSelf && (
          <button className="btn btn--secondary" onClick={onReachOut}>
            Reach out
          </button>
        )}
      </div>

      {/* Reminders — only for friends, not self */}
      {!isSelf && (
        <div className="fp-section">
          <div className="fp-section__header">
            <h3 className="fp-section__title">Reminders</h3>
            <button className="fp-section__add" onClick={onAddReminder}>+ add</button>
          </div>
          {reminders.length === 0 ? (
            <p className="fp-section__empty">No reminders set.</p>
          ) : (
            <ul className="fp-reminder-list">
              {reminders.map(r => (
                <li key={r.id} className="fp-reminder-row">{reminderDescription(r)}</li>
              ))}
            </ul>
          )}
          {reminders.length > 0 && (
            <p className="fp-section__note">Notifications coming soon.</p>
          )}
        </div>
      )}

      {/* Upcoming — fake schedule placeholder */}
      {!isSelf && (
        <div className="fp-section">
          <div className="fp-section__header">
            <h3 className="fp-section__title">Upcoming</h3>
            {!showAddPlan && (
              <button className="fp-section__add" onClick={() => setShowAddPlan(true)}>+ add date</button>
            )}
          </div>

          {upcomingPlans.length === 0 && !showAddPlan && (
            <p className="fp-section__empty">Nothing planned yet.</p>
          )}

          {upcomingPlans.length > 0 && (
            <ul className="fp-plan-list">
              {upcomingPlans.map(p => (
                <li key={p.id} className="fp-plan-row">
                  <span className="fp-plan-row__content">
                    🗓 {p.label}{p.date ? ` · ${formatReminderDate(p.date)}` : ''}
                  </span>
                  <button className="fp-plan-row__remove" onClick={() => handleRemovePlan(p.id)}>×</button>
                </li>
              ))}
            </ul>
          )}

          {showAddPlan && (
            <div className="fp-add-plan">
              <input
                className="fp-add-plan__input"
                type="text"
                placeholder="e.g. Coffee, walk, game night"
                value={newPlanLabel}
                onChange={e => setNewPlanLabel(e.target.value)}
                autoFocus
              />
              <input
                className="fp-add-plan__input"
                type="date"
                value={newPlanDate}
                onChange={e => setNewPlanDate(e.target.value)}
              />
              <div className="fp-add-plan__actions">
                <button className="btn btn--primary" onClick={handleAddPlan} disabled={!newPlanLabel.trim()}>
                  Save
                </button>
                <button className="btn btn--ghost" onClick={() => setShowAddPlan(false)}>
                  Cancel
                </button>
              </div>
              <p className="fp-section__note">Saved locally — full schedule coming in a future update.</p>
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  )
}
