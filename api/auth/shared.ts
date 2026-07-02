const COOKIE_NAME = 'memberhub_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7
declare const process: { env: Record<string, string | undefined> }
type SiteKey = 'memberhub'

function env(name: string) {
  return process.env[name]?.trim() ?? ''
}

function safeEqual(left: string, right: string) {
  if (!left || !right || left.length !== right.length) return false
  let result = 0
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return result === 0
}

export function siteFromHost(host = ''): SiteKey {
  return 'memberhub'
}

function envPrefix(site: SiteKey) {
  return 'MEMBERHUB_PREVIEW'
}

function roleFromEnv(value: string) {
  return value === 'member' ? 'member' : 'admin'
}

function accountFromEnv(prefix: string, roleKey: string) {
  return {
    email: env(`${prefix}_EMAIL`),
    password: env(`${prefix}_PASSWORD`),
    sessionToken: env(`${prefix}_SESSION_TOKEN`),
    role: roleFromEnv(env(roleKey)),
  }
}

function cookieName(site: SiteKey) {
  return COOKIE_NAME
}

export function configuredAccount(site: SiteKey = 'memberhub') {
  return accountFromEnv(envPrefix(site), 'MEMBERHUB_PREVIEW_ROLE')
}

export function isAuthConfigured(site: SiteKey = 'memberhub') {
  const account = configuredAccount(site)
  return Boolean(account.email && account.password && account.sessionToken)
}

export function validateCredentials(site: SiteKey, email: string, password: string) {
  const account = configuredAccount(site)
  return safeEqual(email.trim().toLowerCase(), account.email.toLowerCase()) && safeEqual(password, account.password)
}

export function parseSessionCookie(site: SiteKey, cookieHeader = '') {
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim())
  const name = cookieName(site)
  const session = cookies.find((cookie) => cookie.startsWith(`${name}=`))
  return session ? decodeURIComponent(session.slice(name.length + 1)) : ''
}

export function hasValidSession(site: SiteKey, cookieHeader = '') {
  const token = parseSessionCookie(site, cookieHeader)
  return safeEqual(token, configuredAccount(site).sessionToken)
}

export function sessionCookie(site: SiteKey) {
  const token = encodeURIComponent(configuredAccount(site).sessionToken)
  return `${cookieName(site)}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE}`
}

export function clearSessionCookie(site: SiteKey) {
  return `${cookieName(site)}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
}
