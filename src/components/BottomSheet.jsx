import './BottomSheet.css'

export default function BottomSheet({ isOpen, onClose, children, title }) {
  function handleBackdropClick(e) {
    if (e.target.classList.contains('sheet-backdrop')) onClose()
  }

  return (
    <div
      className={`sheet-backdrop ${isOpen ? 'sheet-backdrop--open' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={`sheet ${isOpen ? 'sheet--open' : ''}`}>
        <div className="sheet__handle" />
        {title && <h2 className="sheet__title">{title}</h2>}
        <div className="sheet__content">
          {children}
        </div>
      </div>
    </div>
  )
}
