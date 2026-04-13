import BottomSheet from './BottomSheet'
import './ReachOutSubsheet.css'

const REACH_OUT_OPTIONS = [
  { key: 'hello',    emoji: '👋', label: 'Quick hello',       description: 'Low pressure, just checking in' },
  { key: 'plan',     emoji: '🗓️', label: 'Plan something',    description: 'Open schedule tab' },
  { key: 'map',      emoji: '📍', label: 'See where they are', description: 'Open map tab' },
  { key: 'gift',     emoji: '🎁', label: 'Send a gift',        description: 'Leave something in their plot' },
]

export default function ReachOutSubsheet({ isOpen, onClose, friend, postTend, onNavigate }) {
  if (!friend) return null

  function handleOption(key) {
    if (key === 'map') {
      onClose()
      onNavigate('map')
    } else if (key === 'plan') {
      onClose()
      onNavigate('schedule')
    } else {
      // hello + gift: close for now, wired in later stages
      onClose()
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      {postTend && (
        <div className="reach-out__context">
          you just tended {friend.display_name}'s plot ✓
        </div>
      )}

      {!postTend && (
        <h2 className="reach-out__title">Reach out to {friend.display_name}</h2>
      )}

      <div className="reach-out__options">
        {REACH_OUT_OPTIONS.map(option => (
          <button
            key={option.key}
            className="reach-out__option"
            onClick={() => handleOption(option.key)}
          >
            <span className="reach-out__option-emoji">{option.emoji}</span>
            <div className="reach-out__option-text">
              <span className="reach-out__option-label">{option.label}</span>
              <span className="reach-out__option-description">{option.description}</span>
            </div>
            <span className="reach-out__option-arrow">›</span>
          </button>
        ))}
      </div>

      <button className="reach-out__dismiss" onClick={onClose}>
        maybe later
      </button>
    </BottomSheet>
  )
}
