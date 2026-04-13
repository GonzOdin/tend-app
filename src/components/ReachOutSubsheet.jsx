import BottomSheet from './BottomSheet'
import './ReachOutSubsheet.css'

const REACH_OUT_OPTIONS = [
  { key: 'hello',    emoji: '👋', label: 'Quick hello',        description: 'Open a text message' },
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
    } else if (key === 'hello') {
      if (friend.phone) {
        const body = encodeURIComponent(`Hey${friend.display_name ? ` ${friend.display_name}` : ''}, thinking of you 🌱`)
        window.location.href = `sms:${friend.phone}?body=${body}`
      }
      onClose()
    } else {
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
        {REACH_OUT_OPTIONS.map(option => {
          const disabled = option.key === 'hello' && !friend.phone
          return (
            <button
              key={option.key}
              className={`reach-out__option ${disabled ? 'reach-out__option--disabled' : ''}`}
              onClick={() => handleOption(option.key)}
            >
              <span className="reach-out__option-emoji">{option.emoji}</span>
              <div className="reach-out__option-text">
                <span className="reach-out__option-label">{option.label}</span>
                <span className="reach-out__option-description">
                  {disabled ? 'Add a phone number to enable' : option.description}
                </span>
              </div>
              <span className="reach-out__option-arrow">›</span>
            </button>
          )
        })}
      </div>

      <button className="reach-out__dismiss" onClick={onClose}>
        maybe later
      </button>
    </BottomSheet>
  )
}
