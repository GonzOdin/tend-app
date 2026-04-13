import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Garden from './screens/Garden'
import Map from './screens/Map'
import Schedule from './screens/Schedule'
import SignIn from './screens/SignIn'
import SetPassword from './screens/SetPassword'
import './styles/tokens.css'
import './App.css'

const TABS = [
  { id: 'garden',   label: 'Garden',   emoji: '🌱' },
  { id: 'map',      label: 'Map',      emoji: '🗺️' },
  { id: 'schedule', label: 'Schedule', emoji: '🗓️' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('garden')
  const [user, setUser] = useState(undefined) // undefined = loading, null = signed out
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (event === 'PASSWORD_RECOVERY') {
          setNeedsPasswordReset(true)
        } else if (event === 'SIGNED_IN' && currentUser) {
          await ensureUserProfile(currentUser)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (user === undefined) {
    return (
      <div className="app app--loading">
        <span className="app__loading-emoji">🌱</span>
      </div>
    )
  }

  if (user === null) {
    return (
      <div className="app">
        <main className="app__content">
          <SignIn />
        </main>
      </div>
    )
  }

  if (needsPasswordReset) {
    return (
      <div className="app">
        <main className="app__content">
          <SetPassword onDone={() => setNeedsPasswordReset(false)} />
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <main className="app__content">
        {activeTab === 'garden'   && <Garden user={user} onNavigate={setActiveTab} />}
        {activeTab === 'map'      && <Map />}
        {activeTab === 'schedule' && <Schedule />}
      </main>

      <nav className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-bar__tab ${activeTab === tab.id ? 'tab-bar__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-bar__emoji">{tab.emoji}</span>
            <span className="tab-bar__label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// Create a public profile for new users on first sign-in
async function ensureUserProfile(user) {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) return

  const pendingName = localStorage.getItem('tend_pending_name')
  const displayName = pendingName || user.user_metadata?.display_name || user.email.split('@')[0]

  await supabase.from('users').insert({
    id: user.id,
    display_name: displayName,
  })

  localStorage.removeItem('tend_pending_name')
}
