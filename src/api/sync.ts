import type { Env } from '../types'

const HT_BASE = 'https://lscluster.hockeytech.com/feed/index.php'
const HT_AUTH = 'key=446521baf8c38984&client_code=pwhl'
const SEASON_ID = 5

export async function syncAll(env: Env): Promise<{ teams: number; players: number }> {
  const [teamsCount, playersCount] = await Promise.all([
    syncTeams(env.DB),
    syncPlayers(env.DB),
  ])
  return { teams: teamsCount, players: playersCount }
}

async function syncTeams(db: D1Database): Promise<number> {
  const url = `${HT_BASE}?feed=modulekit&view=statviewtype&stat=conference&type=standings&season_id=${SEASON_ID}&${HT_AUTH}`
  const res = await fetch(url)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data.SiteKit.Statviewtype as any[]).filter(r => !r.repeatheader)
  const now = new Date().toISOString()

  for (const r of rows) {
    const name = (r.name as string).replace(/^[a-z]\s*-\s*/i, '').trim()

    await db.prepare(
      `INSERT INTO teams (id, name, nickname, city, code)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, nickname=excluded.nickname, city=excluded.city, code=excluded.code`
    ).bind(r.team_id, name, r.nickname, r.city, r.team_code).run()

    await db.prepare(
      `INSERT INTO team_standings (season_id, team_id, gp, w, l, otl, pts, gf, ga, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(season_id, team_id) DO UPDATE SET
         gp=excluded.gp, w=excluded.w, l=excluded.l, otl=excluded.otl,
         pts=excluded.pts, gf=excluded.gf, ga=excluded.ga, synced_at=excluded.synced_at`
    ).bind(
      SEASON_ID, r.team_id,
      Number(r.games_played), Number(r.wins), Number(r.losses), Number(r.ot_losses),
      Number(r.points), Number(r.goals_for), Number(r.goals_against),
      now
    ).run()
  }

  return rows.length
}

async function syncPlayers(db: D1Database): Promise<number> {
  const url = `${HT_BASE}?feed=statviewfeed&view=players&season=${SEASON_ID}&team=all&position=skaters&rookies=0&statsType=standard&rosterstatus=undefined&site_id=0&league_id=1&lang=en&division=-1&conference=-1&${HT_AUTH}&limit=500&sort=points`
  const res = await fetch(url)
  const text = await res.text()

  const json = text.trim().slice(1, -1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = JSON.parse(json) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data[0].sections[0].data as any[]).map(item => item.row)
  const now = new Date().toISOString()

  for (const r of rows) {
    // Look up team_id by code (teams must already be synced)
    const teamRow = await db.prepare(`SELECT id FROM teams WHERE code = ?`).bind(r.team_code).first<{ id: string }>()
    const teamId = teamRow?.id ?? null

    await db.prepare(
      `INSERT INTO players (id, name, team_id, position)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, team_id=excluded.team_id, position=excluded.position`
    ).bind(r.player_id, r.name, teamId, r.position).run()

    await db.prepare(
      `INSERT INTO player_stats (season_id, player_id, gp, g, a, pts, plus_minus, pim, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(season_id, player_id) DO UPDATE SET
         gp=excluded.gp, g=excluded.g, a=excluded.a, pts=excluded.pts,
         plus_minus=excluded.plus_minus, pim=excluded.pim, synced_at=excluded.synced_at`
    ).bind(
      SEASON_ID, r.player_id,
      Number(r.games_played), Number(r.goals), Number(r.assists), Number(r.points),
      Number(r.plus_minus), Number(r.penalty_minutes),
      now
    ).run()
  }

  return rows.length
}
