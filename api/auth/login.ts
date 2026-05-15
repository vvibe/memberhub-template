import { configuredAccount, isAuthConfigured, sessionCookie, siteFromHost, validateCredentials } from './shared.js'

type VercelRequest = {
  method?: string
  body?: unknown
  headers?: {
    host?: string
  }
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
  setHeader: (name: string, value: string | string[]) => void
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' })
    return
  }

  const site = siteFromHost(req.headers?.host)
  if (!isAuthConfigured(site)) {
    res.status(503).json({ ok: false, error: 'auth_not_configured' })
    return
  }

  let body: unknown
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    res.status(400).json({ ok: false, error: 'invalid_json' })
    return
  }

  const email = typeof body === 'object' && body && 'email' in body ? String(body.email) : ''
  const password = typeof body === 'object' && body && 'password' in body ? String(body.password) : ''

  if (email.length > 320 || password.length > 256) {
    res.status(400).json({ ok: false, error: 'invalid_credentials' })
    return
  }

  if (!validateCredentials(site, email, password)) {
    res.status(401).json({ ok: false, error: 'invalid_credentials' })
    return
  }

  const account = configuredAccount(site)
  res.setHeader('Set-Cookie', sessionCookie(site))
  res.status(200).json({ ok: true, user: { email: account.email, role: account.role } })
}
