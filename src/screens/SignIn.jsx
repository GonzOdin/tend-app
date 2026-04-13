import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './SignIn.css'

export default function SignIn() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'forgot'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resetSent, setResetSent] = useState(false)

  function switchMode(next) {
    setMode(next)
    setError(null)
  }

  async function handleForgot(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    })

    setLoading(false)
    if (error) setError(error.message)
    else setResetSent(true)
  }

  async function handleSignIn(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })

    setLoading(false)
    if (error) setError('Wrong email or password.')
  }

  async function handleSignUp(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)

    // Store name so ensureUserProfile can use it
    localStorage.setItem('tend_pending_name', name.trim())

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() } },
    })

    setLoading(false)
    if (error) setError(error.message)
    // On success, onAuthStateChange in App.jsx fires and handles the rest
  }

  return (
    <div className="signin">
      <div className="signin__card">
        <div className="signin__logo">🌱</div>
        <h1 className="signin__title">Tend</h1>
        <p className="signin__subtitle">Tend your friendships.</p>

        {mode === 'signin' ? (
          <form className="signin__form" onSubmit={handleSignIn}>
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

            <div className="signin__field">
              <label className="signin__label" htmlFor="password">Password</label>
              <input
                id="password"
                className="signin__input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && <p className="signin__error">{error}</p>}

            <button
              className="signin__submit"
              type="submit"
              disabled={loading || !email.trim() || !password}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <button
              type="button"
              className="signin__switch"
              onClick={() => switchMode('forgot')}
            >
              Forgot password?
            </button>

            <button
              type="button"
              className="signin__switch"
              onClick={() => switchMode('signup')}
            >
              New here? Create an account
            </button>
          </form>
        ) : mode === 'forgot' ? (
          resetSent ? (
            <div>
              <p className="signin__subtitle">
                Reset link sent to <strong>{email}</strong>. Check your email and tap the link.
              </p>
              <button type="button" className="signin__switch" onClick={() => { setResetSent(false); switchMode('signin') }}>
                Back to sign in
              </button>
            </div>
          ) : (
            <form className="signin__form" onSubmit={handleForgot}>
              <div className="signin__field">
                <label className="signin__label" htmlFor="email-forgot">Email</label>
                <input
                  id="email-forgot"
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
                disabled={loading || !email.trim()}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>

              <button type="button" className="signin__switch" onClick={() => switchMode('signin')}>
                Back to sign in
              </button>
            </form>
          )
        ) : (
          <form className="signin__form" onSubmit={handleSignUp}>
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
              <label className="signin__label" htmlFor="email-up">Email</label>
              <input
                id="email-up"
                className="signin__input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="signin__field">
              <label className="signin__label" htmlFor="password-up">Password</label>
              <input
                id="password-up"
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

            {error && <p className="signin__error">{error}</p>}

            <button
              className="signin__submit"
              type="submit"
              disabled={loading || !name.trim() || !email.trim() || password.length < 6}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>

            <button
              type="button"
              className="signin__switch"
              onClick={() => switchMode('signin')}
            >
              Already have an account? Sign in
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
