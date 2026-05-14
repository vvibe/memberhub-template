import { configuredAccount, isAuthConfigured, sessionCookie, validateCredentials } from './shared.js'

type VercelRequest = {
  method?: string
  body?: unknown
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
  setHeader: (name: string, value: string | string[]) => void
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' })
    return
  }

  if (!isAuthConfigured()) {
    res.status(503).json({ ok: false, error: 'auth_not_configured' })
    return
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const email = typeof body === 'object' && body && 'email' in body ? String(body.email) : ''
  const password = typeof body === 'object' && body && 'password' in body ? String(body.password) : ''

  if (!validateCredentials(email, password)) {
    res.status(401).json({ ok: false, error: 'invalid_credentials' })
    return
  }

  const account = configuredAccount()
  res.setHeader('Set-Cookie', sessionCookie())
  res.status(200).json({ ok: true, user: { email: account.email, role: account.role } })
}
