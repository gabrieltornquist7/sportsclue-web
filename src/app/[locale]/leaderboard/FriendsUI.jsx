'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Search,
  User,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Clock,
  Check,
  X,
  Loader
} from 'lucide-react'
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  searchUsers
} from '@/app/leaderboard/actions'

export default function FriendsUI({ initialFriends, initialRequests, userId }) {
  const [activeTab, setActiveTab] = useState('friends') // 'friends', 'requests', 'search'
  const [friends, setFriends] = useState(initialFriends)
  const [incomingRequests, setIncomingRequests] = useState(initialRequests.incoming)
  const [outgoingRequests, setOutgoingRequests] = useState(initialRequests.outgoing)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [message, setMessage] = useState(null)

  // Search users
  const handleSearch = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    const result = await searchUsers(query)
    setSearching(false)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setSearchResults(result.users || [])
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'search') {
        handleSearch(searchQuery)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, activeTab])

  // Send friend request
  const handleSendRequest = async (targetUserId) => {
    setActionLoading(targetUserId)
    const result = await sendFriendRequest(targetUserId)
    setActionLoading(null)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Friend request sent!' })
      // Update search results
      setSearchResults(prev =>
        prev.map(user =>
          user.id === targetUserId
            ? { ...user, friendshipStatus: 'pending', isPendingOutgoing: true }
            : user
        )
      )
      // Refresh in 2 seconds
      setTimeout(() => window.location.reload(), 2000)
    }
  }

  // Accept friend request
  const handleAccept = async (friendshipId) => {
    setActionLoading(friendshipId)
    const result = await acceptFriendRequest(friendshipId)
    setActionLoading(null)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Friend request accepted!' })
      setTimeout(() => window.location.reload(), 1500)
    }
  }

  // Decline friend request
  const handleDecline = async (friendshipId) => {
    setActionLoading(friendshipId)
    const result = await declineFriendRequest(friendshipId)
    setActionLoading(null)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Friend request declined' })
      setIncomingRequests(prev => prev.filter(r => r.id !== friendshipId))
    }
  }

  // Cancel outgoing request
  const handleCancel = async (friendshipId) => {
    setActionLoading(friendshipId)
    const result = await cancelFriendRequest(friendshipId)
    setActionLoading(null)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Friend request cancelled' })
      setOutgoingRequests(prev => prev.filter(r => r.id !== friendshipId))
    }
  }

  // Remove friend
  const handleRemove = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return

    setActionLoading(friendId)
    const result = await removeFriend(friendId)
    setActionLoading(null)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Friend removed' })
      setFriends(prev => prev.filter(f => f.id !== friendId))
    }
  }

  const hasPendingRequests = incomingRequests.length > 0

  return (
    <div className="rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 overflow-hidden">
      {/* Header with Tabs */}
      <div className="border-b border-zinc-800/50">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-50">Friends</h2>
              <p className="text-sm text-zinc-400">{friends.length} friends</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pb-4">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'friends'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>My Friends</span>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'requests'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Requests</span>
            {hasPendingRequests && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white">
                {incomingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Find Friends</span>
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mx-6 mt-6 rounded-xl p-4 backdrop-blur-md border ${
            message.type === 'error'
              ? 'bg-red-900/20 text-red-300 border-red-800/50'
              : 'bg-green-900/20 text-green-300 border-green-800/50'
          }`}
        >
          <p className="font-medium text-sm">{message.text}</p>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Friends List */}
        {activeTab === 'friends' && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-zinc-600" />
                </div>
                <p className="text-zinc-400 text-lg">No friends yet</p>
                <p className="text-zinc-600 text-sm mt-2">Start adding friends to see them here!</p>
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600/50 transition-all"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-zinc-700">
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt={friend.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-zinc-50">{friend.username}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-zinc-500">
                        {friend.coins?.toLocaleString() || 0} coins
                      </span>
                      <span className="text-zinc-700">•</span>
                      <span className="text-xs text-zinc-500">
                        {friend.xp?.toLocaleString() || 0} XP
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      className="p-2 rounded-lg bg-zinc-700/50 hover:bg-zinc-600/50 text-zinc-300 hover:text-white transition-all"
                      title="View Profile"
                    >
                      <User className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleRemove(friend.id)}
                      disabled={actionLoading === friend.id}
                      className="p-2 rounded-lg bg-red-600/20 border border-red-500/50 text-red-300 hover:bg-red-600/30 transition-all disabled:opacity-50"
                      title="Remove Friend"
                    >
                      {actionLoading === friend.id ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <UserMinus className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Friend Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Incoming Requests */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-50 mb-3 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-400" />
                Incoming Requests ({incomingRequests.length})
              </h3>
              <div className="space-y-3">
                {incomingRequests.length === 0 ? (
                  <p className="text-zinc-500 text-sm py-4">No incoming requests</p>
                ) : (
                  incomingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-green-900/10 border border-green-500/30 hover:border-green-500/50 transition-all"
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-green-500/50">
                        {request.profile?.avatar_url ? (
                          <img src={request.profile.avatar_url} alt={request.profile.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-zinc-50">{request.profile?.username}</h3>
                        <p className="text-xs text-zinc-500">Wants to be your friend</p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(request.id)}
                          disabled={actionLoading === request.id}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-green-500/20"
                        >
                          {actionLoading === request.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleDecline(request.id)}
                          disabled={actionLoading === request.id}
                          className="p-2 rounded-lg bg-red-600/20 border border-red-500/50 text-red-300 hover:bg-red-600/30 transition-all disabled:opacity-50"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Outgoing Requests */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-50 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Outgoing Requests ({outgoingRequests.length})
              </h3>
              <div className="space-y-3">
                {outgoingRequests.length === 0 ? (
                  <p className="text-zinc-500 text-sm py-4">No outgoing requests</p>
                ) : (
                  outgoingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-blue-900/10 border border-blue-500/30 hover:border-blue-500/50 transition-all"
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-blue-500/50">
                        {request.profile?.avatar_url ? (
                          <img src={request.profile.avatar_url} alt={request.profile.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-zinc-50">{request.profile?.username}</h3>
                        <p className="text-xs text-zinc-500">Request pending</p>
                      </div>

                      {/* Actions */}
                      <button
                        onClick={() => handleCancel(request.id)}
                        disabled={actionLoading === request.id}
                        className="px-4 py-2 rounded-lg bg-zinc-700/50 hover:bg-zinc-600/50 text-zinc-300 hover:text-white transition-all disabled:opacity-50"
                      >
                        {actionLoading === request.id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          'Cancel'
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        {activeTab === 'search' && (
          <div>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for users by username..."
                  className="w-full px-4 py-3 pl-12 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                {searching && (
                  <Loader className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 animate-spin" />
                )}
              </div>
            </div>

            {/* Search Results */}
            <div className="space-y-3">
              {searchQuery.length < 2 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400">Start typing to search for friends</p>
                </div>
              ) : searchResults.length === 0 && !searching ? (
                <div className="text-center py-12">
                  <UserX className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400">No users found</p>
                </div>
              ) : (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600/50 transition-all"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-zinc-700">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-zinc-50">{user.username}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-zinc-500">
                          {user.coins?.toLocaleString() || 0} coins
                        </span>
                        <span className="text-zinc-700">•</span>
                        <span className="text-xs text-zinc-500">
                          {user.xp?.toLocaleString() || 0} XP
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <div>
                      {user.friendshipStatus === 'accepted' ? (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/50 text-green-300">
                          <UserCheck className="w-4 h-4" />
                          <span className="text-sm font-medium">Friends</span>
                        </div>
                      ) : user.isPendingOutgoing ? (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/50 text-blue-300">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">Pending</span>
                        </div>
                      ) : user.isPendingIncoming ? (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/20 border border-orange-500/50 text-orange-300">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">Respond</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          disabled={actionLoading === user.id}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50"
                        >
                          {actionLoading === user.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserPlus className="w-4 h-4" />
                          )}
                          <span className="text-sm font-medium">Add Friend</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
