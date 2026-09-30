import { createHash, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const derive = promisify(scrypt)
const digest = value => createHash('sha256').update(value).digest()
const opaque = value => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value)

// A deliberately separate, visibly labelled demonstration identity. It cannot
// link to a GitHub/LazyingArt user or inherit anyone else's private documents.
// Only a salted password hash is configured; there is no default credential.
export function createDemoAuth(config) {
  if (config?.enabled !== true) return { enabled: false, current: () => false }
  if (!/^[a-z0-9-]{3,64}$/.test(config.username ?? '') || !opaque(config.salt) || !opaque(config.passwordHash)) throw new Error('Invalid demo account configuration')
  const username = config.username, salt = config.salt, passwordHash = config.passwordHash
  const version = digest(JSON.stringify([username, salt, passwordHash])).toString('base64url')
  const user = Object.freeze({ id: -1, login: 'Bunko demo', kind: 'demo' })
  return {
    enabled: true, version, user,
    current: value => value === version,
    async verify(name, password) {
      if (typeof name !== 'string' || name.length > 128 || typeof password !== 'string' || password.length < 1 || password.length > 256) return false
      const actual = await derive(password, salt, 32, { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 })
      const passwordOK = timingSafeEqual(actual, Buffer.from(passwordHash, 'base64url'))
      return timingSafeEqual(digest(name), digest(username)) && passwordOK
    },
  }
}
