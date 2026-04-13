import { useState } from 'react'
import BottomSheet from './BottomSheet'
import { supabase } from '../lib/supabase'
import './AddReminderSheet.css'

const TYPE_OPTIONS = [
  { value: 'birthday',     label: '🎂 Birthday',          hasDate: true  },
  { value: 'anniversary',  label: '⭐ Anniversary',        hasDate: true  },
  { value: 'checkin',      label: '🔔 Check-in cadence',  hasDate: false },
]

const LEAD_OPTIONS = [
  { value: 7, label: '1 week early' },
  { value: 3, label: '3 days early' },
  { value: 1, label: 'Day of' },
]

const CADENCE_OPTIONS = ['daily', 'weekly', 'biweekly', 'monthly']

export default function AddReminderSheet({ isOpen, onClose, currentUser, friend, onReminderAdded }) {
  const [type, setType] = useState('birthday')
  const [label, setLabel] = useState('')
  const [date, setDate] = useState('')
  const [cadence, setCadence] = useState('weekly')
  const [leadDays, setLeadDays] = useState(3)
  const [saving, setSaving] = useState(false)

  const selectedType = TYPE_OPTIONS.find(t => t.value === type)

  async function handleSave() {
    if (!friend || !currentUser) return
    setSaving(true)

    await supabase.from('reminders').insert({
      user_id: currentUser.id,
      friend_id: friend.id,
      type,
      label: type === 'anniversary' ? label || null : null,
      reminder_date: selectedType.hasDate && date ? date : null,
      cadence: type === 'checkin' ? cadence : null,
      lead_days: selectedType.hasDate ? leadDays : null,
    })

    setSaving(false)
    setLabel('')
    setDate('')
    onReminderAdded()
    onClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Reminder for ${friend?.display_name}`}>
      <div className="add-reminder">
        <div className="add-reminder__types">
          {TYPE_OPTIONS.map(t => (
            <button
              key={t.value}
              className={`add-reminder__type ${type === t.value ? 'add-reminder__type--selected' : ''}`}
              onClick={() => setType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {type === 'anniversary' && (
          <>
            <label className="add-reminder__label">Custom label</label>
            <input
              className="add-reminder__input"
              type="text"
              placeholder="e.g. Friendiversary"
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
          </>
        )}

        {selectedType.hasDate && (
          <>
            <label className="add-reminder__label">Date</label>
            <input
              className="add-reminder__input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
            <label className="add-reminder__label">Remind me</label>
            <div className="add-reminder__chips">
              {LEAD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`add-reminder__chip ${leadDays === opt.value ? 'add-reminder__chip--selected' : ''}`}
                  onClick={() => setLeadDays(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}

        {type === 'checkin' && (
          <>
            <label className="add-reminder__label">How often</label>
            <div className="add-reminder__chips">
              {CADENCE_OPTIONS.map(c => (
                <button
                  key={c}
                  className={`add-reminder__chip ${cadence === c ? 'add-reminder__chip--selected' : ''}`}
                  onClick={() => setCadence(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </>
        )}

        <p className="add-reminder__note">Notifications coming soon — your reminder is saved.</p>

        <button
          className="btn btn--primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save reminder'}
        </button>
      </div>
    </BottomSheet>
  )
}
