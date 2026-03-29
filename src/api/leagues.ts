import type { Env } from '../types'
import { requireAuth, AuthError } from '../middleware/auth'

function uuid(): string {
  return crypto.randomUUID()
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status })
}

// Route: /api/leagues/*
export async function handleLeagues(request: Request, env: Env, subpath: string): Promise<Response> {
  try {
    const method = request.method

    // /api/leagues
    if (subpath === '' || subpath === '/') {
      if (method === 'GET') return listLeagues(env)
      if (method === 'POST') return createLeague(request, env)
    }

    // /api/leagues/:id
    const idMatch = subpath.match(/^\/([^/]+)$/)
    if (idMatch) {
      const leagueId = idMatch[1]
      if (method === 'GET') return getLeague(env, leagueId)
    }

    // /api/leagues/:id/join
    const joinMatch = subpath.match(/^\/([^/]+)\/join$/)
    if (joinMatch && method === 'POST') return joinLeague(request, env, joinMatch[1])

    // /api/leagues/:id/roster
    const rosterMatch = subpath.match(/^\/([^/]+)\/roster$/)
    if (rosterMatch) {
      if (method === 'GET') return getRoster(request, env, rosterMatch[1])
      if (method === 'POST') return addToRoster(request, env, rosterMatch[1])
    }

    // /api/leagues/:id/roster/:playerId
    const dropMatch = subpath.match(/^\/([^/]+)\/roster\/([^/]+)$/)
    if (dropMatch && method === 'DELETE') return dropFromRoster(request, env, dropMatch[1], dropMatch[2])

    return new Response('Not found', { status: 404 })
  } catch (err) {
    if (err instanceof AuthError) return json({ error: err.message }, 401)
    throw err
  }
}

async function listLeagues(env: Env): Promise<Response> {
  const rows = await env.DB.prepare(`
    SELECT l.*, u.username AS commissioner_name,
           (SELECT COUNT(*) FROM league_members lm WHERE lm.league_id = l.id) AS member_count
    FROM leagues l
    JOIN users u ON u.id = l.commissioner_id
    ORDER BY l.created_at DESC
    LIMIT 50
  `).all()
  return json(rows.results)
}

async function createLeague(request: Request, env: Env): Promise<Response> {
  const payload = await requireAuth(request, env)
  const body = await request.json() as { name?: string; team_name?: string; max_teams?: number }

  if (!body.name) return json({ error: 'name is required' }, 400)
  if (!body.team_name) return json({ error: 'team_name is required' }, 400)

  const leagueId = uuid()
  const memberId = uuid()
  const now = new Date().toISOString()
  const maxTeams = body.max_teams ?? 10

  await env.DB.prepare(
    `INSERT INTO leagues (id, name, commissioner_id, season_id, max_teams, created_at) VALUES (?, ?, ?, 5, ?, ?)`
  ).bind(leagueId, body.name, payload.sub, maxTeams, now).run()

  // Commissioner auto-joins as first member
  await env.DB.prepare(
    `INSERT INTO league_members (id, league_id, user_id, team_name, created_at) VALUES (?, ?, ?, ?, ?)`
  ).bind(memberId, leagueId, payload.sub, body.team_name, now).run()

  const league = await env.DB.prepare(`SELECT * FROM leagues WHERE id = ?`).bind(leagueId).first()
  return json(league, 201)
}

async function getLeague(env: Env, leagueId: string): Promise<Response> {
  const league = await env.DB.prepare(`SELECT * FROM leagues WHERE id = ?`).bind(leagueId).first()
  if (!league) return json({ error: 'League not found' }, 404)

  const members = await env.DB.prepare(`
    SELECT lm.*, u.username,
           (SELECT COUNT(*) FROM fantasy_rosters fr WHERE fr.league_member_id = lm.id AND fr.dropped_at IS NULL) AS roster_size
    FROM league_members lm
    JOIN users u ON u.id = lm.user_id
    WHERE lm.league_id = ?
  `).bind(leagueId).all()

  return json({ ...league, members: members.results })
}

