import { useState } from 'react'
import BottomSheet from './BottomSheet'
import './TendSubsheet.css'

const ACTION_CONFIG = {
  water:     { emoji: '💧', label: 'Water',       points: 2, availability: 'always' },
  weed:      { emoji: '🌿', label: 'Weed',        points: 1, availability: 'always' },
  stone:     { emoji: '🪨', label: 'Place stone', points: 1, availability: 'always' },
  feed_cat:  { emoji: '🐱', label: 'Feed cat',    points: 3, availability: 'has_cat' },
  walk_dog:  { emoji: '🐶', label: 'Walk dog',    points: 3, availability: 'has_dog' },
  feed_fish: { emoji: '🐠', label: 'Feed fish',   points: 3, availability: 'has_fish' },
  tend_fire: { emoji: '🔥', label: 'Tend fire',   points: 2, availability: 'growing_plus' },
}

const GROWING_PLUS = ['growing', 'thriving', 'lush']

function getAvailableActions(friend) {
  const { growth_stage, pets = [] } = friend
  const petTypes = pets.map(p => p.type)

  return Object.entries(ACTION_CONFIG).filter(([key, action]) => {
    if (action.availability === 'always') return true
    if (action.availability === 'has_cat') return petTypes.includes('cat')
    if (action.availability === 'has_dog') return petTypes.includes('dog')
    if (action.availability === 'has_fish') return petTypes.includes('fish')
    if (action.availability === 'growing_plus') return GROWING_PLUS.includes(growth_stage)
    return false
  })
}

export default function TendSubsheet({ isOpen, onClose, friend, completedToday, onActionComplete }) {
  const [pending, setPending] = useState(null) // action key currently animating

  if (!friend) return null

  const availableActions = getAvailableActions(friend)

  function handleAction(actionKey, points) {
    if (pending) return
    const doneKey = `${friend.plotId}_${actionKey}`
    if (completedToday.has(doneKey)) return

    setPending(actionKey)
    setTimeout(() => {
      setPending(null)
      onActionComplete(actionKey, points)
    }, 600)
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Tend ${friend.display_name}'s plot`}>
      <div className="tend-actions">
        {availableActions.map(([key, action]) => {
          const doneKey = `${friend.id}_${key}`
          const isDone = completedToday.has(doneKey)
          const isAnimating = pending === key

          return (
            <button
              key={key}
              className={`tend-action ${isDone ? 'tend-action--done' : ''} ${isAnimating ? 'tend-action--animating' : ''}`}
              onClick={() => handleAction(key, action.points)}
              disabled={isDone || pending !== null}
            >
              <span className="tend-action__emoji">{action.emoji}</span>
              <span className="tend-action__label">{action.label}</span>
              <span className="tend-action__points">
                {isDone ? '✓ done today' : `+${action.points} pts`}
              </span>
              <span className={`tend-action__dot ${isDone ? 'tend-action__dot--done' : 'tend-action__dot--ready'}`} />
            </button>
          )
        })}
      </div>
      <p className="tend-note">Actions refresh each day.</p>
    </BottomSheet>
  )
}
