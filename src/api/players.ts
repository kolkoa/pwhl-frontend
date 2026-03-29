import type { Env } from '../types'

const SEASON_ID = 5

export async function handlePlayers(env: Env): Promise<Response> {
  const rows = await env.DB.prepare(`
    SELECT
      p.id, p.name, t.code AS team, p.position,
      s.gp, s.g, s.a, s.pts, s.plus_minus AS plusMinus, s.pim
    FROM player_stats s
    JOIN players p ON p.id = s.player_id
    LEFT JOIN teams t ON t.id = p.team_id
    WHERE s.season_id = ?
    ORDER BY s.pts DESC, s.g DESC
  `).bind(SEASON_ID).all()

  return Response.json(rows.results)
}
