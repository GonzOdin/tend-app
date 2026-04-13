import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { devLog, devError } from '../lib/devLog'
import PlotCard from '../components/PlotCard'
import FriendPopup from '../components/FriendPopup'
import TendSubsheet from '../components/TendSubsheet'
import ReachOutSubsheet from '../components/ReachOutSubsheet'
import AddFriendSheet from '../components/AddFriendSheet'
import AddReminderSheet from '../components/AddReminderSheet'
import PointsToast from '../components/PointsToast'
import './Garden.css'

const STAGE_ORDER = ['bare', 'seedling', 'growing', 'thriving', 'lush']

function getGrowthStage(totalActions) {
  if (totalActions >= 50) return 'lush'
  if (totalActions >= 25) return 'thriving'
  if (totalActions >= 10) return 'growing'
  if (totalActions >= 3)  return 'seedling'
  return 'bare'
}

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
  const [pointsToast, setPointsToast] = useState({ show: false, amount: 0 })
  const [reminderVersion, setReminderVersion] = useState(0)

  useEffect(() => {
    loadGardenData()
  }, [user.id])

  async function loadGardenData() {
    setLoading(true)

    try {
      await loadGardenDataInner()
    } catch (err) {
      devError(`Garden load: ${err?.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  async function loadGardenDataInner() {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Run all independent queries in parallel
    const [
      { data: profile },
      { data: soloResult },
      { data: plots },
      { data: friendships },
      { data: actions },
    ] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('plots').select('*').eq('owner_id', user.id).is('friend_id', null).maybeSingle(),
      supabase.from('plots').select(`*, friend:users!plots_friend_id_fkey (id, display_name, avatar_emoji)`).eq('owner_id', user.id).not('friend_id', 'is', null),
      supabase.from('friendships').select('user_b, status').eq('user_a', user.id),
      supabase.from('tend_actions').select('plot_id, action_type').eq('actor_id', user.id).gte('created_at', todayStart.toISOString()),
    ])

    if (profile) {
      setUserProfile(profile)
      setUserPoints(profile.points_total)
    }

    // Create solo plot if missing
    let solo = soloResult
    if (!solo) {
      const { data: created } = await supabase
        .from('plots')
        .insert({ owner_id: user.id })
        .select()
        .single()
      solo = created
    }
    setSelfPlot(solo)

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

    if (actions) {
      setCompletedToday(new Set(actions.map(a => `${a.plot_id}_${a.action_type}`)))
    }
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
    const isSelf = activeFriend.friendship_status === 'self'
    const doneKey = `${plotId}_${actionKey}`
    const newPoints = userPoints + points

    // Optimistic UI
    setCompletedToday(prev => new Set([...prev, doneKey]))
    setUserPoints(newPoints)

    // Write tend_action
    await supabase.from('tend_actions').insert({
      actor_id: user.id,
      plot_id: plotId,
      action_type: actionKey,
      points_earned: points,
    })

    // Update points
    await supabase
      .from('users')
      .update({ points_total: newPoints })
      .eq('id', user.id)

    // Update plot last_tended_at
    await supabase
      .from('plots')
      .update({ last_tended_at: new Date().toISOString(), drift_state: false })
      .eq('id', plotId)

    // Check growth stage advancement
    const { count } = await supabase
      .from('tend_actions')
      .select('*', { count: 'exact', head: true })
      .eq('plot_id', plotId)

    const newStage = getGrowthStage(count)
    const currentStage = isSelf
      ? selfPlot?.growth_stage
      : friendPlots.find(f => f.plotId === plotId)?.growth_stage

    if (newStage !== currentStage && STAGE_ORDER.indexOf(newStage) > STAGE_ORDER.indexOf(currentStage)) {
      await supabase.from('plots').update({ growth_stage: newStage }).eq('id', plotId)
      if (isSelf) {
        setSelfPlot(prev => ({ ...prev, growth_stage: newStage }))
      } else {
        setFriendPlots(prev => prev.map(f =>
          f.plotId === plotId ? { ...f, growth_stage: newStage } : f
        ))
        setActiveFriend(prev => prev ? { ...prev, growth_stage: newStage } : prev)
      }
    }

    // Points toast
    setPointsToast({ show: true, amount: points })

    // Navigation
    if (isSelf) {
      closeAll()
    } else {
      setPostTend(true)
      setActiveSheet('reach-out')
    }
  }

  function handleFriendAdded() {
    loadGardenData()
  }

  function handleAddReminder() {
    setActiveSheet('add-reminder')
  }

  function handleReminderAdded() {
    setReminderVersion(v => v + 1)
    setActiveSheet('friend-popup')
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
        <div className="garden__header-right">
          <div className="garden__points">
            <span className="garden__points-value">{userPoints}</span>
            <span className="garden__points-label">pts</span>
          </div>
          <button className="garden__signout" onClick={() => supabase.auth.signOut()}>
            sign out
          </button>
        </div>
      </div>

      {loading ? (
        <div className="garden__loading">
          <span>🌱</span>
        </div>
      ) : (
        <div className="garden__grid">
          {selfFriend && (
            <div className="garden__self-plot">
              <PlotCard plot={selfFriend} isSelf onClick={() => openFriendPopup(selfFriend)} />
            </div>
          )}

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

          <button
            className="garden__add-friend"
            onClick={() => setActiveSheet('add-friend')}
          >
            + add a friend
          </button>

          {friendPlots.length === 0 && (
            <p className="garden__empty">
              Your garden is yours for now. Add a friend to share it.
            </p>
          )}
        </div>
      )}

      <PointsToast
        amount={pointsToast.amount}
        show={pointsToast.show}
        onDone={() => setPointsToast({ show: false, amount: 0 })}
      />

      <FriendPopup
        isOpen={activeSheet === 'friend-popup'}
        onClose={closeAll}
        friend={activeFriend}
        currentUser={user}
        reminderVersion={reminderVersion}
        onTend={() => setActiveSheet('tend')}
        onReachOut={() => { setPostTend(false); setActiveSheet('reach-out') }}
        onAddReminder={handleAddReminder}
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

      <AddFriendSheet
        isOpen={activeSheet === 'add-friend'}
        onClose={() => setActiveSheet(null)}
        currentUser={user}
        onFriendAdded={handleFriendAdded}
      />

      <AddReminderSheet
        isOpen={activeSheet === 'add-reminder'}
        onClose={() => setActiveSheet('friend-popup')}
        currentUser={user}
        friend={activeFriend}
        onReminderAdded={handleReminderAdded}
      />
    </div>
  )
}
