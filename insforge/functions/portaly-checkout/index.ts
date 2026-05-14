// InsForge Edge Function template for creating Portaly hosted checkout sessions.
// Deploy with: npx @insforge/cli functions deploy portaly-checkout

type CheckoutRequest = {
  planId: string
  successRedirectUrl?: string
  cancelRedirectUrl?: string
  callbackUrl?: string
  merchantOrderNumber?: string
  discountCode?: string
  amount?: number
  metadata?: Record<string, string>
}

function getPortalyHost() {
  return process.env.PORTALY_API_HOST || 'https://portaly.cc'
}

function getAppBaseUrl() {
  return process.env.APP_BASE_URL || 'http://localhost:5176'
}

function getAllowedOrigins() {
  const configured = process.env.ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (configured?.length) return configured
  return [getAppBaseUrl(), 'http://localhost:5176', 'http://127.0.0.1:5176']
}

function getCorsHeaders(request: Request) {
  const origin = request.headers.get('origin')
  const headers: Record<string, string> = {
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
    'content-type': 'application/json',
    vary: 'origin',
  }

  if (origin && getAllowedOrigins().includes(origin)) {
    headers['access-control-allow-origin'] = origin
  }

  return headers
}

function isDisallowedBrowserOrigin(request: Request) {
  const origin = request.headers.get('origin')
  return Boolean(origin && !getAllowedOrigins().includes(origin))
}

function json(data: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(data), { status, headers })
}

export default async function handler(request: Request): Promise<Response> {
  const corsHeaders = getCorsHeaders(request)
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: isDisallowedBrowserOrigin(request) ? 403 : 204, headers: corsHeaders })
  }
  if (isDisallowedBrowserOrigin(request)) return json({ error: 'origin_not_allowed' }, 403, corsHeaders)
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, corsHeaders)

  const apiKey = process.env.PORTALY_API_KEY
  if (!apiKey) return json({ error: 'missing_portaly_api_key' }, 500, corsHeaders)

  const body = (await request.json()) as Partial<CheckoutRequest>
  if (!body.planId) return json({ error: 'missing_plan_id' }, 400, corsHeaders)

  const appBaseUrl = getAppBaseUrl()
  const checkoutRequest: CheckoutRequest = {
    planId: body.planId,
    successRedirectUrl: body.successRedirectUrl ?? `${appBaseUrl}/?checkout=success`,
    cancelRedirectUrl: body.cancelRedirectUrl ?? `${appBaseUrl}/?checkout=cancelled`,
    callbackUrl: body.callbackUrl ?? `${appBaseUrl}/functions/portaly-webhook`,
    merchantOrderNumber: body.merchantOrderNumber,
    discountCode: body.discountCode,
    amount: body.amount,
    metadata: {
      app: 'memberhub',
      ...(body.metadata ?? {}),
    },
  }

  const response = await fetch(`${getPortalyHost()}/api/creator-subscription/checkout-sessions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(checkoutRequest),
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    return json({ error: 'portaly_checkout_failed', status: response.status, payload }, response.status, corsHeaders)
  }

  return json(payload, 200, corsHeaders)
}
