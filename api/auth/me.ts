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
  setHeader: (name: string, value: string | string[]) => void
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  const site = siteFromHost(req.headers?.host)
  if (!isAuthConfigured(site) || !hasValidSession(site, req.headers?.cookie)) {
    res.status(200).json({ authenticated: false })
    return
  }

  const account = configuredAccount(site)
  res.status(200).json({ authenticated: true, user: { email: account.email, role: account.role } })
}
