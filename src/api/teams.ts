import type { Env } from '../types'

const SEASON_ID = 5

export async function handleTeams(env: Env): Promise<Response> {
  const rows = await env.DB.prepare(`
    SELECT
      t.id, t.name, t.nickname, t.city, t.code,
      s.gp, s.w, s.l, s.otl, s.pts, s.gf, s.ga
    FROM team_standings s
    JOIN teams t ON t.id = s.team_id
    WHERE s.season_id = ?
    ORDER BY s.pts DESC, s.w DESC
  `).bind(SEASON_ID).all()

  type Row = { id: unknown; name: unknown; nickname: unknown; city: unknown; code: unknown; gp: unknown; w: unknown; l: unknown; otl: unknown; pts: unknown; gf: unknown; ga: unknown }
  const teams = (rows.results as Row[]).map(r => ({
    id: r.id,
    name: r.name,
    nickname: r.nickname,
    city: r.city,
    code: r.code,
    gp: r.gp,
    w: r.w,
    l: r.l,
    otl: r.otl,
    pts: r.pts,
    gf: r.gf,
    ga: r.ga,
  }))

  return Response.json(teams)
}
