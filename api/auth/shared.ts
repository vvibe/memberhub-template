const COOKIE_NAME = 'skills_school_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7
declare const process: { env: Record<string, string | undefined> }

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

export function configuredAccount() {
  return {
    email: env('SKILLS_SCHOOL_TEST_EMAIL'),
    password: env('SKILLS_SCHOOL_TEST_PASSWORD'),
    sessionToken: env('SKILLS_SCHOOL_SESSION_TOKEN'),
    role: env('SKILLS_SCHOOL_TEST_ROLE') === 'member' ? 'member' : 'admin',
  }
}

export function isAuthConfigured() {
  const account = configuredAccount()
  return Boolean(account.email && account.password && account.sessionToken)
}

export function validateCredentials(email: string, password: string) {
  const account = configuredAccount()
  return safeEqual(email.trim().toLowerCase(), account.email.toLowerCase()) && safeEqual(password, account.password)
}

export function parseSessionCookie(cookieHeader = '') {
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim())
  const session = cookies.find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`))
  return session ? decodeURIComponent(session.slice(COOKIE_NAME.length + 1)) : ''
}

export function hasValidSession(cookieHeader = '') {
  const token = parseSessionCookie(cookieHeader)
  return safeEqual(token, configuredAccount().sessionToken)
}

export function sessionCookie() {
  const token = encodeURIComponent(configuredAccount().sessionToken)
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE}`
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
}
