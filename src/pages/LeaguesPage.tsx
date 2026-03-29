import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

interface League {
  id: string
  name: string
  commissioner_name: string
  max_teams: number
  member_count: number
  created_at: string
}

interface Props {
  onSelectLeague: (id: string) => void
}

export default function LeaguesPage({ onSelectLeague }: Props) {
  const { user, authHeader } = useAuth()
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createTeamName, setCreateTeamName] = useState('')
  const [createMax, setCreateMax] = useState(10)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchLeagues()
  }, [])

  async function fetchLeagues() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/leagues')
      setLeagues(await res.json())
    } catch {
      setError('Failed to load leagues')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ name: createName, team_name: createTeamName, max_teams: createMax }),
      })
      const data = await res.json() as { id?: string; error?: string }
      if (!res.ok) { alert(data.error ?? 'Failed to create league'); return }
      setShowCreate(false)
      setCreateName('')
      setCreateTeamName('')
      setCreateMax(10)
      await fetchLeagues()
      onSelectLeague(data.id!)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800">Leagues</h2>
        {user && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Create League
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-lg p-6 mb-6 space-y-4">
          <h3 className="font-semibold text-slate-800">New League</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">League name</label>
            <input
              required
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Your team name</label>
            <input
              required
              value={createTeamName}
              onChange={e => setCreateTeamName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Max teams</label>
            <input
              type="number"
              min={2}
              max={20}
              value={createMax}
              onChange={e => setCreateMax(Number(e.target.value))}
              className="w-32 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <p className="text-slate-500">Loading leagues...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && leagues.length === 0 && (
        <p className="text-slate-500">No leagues yet. {user ? 'Create the first one!' : 'Sign in to create one.'}</p>
      )}

      <div className="space-y-3">
        {leagues.map(league => (
          <div
            key={league.id}
            className="bg-white border border-slate-200 rounded-lg p-4 flex justify-between items-center hover:border-blue-300 cursor-pointer"
            onClick={() => onSelectLeague(league.id)}
          >
            <div>
              <p className="font-semibold text-slate-800">{league.name}</p>
              <p className="text-sm text-slate-500">
                Commissioner: {league.commissioner_name} · {league.member_count}/{league.max_teams} teams
              </p>
            </div>
            <span className="text-blue-600 text-sm font-medium">View →</span>
          </div>
        ))}
      </div>
    </div>
  )
}
