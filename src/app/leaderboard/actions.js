'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Get leaderboard rankings by metric and time filter
 */
export async function getLeaderboard(metric = 'coins', timeFilter = 'all_time', limit = 100) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Determine date filter
    let dateFilter = null
    if (timeFilter === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      dateFilter = today.toISOString()
    } else if (timeFilter === 'this_week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      weekAgo.setHours(0, 0, 0, 0)
      dateFilter = weekAgo.toISOString()
    }

    // Build query based on metric
    let query = supabase
      .from('profiles')
      .select('id, username, coins, xp, avatar_url, created_at')

    // For time-based filters, we'd need to track historical data
    // For now, we'll just use current values for all_time
    // TODO: Implement historical tracking for time-based filters

    // Order by metric
    const orderColumn = metric === 'coins' ? 'coins' : 'xp'
    query = query.order(orderColumn, { ascending: false })

    // Limit results
    query = query.limit(limit)

    const { data: rankings, error } = await query

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return { error: 'Failed to fetch leaderboard' }
    }

    // Find current user's rank
    const userRank = rankings.findIndex(r => r.id === user.id) + 1

    return {
      success: true,
      rankings: rankings || [],
      userRank,
      userId: user.id
    }
  } catch (error) {
    console.error('Error in getLeaderboard:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get user's friends list
 */
export async function getFriends() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Get friendships where user is involved and status is accepted
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select(`
        user_id_1,
        user_id_2,
        status,
        created_at
      `)
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .eq('status', 'accepted')

    if (error) {
      console.error('Error fetching friends:', error)
      return { error: 'Failed to fetch friends' }
    }

    // Get friend user IDs
    const friendIds = friendships.map(f =>
      f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
    )

    if (friendIds.length === 0) {
      return { success: true, friends: [] }
    }

    // Fetch friend profiles
    const { data: friendProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, coins, xp')
      .in('id', friendIds)

    if (profileError) {
      console.error('Error fetching friend profiles:', profileError)
      return { error: 'Failed to fetch friend profiles' }
    }

    return {
      success: true,
      friends: friendProfiles || []
    }
  } catch (error) {
    console.error('Error in getFriends:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get pending friend requests (incoming and outgoing)
 */
export async function getFriendRequests() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Get incoming requests (where user is user_id_2 and status is pending)
    const { data: incoming, error: incomingError } = await supabase
      .from('friendships')
      .select(`
        id,
        user_id_1,
        status,
        created_at
      `)
      .eq('user_id_2', user.id)
      .eq('status', 'pending')

    if (incomingError) {
      console.error('Error fetching incoming requests:', incomingError)
    }

    // Get outgoing requests (where user is user_id_1 or action_user_id and status is pending)
    const { data: outgoing, error: outgoingError } = await supabase
      .from('friendships')
      .select(`
        id,
        user_id_2,
        status,
        created_at
      `)
      .eq('user_id_1', user.id)
      .eq('status', 'pending')

    if (outgoingError) {
      console.error('Error fetching outgoing requests:', outgoingError)
    }

    // Fetch profiles for incoming requests
    const incomingUserIds = (incoming || []).map(r => r.user_id_1)
    let incomingProfiles = []
    if (incomingUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', incomingUserIds)
      incomingProfiles = profiles || []
    }

    // Fetch profiles for outgoing requests
    const outgoingUserIds = (outgoing || []).map(r => r.user_id_2)
    let outgoingProfiles = []
    if (outgoingUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', outgoingUserIds)
      outgoingProfiles = profiles || []
    }

    // Map profiles to requests
    const incomingWithProfiles = (incoming || []).map(req => {
      const profile = incomingProfiles.find(p => p.id === req.user_id_1)
      return { ...req, profile }
    })

    const outgoingWithProfiles = (outgoing || []).map(req => {
      const profile = outgoingProfiles.find(p => p.id === req.user_id_2)
      return { ...req, profile }
    })

    return {
      success: true,
      incoming: incomingWithProfiles,
      outgoing: outgoingWithProfiles
    }
  } catch (error) {
    console.error('Error in getFriendRequests:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Send friend request
 */
export async function sendFriendRequest(targetUserId) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    if (user.id === targetUserId) {
      return { error: 'Cannot add yourself as a friend' }
    }

    // Check if friendship already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(user_id_1.eq.${user.id},user_id_2.eq.${targetUserId}),and(user_id_1.eq.${targetUserId},user_id_2.eq.${user.id})`)
      .single()

    if (existing) {
      if (existing.status === 'accepted') {
        return { error: 'You are already friends with this user' }
      } else if (existing.status === 'pending') {
        return { error: 'Friend request already pending' }
      }
    }

    // Create friend request
    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id_1: user.id,
        user_id_2: targetUserId,
        status: 'pending',
        action_user_id: user.id
      })

    if (error) {
      console.error('Error sending friend request:', error)
      return { error: 'Failed to send friend request' }
    }

    revalidatePath('/leaderboard')
    return { success: true }
  } catch (error) {
    console.error('Error in sendFriendRequest:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Accept friend request
 */
export async function acceptFriendRequest(friendshipId) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Get friendship details before updating
    const { data: friendship, error: fetchError } = await supabase
      .from('friendships')
      .select('user_id_1, user_id_2')
      .eq('id', friendshipId)
      .single()

    if (fetchError || !friendship) {
      return { error: 'Friendship not found' }
    }

    // Update friendship status
    const { error } = await supabase
      .from('friendships')
      .update({
        status: 'accepted',
        action_user_id: user.id
      })
      .eq('id', friendshipId)
      .eq('user_id_2', user.id) // Ensure user is the recipient
      .eq('status', 'pending')

    if (error) {
      console.error('Error accepting friend request:', error)
      return { error: 'Failed to accept friend request' }
    }

    // Get both users' usernames for activity logging
    const otherUserId = friendship.user_id_1
    const [otherUserResult, currentUserResult] = await Promise.all([
      supabase.from('profiles').select('username').eq('id', otherUserId).single(),
      supabase.from('profiles').select('username').eq('id', user.id).single()
    ])

    // Log activity for both users
    await Promise.all([
      logActivity({
        userId: user.id,
        activityType: 'friend_added',
        metadata: { friend_username: otherUserResult.data?.username || 'Unknown' }
      }),
      logActivity({
        userId: otherUserId,
        activityType: 'friend_added',
        metadata: { friend_username: currentUserResult.data?.username || 'Unknown' }
      })
    ])

    revalidatePath('/leaderboard')
    return { success: true }
  } catch (error) {
    console.error('Error in acceptFriendRequest:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Decline friend request
 */
export async function declineFriendRequest(friendshipId) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Delete friendship
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
      .eq('user_id_2', user.id) // Ensure user is the recipient
      .eq('status', 'pending')

    if (error) {
      console.error('Error declining friend request:', error)
      return { error: 'Failed to decline friend request' }
    }

    revalidatePath('/leaderboard')
    return { success: true }
  } catch (error) {
    console.error('Error in declineFriendRequest:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Cancel outgoing friend request
 */
export async function cancelFriendRequest(friendshipId) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Delete friendship
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
      .eq('user_id_1', user.id) // Ensure user is the sender
      .eq('status', 'pending')

    if (error) {
      console.error('Error cancelling friend request:', error)
      return { error: 'Failed to cancel friend request' }
    }

    revalidatePath('/leaderboard')
    return { success: true }
  } catch (error) {
    console.error('Error in cancelFriendRequest:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Remove friend
 */
export async function removeFriend(friendId) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Delete friendship
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id_1.eq.${user.id},user_id_2.eq.${friendId}),and(user_id_1.eq.${friendId},user_id_2.eq.${user.id})`)
      .eq('status', 'accepted')

    if (error) {
      console.error('Error removing friend:', error)
      return { error: 'Failed to remove friend' }
    }

    revalidatePath('/leaderboard')
    return { success: true }
  } catch (error) {
    console.error('Error in removeFriend:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Search users by username
 */
export async function searchUsers(query) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    if (!query || query.trim().length < 2) {
      return { success: true, users: [] }
    }

    // Search for users
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, coins, xp')
      .ilike('username', `%${query.trim()}%`)
      .neq('id', user.id) // Exclude current user
      .limit(20)

    if (error) {
      console.error('Error searching users:', error)
      return { error: 'Failed to search users' }
    }

    // Get existing friendships for these users
    const userIds = (users || []).map(u => u.id)
    if (userIds.length > 0) {
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2, status')
        .or(`and(user_id_1.eq.${user.id},user_id_2.in.(${userIds.join(',')})),and(user_id_1.in.(${userIds.join(',')}),user_id_2.eq.${user.id})`)

      // Add friendship status to users
      const usersWithStatus = (users || []).map(u => {
        const friendship = (friendships || []).find(
          f => (f.user_id_1 === user.id && f.user_id_2 === u.id) ||
               (f.user_id_1 === u.id && f.user_id_2 === user.id)
        )
        return {
          ...u,
          friendshipStatus: friendship ? friendship.status : null,
          isPendingOutgoing: friendship && friendship.user_id_1 === user.id && friendship.status === 'pending',
          isPendingIncoming: friendship && friendship.user_id_2 === user.id && friendship.status === 'pending'
        }
      })

      return { success: true, users: usersWithStatus }
    }

    return { success: true, users: users || [] }
  } catch (error) {
    console.error('Error in searchUsers:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get activity feed
 */
export async function getActivityFeed(filter = 'all', limit = 100) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    let query = supabase
      .from('activity_feed')
      .select(`
        id,
        user_id,
        activity_type,
        metadata,
        created_at,
        profile:profiles!user_id(username, avatar_url)
      `)

    // Apply filter
    if (filter === 'my_activity') {
      query = query.eq('user_id', user.id)
    } else if (filter === 'friends_only') {
      // Get friend IDs
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
        .eq('status', 'accepted')

      const friendIds = (friendships || []).map(f =>
        f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
      )

      if (friendIds.length > 0) {
        query = query.in('user_id', friendIds)
      } else {
        return { success: true, activities: [] }
      }
    }

    // Order by created_at descending and limit
    query = query.order('created_at', { ascending: false }).limit(limit)

    const { data: activities, error } = await query

    if (error) {
      console.error('Error fetching activity feed:', error)
      return { error: 'Failed to fetch activity feed' }
    }

    return {
      success: true,
      activities: activities || []
    }
  } catch (error) {
    console.error('Error in getActivityFeed:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Log activity to feed
 * @param {Object} params - Activity parameters
 * @param {string} params.userId - User ID
 * @param {string} params.activityType - Type of activity
 * @param {Object} params.metadata - Activity metadata
 */
export async function logActivity({ userId, activityType, metadata = {} }) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('activity_feed')
      .insert({
        user_id: userId,
        activity_type: activityType,
        metadata: metadata
      })

    if (error) {
      console.error('Error logging activity:', error)
      return { error: 'Failed to log activity' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in logActivity:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get mutual friends count
 */
export async function getMutualFriends(targetUserId) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Get current user's friends
    const { data: myFriendships } = await supabase
      .from('friendships')
      .select('user_id_1, user_id_2')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .eq('status', 'accepted')

    const myFriendIds = (myFriendships || []).map(f =>
      f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
    )

    if (myFriendIds.length === 0) {
      return { success: true, count: 0, mutualFriends: [] }
    }

    // Get target user's friends
    const { data: theirFriendships } = await supabase
      .from('friendships')
      .select('user_id_1, user_id_2')
      .or(`user_id_1.eq.${targetUserId},user_id_2.eq.${targetUserId}`)
      .eq('status', 'accepted')

    const theirFriendIds = (theirFriendships || []).map(f =>
      f.user_id_1 === targetUserId ? f.user_id_2 : f.user_id_1
    )

    // Find intersection
    const mutualIds = myFriendIds.filter(id => theirFriendIds.includes(id))

    if (mutualIds.length === 0) {
      return { success: true, count: 0, mutualFriends: [] }
    }

    // Fetch mutual friend profiles
    const { data: mutualProfiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', mutualIds)

    return {
      success: true,
      count: mutualIds.length,
      mutualFriends: mutualProfiles || []
    }
  } catch (error) {
    console.error('Error in getMutualFriends:', error)
    return { error: 'An unexpected error occurred' }
  }
}
