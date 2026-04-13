import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PlotCard from '../components/PlotCard'
import FriendPopup from '../components/FriendPopup'
import TendSubsheet from '../components/TendSubsheet'
import ReachOutSubsheet from '../components/ReachOutSubsheet'
import './Garden.css'

export default function Garden({ user, onNavigate }) {
  const [selfPlot, setSelfPlot] = useState(null)
  const [friendPlots, setFriendPlots] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const [activeSheet, setActiveSheet] = useState(null)
  const [activeFriend, setActiveFriend] = useState(null)
  const [completedToday, setCompletedToday] = useState(new Set())
  const [userPoints, setUserPoints] = useState(0)
  const [postTend, setPostTend] = useState(false)

  useEffect(() => {
    loadGardenData()
  }, [user.id])

  async function loadGardenData() {
    setLoading(true)

    // Load user profile + points
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      setUserProfile(profile)
      setUserPoints(profile.points_total)
    }

    // Load or create user's solo plot (friend_id is null)
    let { data: solo } = await supabase
      .from('plots')
      .select('*')
      .eq('owner_id', user.id)
      .is('friend_id', null)
      .maybeSingle()

    if (!solo) {
      const { data: created } = await supabase
        .from('plots')
        .insert({ owner_id: user.id })
        .select()
        .single()
      solo = created
    }
    setSelfPlot(solo)

    // Load friend plots (plots with a friend_id, owned by this user)
    const { data: plots } = await supabase
      .from('plots')
      .select(`
        *,
        friend:users!plots_friend_id_fkey (
          id, display_name, avatar_emoji
        )
      `)
      .eq('owner_id', user.id)
      .not('friend_id', 'is', null)

    // Load friendships to get status
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_b, status')
      .eq('user_a', user.id)

    const friendshipMap = {}
    if (friendships) {
      friendships.forEach(f => { friendshipMap[f.user_b] = f.status })
    }

    const enriched = (plots || []).map(p => ({
      ...p.friend,
      plotId: p.id,
      growth_stage: p.growth_stage,
      drift_state: p.drift_state,
      friendship_status: friendshipMap[p.friend_id] || 'virtual',
      pets: p.pets || [],
    }))
    setFriendPlots(enriched)

    // Load today's tend_actions for cooldown
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data: actions } = await supabase
      .from('tend_actions')
      .select('plot_id, action_type')
      .eq('actor_id', user.id)
      .gte('created_at', todayStart.toISOString())

    if (actions) {
      setCompletedToday(new Set(actions.map(a => `${a.plot_id}_${a.action_type}`)))
    }

    setLoading(false)
  }

  function openFriendPopup(friend) {
    setActiveFriend(friend)
    setActiveSheet('friend-popup')
  }

  function closeAll() {
    setActiveSheet(null)
    setPostTend(false)
  }

  async function handleActionComplete(actionKey, points) {
    const plotId = activeFriend.plotId
    const doneKey = `${plotId}_${actionKey}`

    // Optimistic update
    setCompletedToday(prev => new Set([...prev, doneKey]))
    setUserPoints(prev => prev + points)

    // Write to Supabase
    await supabase.from('tend_actions').insert({
      actor_id: user.id,
      plot_id: plotId,
      action_type: actionKey,
      points_earned: points,
    })

    await supabase
      .from('users')
      .update({ points_total: userPoints + points })
      .eq('id', user.id)

    // Also update plot last_tended_at
    await supabase
      .from('plots')
      .update({ last_tended_at: new Date().toISOString(), drift_state: false })
      .eq('id', plotId)

    setPostTend(true)
    setActiveSheet('reach-out')
  }

  const selfFriend = selfPlot
    ? {
        id: user.id,
        plotId: selfPlot.id,
        display_name: userProfile?.display_name || 'You',
        growth_stage: selfPlot.growth_stage,
        drift_state: selfPlot.drift_state,
        friendship_status: 'self',
        pets: selfPlot.pets || [],
      }
    : null

  return (
    <div className="garden">
      <div className="garden__header">
        <h1 className="garden__title">
          {userProfile ? `${userProfile.display_name}'s Garden` : 'Your Garden'}
        </h1>
        <div className="garden__points">
          <span className="garden__points-value">{userPoints}</span>
          <span className="garden__points-label">pts</span>
        </div>
      </div>

      {loading ? (
        <div className="garden__loading">
          <span>🌱</span>
        </div>
      ) : (
        <div className="garden__grid">
          {/* Your own plot — full width at top */}
          {selfFriend && (
            <div className="garden__self-plot">
              <PlotCard plot={selfFriend} isSelf onClick={() => openFriendPopup(selfFriend)} />
            </div>
          )}

          {/* Friend plots */}
          {friendPlots.length > 0 && (
            <div className="garden__friend-grid">
              {friendPlots.map(friend => (
                <PlotCard
                  key={friend.id}
                  plot={friend}
                  isSelf={false}
                  onClick={() => openFriendPopup(friend)}
                />
              ))}
            </div>
          )}

          {friendPlots.length === 0 && (
            <p className="garden__empty">
              Your garden is yours for now. Add a friend to share it.
            </p>
          )}
        </div>
      )}

      <FriendPopup
        isOpen={activeSheet === 'friend-popup'}
        onClose={closeAll}
        friend={activeFriend}
        onTend={() => setActiveSheet('tend')}
        onReachOut={() => { setPostTend(false); setActiveSheet('reach-out') }}
      />

      <TendSubsheet
        isOpen={activeSheet === 'tend'}
        onClose={closeAll}
        friend={activeFriend}
        completedToday={completedToday}
        onActionComplete={handleActionComplete}
      />

      <ReachOutSubsheet
        isOpen={activeSheet === 'reach-out'}
        onClose={closeAll}
        friend={activeFriend}
        postTend={postTend}
        onNavigate={onNavigate}
      />
    </div>
  )
}
