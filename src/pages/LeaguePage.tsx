import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

interface RosterPlayer {
  id: string
  player_id: string
  name: string
  position: string
  team: string
  gp: number
  g: number
  a: number
  pts: number
  plusMinus: number
  pim: number
  acquired_at: string
}

interface LeagueDetail {
  id: string
  name: string
  commissioner_id: string
  max_teams: number
  members: {
    id: string
    user_id: string
    username: string
    team_name: string
    roster_size: number
  }[]
}

interface AvailablePlayer {
  id: string
  name: string
  position: string
  team: string
  pts: number
  g: number
  a: number
}

interface Props {
  leagueId: string
  onBack: () => void
}

export default function LeaguePage({ leagueId, onBack }: Props) {
  const { user, authHeader } = useAuth()
  const [league, setLeague] = useState<LeagueDetail | null>(null)
  const [roster, setRoster] = useState<RosterPlayer[]>([])
  const [allPlayers, setAllPlayers] = useState<AvailablePlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'roster' | 'members' | 'add'>('roster')
  const [playerSearch, setPlayerSearch] = useState('')
  const [adding, setAdding] = useState<string | null>(null)

  const isMember = league?.members.some(m => m.user_id === user?.id)

  useEffect(() => {
    loadLeague()
    if (user) loadRoster()
  }, [leagueId, user])

  useEffect(() => {
    if (tab === 'add' && allPlayers.length === 0) loadAllPlayers()
  }, [tab])

  async function loadLeague() {
    setLoading(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}`)
      setLeague(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function loadRoster() {
    const res = await fetch(`/api/leagues/${leagueId}/roster`, { headers: authHeader() })
    if (res.ok) setRoster(await res.json())
  }

  async function loadAllPlayers() {
    const res = await fetch('/api/players')
    setAllPlayers(await res.json())
  }

  async function handleJoin() {
    const teamName = prompt('Enter your team name:')
    if (!teamName) return
    const res = await fetch(`/api/leagues/${leagueId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ team_name: teamName }),
    })
    const data = await res.json() as { error?: string }
    if (!res.ok) { alert(data.error ?? 'Failed to join'); return }
    await loadLeague()
    await loadRoster()
  }

  async function addPlayer(playerId: string) {
    setAdding(playerId)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ player_id: playerId }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) { alert(data.error ?? 'Failed to add player'); return }
      await loadRoster()
    } finally {
      setAdding(null)
    }
  }

  async function dropPlayer(playerId: string) {
    if (!confirm('Drop this player?')) return
    await fetch(`/api/leagues/${leagueId}/roster/${playerId}`, {
      method: 'DELETE',
      headers: authHeader(),
    })
    await loadRoster()
  }

  const rosterPlayerIds = new Set(roster.map(r => r.player_id))
  const filteredPlayers = allPlayers.filter(p =>
    !rosterPlayerIds.has(p.id) &&
    (p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
     p.team?.toLowerCase().includes(playerSearch.toLowerCase()))
  )

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-10 text-slate-500">Loading...</div>
  if (!league) return <div className="max-w-4xl mx-auto px-6 py-10 text-red-600">League not found</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-4">← Back to leagues</button>

      <div className="flex justify-between items-start mb-6">
        <h2 className="text-3xl font-bold text-slate-800">{league.name}</h2>
        {user && !isMember && (
          <button
            onClick={handleJoin}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Join League
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        {(['roster', 'members', ...(isMember ? ['add'] : [])] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t as typeof tab)}
            className={`pb-2 text-sm font-medium border-b-2 -mb-px capitalize ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'add' ? 'Add Players' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'roster' && (
        <div>
          {!user || !isMember ? (
            <p className="text-slate-500">Join the league to manage your roster.</p>
          ) : roster.length === 0 ? (
            <p className="text-slate-500">Your roster is empty. Go to "Add Players" to pick up players.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="pb-2 pr-4">Player</th>
                  <th className="pb-2 pr-4">Pos</th>
                  <th className="pb-2 pr-4">Team</th>
                  <th className="pb-2 pr-4">GP</th>
                  <th className="pb-2 pr-4">G</th>
                  <th className="pb-2 pr-4">A</th>
                  <th className="pb-2 pr-4 font-bold text-slate-700">PTS</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {roster.map(p => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-800">{p.name}</td>
                    <td className="py-2 pr-4 text-slate-600">{p.position}</td>
                    <td className="py-2 pr-4 text-slate-600">{p.team}</td>
                    <td className="py-2 pr-4 text-slate-600">{p.gp}</td>
                    <td className="py-2 pr-4 text-slate-600">{p.g}</td>
                    <td className="py-2 pr-4 text-slate-600">{p.a}</td>
                    <td className="py-2 pr-4 font-bold text-slate-800">{p.pts}</td>
                    <td className="py-2">
                      <button
                        onClick={() => dropPlayer(p.player_id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Drop
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'members' && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="pb-2 pr-4">Team</th>
              <th className="pb-2 pr-4">Manager</th>
              <th className="pb-2">Roster size</th>
            </tr>
          </thead>
          <tbody>
            {league.members.map(m => (
              <tr key={m.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-800">{m.team_name}</td>
                <td className="py-2 pr-4 text-slate-600">{m.username}</td>
                <td className="py-2 text-slate-600">{m.roster_size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'add' && (
        <div>
          <input
            placeholder="Search players..."
            value={playerSearch}
            onChange={e => setPlayerSearch(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="pb-2 pr-4">Player</th>
                <th className="pb-2 pr-4">Pos</th>
                <th className="pb-2 pr-4">Team</th>
                <th className="pb-2 pr-4 font-bold text-slate-700">PTS</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.slice(0, 50).map(p => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-800">{p.name}</td>
                  <td className="py-2 pr-4 text-slate-600">{p.position}</td>
                  <td className="py-2 pr-4 text-slate-600">{p.team}</td>
                  <td className="py-2 pr-4 font-bold text-slate-800">{p.pts}</td>
                  <td className="py-2">
                    <button
                      onClick={() => addPlayer(p.id)}
                      disabled={adding === p.id}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-3 py-1 rounded"
                    >
                      {adding === p.id ? '...' : 'Add'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
