import { useEffect, useState } from 'react'
import type { Team } from '../data/teams'

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/teams')
      .then(r => r.json())
      .then(data => {
        setTeams(data as Team[])
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load teams.')
        setLoading(false)
      })
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">Teams</h2>

      {loading && <p className="text-slate-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="w-full text-sm text-left bg-white">
            <thead className="bg-slate-800 text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3 text-center">GP</th>
                <th className="px-4 py-3 text-center">W</th>
                <th className="px-4 py-3 text-center">L</th>
                <th className="px-4 py-3 text-center">OTL</th>
                <th className="px-4 py-3 text-center font-bold">PTS</th>
                <th className="px-4 py-3 text-center">GF</th>
                <th className="px-4 py-3 text-center">GA</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, i) => (
                <tr key={team.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <span className="text-slate-400 font-mono text-xs mr-2">{team.code}</span>
                    {team.name}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">{team.gp}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{team.w}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{team.l}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{team.otl}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-800">{team.pts}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{team.gf}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{team.ga}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
