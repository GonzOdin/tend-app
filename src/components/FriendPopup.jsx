import BottomSheet from './BottomSheet'
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

export default function FriendPopup({ isOpen, onClose, friend, onTend, onReachOut }) {
  if (!friend) return null

  const { display_name, growth_stage, drift_state, friendship_status, pets = [] } = friend
  const stageIndex = STAGES.indexOf(growth_stage)
  const elements = STAGE_ELEMENTS[growth_stage] || STAGE_ELEMENTS.bare
  const isDrifting = drift_state
  const isVirtual = friendship_status === 'virtual'

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
          Tend their plot
        </button>
        <button className="btn btn--secondary" onClick={onReachOut}>
          Reach out
        </button>
      </div>

      {/* Reminders — collapsed placeholder */}
      <div className="fp-section">
        <h3 className="fp-section__title">Reminders</h3>
        <p className="fp-section__empty">No reminders set — tap to add a birthday or check-in.</p>
      </div>

      {/* History — collapsed placeholder */}
      <div className="fp-section">
        <h3 className="fp-section__title">History</h3>
        <p className="fp-section__empty">No interactions yet. Tend their plot to start.</p>
      </div>
    </BottomSheet>
  )
}
