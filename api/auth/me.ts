import { configuredAccount, hasValidSession, isAuthConfigured } from './shared.js'

type VercelRequest = {
  headers?: {
    cookie?: string
  }
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthConfigured() || !hasValidSession(req.headers?.cookie)) {
    res.status(200).json({ authenticated: false })
    return
  }

  const account = configuredAccount()
  res.status(200).json({ authenticated: true, user: { email: account.email, role: account.role } })
}
