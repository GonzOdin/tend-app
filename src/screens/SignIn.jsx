import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './SignIn.css'

export default function SignIn() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return

    setLoading(true)
    setError(null)

    // Store name so we can create the profile after the magic link redirect
    localStorage.setItem('tend_pending_name', name.trim())

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="signin">
        <div className="signin__card">
          <div className="signin__sent-emoji">🌱</div>
          <h1 className="signin__title">Check your email</h1>
          <p className="signin__subtitle">
            We sent a link to <strong>{email}</strong>.<br />
            Tap it to open Tend.
          </p>
          <button
            className="signin__resend"
            onClick={() => { setSent(false) }}
          >
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="signin">
      <div className="signin__card">
        <div className="signin__logo">🌱</div>
        <h1 className="signin__title">Tend</h1>
        <p className="signin__subtitle">Tend your friendships.</p>

        <form className="signin__form" onSubmit={handleSubmit}>
          <div className="signin__field">
            <label className="signin__label" htmlFor="name">Your name</label>
            <input
              id="name"
              className="signin__input"
              type="text"
              placeholder="James"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="given-name"
              required
            />
          </div>

          <div className="signin__field">
            <label className="signin__label" htmlFor="email">Email</label>
            <input
              id="email"
              className="signin__input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {error && <p className="signin__error">{error}</p>}

          <button
            className="signin__submit"
            type="submit"
            disabled={loading || !name.trim() || !email.trim()}
          >
            {loading ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
      </div>
    </div>
  )
}
