import type { Env } from '../types'
import { hashPassword, verifyPassword, signJWT, requireAuth, AuthError } from '../middleware/auth'

const TOKEN_TTL_DAYS = 15

function uuid(): string {
  return crypto.randomUUID()
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status })
}

export async function handleAuth(request: Request, env: Env, subpath: string): Promise<Response> {
  try {
    if (subpath === '/signup' && request.method === 'POST') return signup(request, env)
    if (subpath === '/login' && request.method === 'POST') return login(request, env)
    if (subpath === '/me' && request.method === 'GET') return me(request, env)
    return new Response('Not found', { status: 404 })
  } catch (err) {
    if (err instanceof AuthError) return json({ error: err.message }, 401)
    throw err
  }
}

async function signup(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { email?: string; username?: string; password?: string }
  const { email, username, password } = body

  if (!email || !username || !password) {
    return json({ error: 'email, username, and password are required' }, 400)
  }
  if (password.length < 8) {
    return json({ error: 'Password must be at least 8 characters' }, 400)
  }

  const existing = await env.DB.prepare(
    `SELECT id FROM users WHERE email = ? OR username = ?`
  ).bind(email.toLowerCase(), username).first()
  if (existing) return json({ error: 'Email or username already taken' }, 409)

  const { hash, salt } = await hashPassword(password)
  const id = uuid()
  const now = new Date().toISOString()

  await env.DB.prepare(
    `INSERT INTO users (id, email, username, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, email.toLowerCase(), username, hash, salt, now).run()

  const token = await signJWT(
    { sub: id, email: email.toLowerCase(), username, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_DAYS * 86400 },
    env.JWT_SECRET
  )

  return json({ token, user: { id, email: email.toLowerCase(), username, created_at: now } }, 201)
}

async function login(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { email?: string; password?: string }
  const { email, password } = body

  if (!email || !password) return json({ error: 'email and password are required' }, 400)

  const user = await env.DB.prepare(
    `SELECT id, email, username, password_hash, salt, created_at FROM users WHERE email = ?`
  ).bind(email.toLowerCase()).first<{ id: string; email: string; username: string; password_hash: string; salt: string; created_at: string }>()

  if (!user) return json({ error: 'Invalid email or password' }, 401)

  const valid = await verifyPassword(password, user.password_hash, user.salt)
  if (!valid) return json({ error: 'Invalid email or password' }, 401)

  const token = await signJWT(
    { sub: user.id, email: user.email, username: user.username, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_DAYS * 86400 },
    env.JWT_SECRET
  )

  return json({ token, user: { id: user.id, email: user.email, username: user.username, created_at: user.created_at } })
}

async function me(request: Request, env: Env): Promise<Response> {
  const payload = await requireAuth(request, env)
  const user = await env.DB.prepare(
    `SELECT id, email, username, created_at FROM users WHERE id = ?`
  ).bind(payload.sub).first()
  if (!user) return json({ error: 'User not found' }, 404)
  return json(user)
}
