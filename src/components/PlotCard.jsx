import './PlotCard.css'

const STAGE_ELEMENTS = {
  bare:     ['🌱'],
  seedling: ['🌿', '🌿'],
  growing:  ['🌿', '🌼', '🌿'],
  thriving: ['🌳', '🌸', '🏡', '🌻'],
  lush:     ['🌳', '🌸', '🌻', '🏡', '🌼'],
}

const STAGE_LABELS = {
  bare:     'Bare patch',
  seedling: 'Seedling',
  growing:  'Growing',
  thriving: 'Thriving',
  lush:     'Lush',
}

const PET_EMOJI = { cat: '🐱', dog: '🐶', fish: '🐠' }

export default function PlotCard({ plot, isSelf, onClick }) {
  const { display_name, growth_stage, drift_state, friendship_status, pets = [] } = plot
  const elements = STAGE_ELEMENTS[growth_stage] || STAGE_ELEMENTS.bare
  const isDrifting = drift_state
  const isVirtual = friendship_status === 'virtual'

  const cardClasses = [
    'plot-card',
    isSelf && 'plot-card--self',
    isDrifting && 'plot-card--drifting',
    isVirtual && 'plot-card--virtual',
  ].filter(Boolean).join(' ')

  return (
    <button className={cardClasses} onClick={onClick}>
      <div className="plot-card__stage-label">{STAGE_LABELS[growth_stage]}</div>

      <div className="plot-card__plot">
        <div className="plot-card__elements">
          {elements.map((emoji, i) => (
            <span key={i} className="plot-card__element">{emoji}</span>
          ))}
          {pets.map((pet, i) => (
            <span key={`pet-${i}`} className="plot-card__element">{PET_EMOJI[pet.type] || '🐾'}</span>
          ))}
        </div>
      </div>

      <div className="plot-card__footer">
        <span className="plot-card__name">{isSelf ? 'Your plot' : display_name}</span>
        {isVirtual && <span className="plot-card__virtual-badge">virtual</span>}
        {isDrifting && <span className="plot-card__drift-badge">drifting</span>}
      </div>
    </button>
  )
}
