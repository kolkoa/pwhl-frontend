import { useEffect, useState } from 'react'
import type { Player } from '../data/players'

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/players')
      .then(r => r.json())
      .then(data => {
        setPlayers(data as Player[])
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load players.')
        setLoading(false)
      })
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">Players</h2>

      {loading && <p className="text-slate-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="w-full text-sm text-left bg-white">
            <thead className="bg-slate-800 text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 text-center">Team</th>
                <th className="px-4 py-3 text-center">Pos</th>
                <th className="px-4 py-3 text-center">GP</th>
                <th className="px-4 py-3 text-center">G</th>
                <th className="px-4 py-3 text-center">A</th>
                <th className="px-4 py-3 text-center font-bold">PTS</th>
                <th className="px-4 py-3 text-center">+/-</th>
                <th className="px-4 py-3 text-center">PIM</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, i) => (
                <tr key={player.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-4 py-3 font-medium text-slate-800">{player.name}</td>
                  <td className="px-4 py-3 text-center font-mono text-slate-500">{player.team}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{player.position}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{player.gp}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{player.g}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{player.a}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-800">{player.pts}</td>
                  <td className={`px-4 py-3 text-center font-medium ${player.plusMinus > 0 ? 'text-green-600' : player.plusMinus < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                    {player.plusMinus > 0 ? `+${player.plusMinus}` : player.plusMinus}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">{player.pim}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
