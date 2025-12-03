'use client'

import { useState } from 'react'
import LeaderboardUI from './LeaderboardUI'
import FriendsUI from './FriendsUI'
import ActivityFeedUI from './ActivityFeedUI'

export default function LeaderboardContainer({
  initialRankings,
  initialUserRank,
  userId,
  initialFriends,
  initialRequests,
  initialActivities
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-900">
      <div className="container mx-auto px-6 py-12">
        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Leaderboard (2 columns) */}
          <div className="lg:col-span-2">
            <LeaderboardUI
              initialRankings={initialRankings}
              initialUserRank={initialUserRank}
              userId={userId}
            />
          </div>

          {/* Sidebar - Friends & Activity (1 column) */}
          <div className="space-y-8">
            {/* Friends Section */}
            <FriendsUI
              initialFriends={initialFriends}
              initialRequests={initialRequests}
              userId={userId}
            />

            {/* Activity Feed Section */}
            <ActivityFeedUI
              initialActivities={initialActivities}
              userId={userId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
