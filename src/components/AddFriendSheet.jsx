import { useState } from 'react'
import BottomSheet from './BottomSheet'
import { supabase } from '../lib/supabase'
import './AddFriendSheet.css'

const EMOJI_OPTIONS = [
  '🌱', '🌿', '🌸', '🌳', '🍀', '🌻',
  '🦋', '🐝', '🌙', '⭐', '🔥', '💫',
  '🐱', '🐶', '🦊', '🐻',
]

export default function AddFriendSheet({ isOpen, onClose, currentUser, onFriendAdded }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🌱')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase.rpc('create_virtual_friend', {
        p_owner_id: currentUser.id,
        p_display_name: name.trim(),
        p_avatar_emoji: emoji,
      })
      if (error) throw error

      setName('')
      setEmoji('🌱')
      onFriendAdded()
      onClose()
    } catch {
      setError('Something went wrong — try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Add a friend">
      <div className="add-friend">
        <label className="add-friend__label">Their name</label>
        <input
          className="add-friend__input"
          type="text"
          placeholder="e.g. Rae"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={40}
        />

        <label className="add-friend__label">Pick an emoji</label>
        <div className="add-friend__emojis">
          {EMOJI_OPTIONS.map(e => (
            <button
              key={e}
              className={`add-friend__emoji ${emoji === e ? 'add-friend__emoji--selected' : ''}`}
              onClick={() => setEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>

        {error && <p className="add-friend__error">{error}</p>}

        <button
          className="btn btn--primary"
          onClick={handleSubmit}
          disabled={!name.trim() || saving}
        >
          {saving ? 'Adding…' : 'Add to garden'}
        </button>

        <p className="add-friend__note">
          They'll appear as a virtual plot. If they join Tend later, it comes to life.
        </p>
      </div>
    </BottomSheet>
  )
}
