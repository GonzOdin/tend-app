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
      // Create virtual user
      const { data: virtualUser, error: userErr } = await supabase
        .from('users')
        .insert({ display_name: name.trim(), avatar_emoji: emoji })
        .select()
        .single()
      if (userErr) throw userErr

      // Create their plot owned by current user
      const { error: plotErr } = await supabase
        .from('plots')
        .insert({ owner_id: currentUser.id, friend_id: virtualUser.id })
      if (plotErr) throw plotErr

      // Create friendship (virtual = one-sided, they haven't joined yet)
      const { error: friendErr } = await supabase
        .from('friendships')
        .insert({ user_a: currentUser.id, user_b: virtualUser.id, status: 'virtual' })
      if (friendErr) throw friendErr

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
