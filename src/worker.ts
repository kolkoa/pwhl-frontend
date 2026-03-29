import type { Env } from './types'
import { handleTeams } from './api/teams'
import { handlePlayers } from './api/players'
import { handleAuth } from './api/auth'
import { handleLeagues } from './api/leagues'
import { syncAll } from './api/sync'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    if (!path.startsWith('/api/')) {
      return env.ASSETS.fetch(request)
    }

    try {
      if (path === '/api/teams') return handleTeams(env)
      if (path === '/api/players') return handlePlayers(env)

      if (path.startsWith('/api/auth')) {
        return handleAuth(request, env, path.slice('/api/auth'.length))
      }

      if (path.startsWith('/api/leagues')) {
        return handleLeagues(request, env, path.slice('/api/leagues'.length))
      }

      if (path === '/api/admin/sync' && request.method === 'POST') {
        const result = await syncAll(env)
        return Response.json({ ok: true, ...result })
      }

      return new Response('Not found', { status: 404 })
    } catch (err) {
      console.error(err)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    try {
      const result = await syncAll(env)
      console.log(`Cron sync complete: ${result.teams} teams, ${result.players} players`)
    } catch (err) {
      console.error('Cron sync failed:', err)
    }
  },
}
