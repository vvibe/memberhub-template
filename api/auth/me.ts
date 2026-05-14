import { configuredAccount, hasValidSession, isAuthConfigured, siteFromHost } from './shared.js'

type VercelRequest = {
  headers?: {
    cookie?: string
    host?: string
  }
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const site = siteFromHost(req.headers?.host)
  if (!isAuthConfigured(site) || !hasValidSession(site, req.headers?.cookie)) {
    res.status(200).json({ authenticated: false })
    return
  }

  const account = configuredAccount(site)
  res.status(200).json({ authenticated: true, user: { email: account.email, role: account.role } })
}
