export interface Env {
  DB: D1Database
  ASSETS: Fetcher
  JWT_SECRET: string
}

export interface User {
  id: string
  email: string
  username: string
  created_at: string
}

export interface League {
  id: string
  name: string
  commissioner_id: string
  season_id: number
  max_teams: number
  created_at: string
}

export interface LeagueMember {
  id: string
  league_id: string
  user_id: string
  team_name: string
  created_at: string
}

export interface JWTPayload {
  sub: string      // user id
  email: string
  username: string
  exp: number
}
