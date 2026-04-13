import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './SignIn.css'

export default function SetPassword({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords don\'t match.')
      return
    }
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setDone(true)
      setTimeout(onDone, 1500)
    }
  }

  if (done) {
    return (
      <div className="signin">
        <div className="signin__card">
          <div className="signin__logo">🌱</div>
          <h1 className="signin__title">Password set</h1>
          <p className="signin__subtitle">You're good to go.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="signin">
      <div className="signin__card">
        <div className="signin__logo">🌱</div>
        <h1 className="signin__title">Set a password</h1>
        <p className="signin__subtitle">You'll use this to sign in from now on.</p>

        <form className="signin__form" onSubmit={handleSubmit}>
          <div className="signin__field">
            <label className="signin__label" htmlFor="new-pw">New password</label>
            <input
              id="new-pw"
              className="signin__input"
              type="password"
              placeholder="at least 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          <div className="signin__field">
            <label className="signin__label" htmlFor="confirm-pw">Confirm password</label>
            <input
              id="confirm-pw"
              className="signin__input"
              type="password"
              placeholder="same again"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {error && <p className="signin__error">{error}</p>}

          <button
            className="signin__submit"
            type="submit"
            disabled={loading || password.length < 6 || !confirm}
          >
            {loading ? 'Saving…' : 'Set password'}
          </button>
        </form>
      </div>
    </div>
  )
}
