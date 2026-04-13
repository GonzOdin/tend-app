import { useEffect } from 'react'
import './PointsToast.css'

export default function PointsToast({ amount, show, onDone }) {
  useEffect(() => {
    if (!show) return
    const timer = setTimeout(onDone, 1100)
    return () => clearTimeout(timer)
  }, [show])

  if (!show) return null

  return (
    <div className="points-toast">+{amount} pts</div>
  )
}
