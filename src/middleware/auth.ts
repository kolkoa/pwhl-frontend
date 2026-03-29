import type { Env, JWTPayload } from '../types'

const enc = new TextEncoder()
const dec = new TextDecoder()

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function parseB64url(s: string): Uint8Array<ArrayBuffer> {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')
  return new Uint8Array(Array.from(atob(padded), c => c.charCodeAt(0)))
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign', 'verify']
  )
}

export async function signJWT(payload: JWTPayload, secret: string): Promise<string> {
  const header = b64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body = b64url(enc.encode(JSON.stringify(payload)))
  const key = await hmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${body}`))
  return `${header}.${body}.${b64url(sig)}`
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid token')

  const key = await hmacKey(secret)
  const valid = await crypto.subtle.verify('HMAC', key, parseB64url(parts[2]), enc.encode(`${parts[0]}.${parts[1]}`))
  if (!valid) throw new Error('Invalid signature')

  const payload = JSON.parse(dec.decode(parseB64url(parts[1]))) as JWTPayload
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired')

  return payload
}

export async function requireAuth(request: Request, env: Env): Promise<JWTPayload> {
  const auth = request.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) throw new AuthError('Missing authorization header')
  try {
    return await verifyJWT(auth.slice(7), env.JWT_SECRET)
  } catch {
    throw new AuthError('Invalid or expired token')
  }
}

export class AuthError extends Error {
  status = 401
  constructor(message: string) {
    super(message)
  }
}

// Password hashing via PBKDF2 (Web Crypto — no Node.js required)
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const salt = b64url(saltBytes.buffer)
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: 100_000, hash: 'SHA-256' },
    key, 256
  )
  return { hash: b64url(bits), salt }
}

export async function verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
  const saltBytes = parseB64url(storedSalt)
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: 100_000, hash: 'SHA-256' },
    key, 256
  )
  return b64url(bits) === storedHash
}
