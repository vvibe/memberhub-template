import { clearSessionCookie, siteFromHost } from './shared.js'

type VercelRequest = {
  method?: string
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
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' })
    return
  }

  res.setHeader('Set-Cookie', clearSessionCookie(siteFromHost(req.headers?.host)))
  res.status(200).json({ ok: true })
}