async function joinLeague(request: Request, env: Env, leagueId: string): Promise<Response> {
  const payload = await requireAuth(request, env)
  const body = await request.json() as { team_name?: string }
  if (!body.team_name) return json({ error: 'team_name is required' }, 400)

  const league = await env.DB.prepare(`SELECT * FROM leagues WHERE id = ?`).bind(leagueId).first<{ max_teams: number }>()
  if (!league) return json({ error: 'League not found' }, 404)

  const existing = await env.DB.prepare(
    `SELECT id FROM league_members WHERE league_id = ? AND user_id = ?`
  ).bind(leagueId, payload.sub).first()
  if (existing) return json({ error: 'Already a member of this league' }, 409)

  const memberCount = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM league_members WHERE league_id = ?`
  ).bind(leagueId).first<{ count: number }>()
  if ((memberCount?.count ?? 0) >= league.max_teams) {
    return json({ error: 'League is full' }, 409)
  }

  const id = uuid()
  const now = new Date().toISOString()
  await env.DB.prepare(
    `INSERT INTO league_members (id, league_id, user_id, team_name, created_at) VALUES (?, ?, ?, ?, ?)`
  ).bind(id, leagueId, payload.sub, body.team_name, now).run()

  return json({ id, league_id: leagueId, user_id: payload.sub, team_name: body.team_name, created_at: now }, 201)
}

async function getRoster(request: Request, env: Env, leagueId: string): Promise<Response> {
  const payload = await requireAuth(request, env)

  const member = await env.DB.prepare(
    `SELECT id FROM league_members WHERE league_id = ? AND user_id = ?`
  ).bind(leagueId, payload.sub).first<{ id: string }>()
  if (!member) return json({ error: 'Not a member of this league' }, 403)

  const roster = await env.DB.prepare(`
    SELECT fr.id, fr.acquired_at, p.id AS player_id, p.name, p.position, t.code AS team,
           ps.g, ps.a, ps.pts, ps.gp, ps.plus_minus AS plusMinus, ps.pim
    FROM fantasy_rosters fr
    JOIN players p ON p.id = fr.player_id
    LEFT JOIN teams t ON t.id = p.team_id
    LEFT JOIN player_stats ps ON ps.player_id = p.id AND ps.season_id = 5
    WHERE fr.league_member_id = ? AND fr.dropped_at IS NULL
  `).bind(member.id).all()

  return json(roster.results)
}

async function addToRoster(request: Request, env: Env, leagueId: string): Promise<Response> {
  const payload = await requireAuth(request, env)
  const body = await request.json() as { player_id?: string }
  if (!body.player_id) return json({ error: 'player_id is required' }, 400)

  const member = await env.DB.prepare(
    `SELECT id FROM league_members WHERE league_id = ? AND user_id = ?`
  ).bind(leagueId, payload.sub).first<{ id: string }>()
  if (!member) return json({ error: 'Not a member of this league' }, 403)

  // Check player not already on any roster in this league
  const taken = await env.DB.prepare(`
    SELECT fr.id FROM fantasy_rosters fr
    JOIN league_members lm ON lm.id = fr.league_member_id
    WHERE lm.league_id = ? AND fr.player_id = ? AND fr.dropped_at IS NULL
  `).bind(leagueId, body.player_id).first()
  if (taken) return json({ error: 'Player is already on a roster in this league' }, 409)

  const id = uuid()
  const now = new Date().toISOString()
  await env.DB.prepare(
    `INSERT INTO fantasy_rosters (id, league_member_id, player_id, acquired_at) VALUES (?, ?, ?, ?)`
  ).bind(id, member.id, body.player_id, now).run()

  return json({ id, player_id: body.player_id, acquired_at: now }, 201)
}

async function dropFromRoster(request: Request, env: Env, leagueId: string, playerId: string): Promise<Response> {
  const payload = await requireAuth(request, env)

  const member = await env.DB.prepare(
    `SELECT id FROM league_members WHERE league_id = ? AND user_id = ?`
  ).bind(leagueId, payload.sub).first<{ id: string }>()
  if (!member) return json({ error: 'Not a member of this league' }, 403)

  const rosterEntry = await env.DB.prepare(
    `SELECT id FROM fantasy_rosters WHERE league_member_id = ? AND player_id = ? AND dropped_at IS NULL`
  ).bind(member.id, playerId).first<{ id: string }>()
  if (!rosterEntry) return json({ error: 'Player not on your roster' }, 404)

  await env.DB.prepare(
    `UPDATE fantasy_rosters SET dropped_at = ? WHERE id = ?`
  ).bind(new Date().toISOString(), rosterEntry.id).run()

  return new Response(null, { status: 204 })
}
