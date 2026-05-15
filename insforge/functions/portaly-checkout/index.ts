// InsForge Edge Function template for creating Portaly hosted checkout sessions.
// Deploy with: npx @insforge/cli functions deploy portaly-checkout

type CheckoutRequest = {
  planId: string
  successRedirectUrl?: string
  cancelRedirectUrl?: string
  callbackUrl?: string
  merchantOrderNumber?: string
  discountCode?: string
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

function getCallbackUrl(appBaseUrl: string) {
  return process.env.PORTALY_CALLBACK_URL || `${appBaseUrl}/functions/portaly-webhook`
}

function isValidPlanId(planId: string) {
  return /^[a-zA-Z0-9._:-]{1,80}$/.test(planId)
}

function trustedRedirectUrl(value: unknown, fallback: string) {
  if (typeof value !== 'string' || !value.trim()) return fallback

  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return fallback
    if (!getAllowedOrigins().includes(url.origin)) return fallback
    return url.toString()
  } catch {
    return fallback
  }
}

function safeMerchantOrderNumber(value: unknown) {
  if (typeof value !== 'string') return undefined
  return /^[a-zA-Z0-9._:-]{1,120}$/.test(value) ? value : undefined
}

function safeDiscountCode(value: unknown) {
  if (typeof value !== 'string') return undefined
  return /^[a-zA-Z0-9._:-]{1,80}$/.test(value) ? value : undefined
}

function safeMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key, metadataValue]) => /^[a-zA-Z0-9._:-]{1,60}$/.test(key) && typeof metadataValue === 'string')
      .slice(0, 20)
      .map(([key, metadataValue]) => [key, String(metadataValue).slice(0, 500)]),
  )
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

  const body = (await request.json().catch(() => null)) as Partial<CheckoutRequest> | null
  if (!body || typeof body !== 'object') return json({ error: 'invalid_json' }, 400, corsHeaders)
  if (!body.planId) return json({ error: 'missing_plan_id' }, 400, corsHeaders)
  if (!isValidPlanId(body.planId)) return json({ error: 'invalid_plan_id' }, 400, corsHeaders)

  const appBaseUrl = getAppBaseUrl()
  const checkoutRequest: CheckoutRequest = {
    planId: body.planId,
    successRedirectUrl: trustedRedirectUrl(body.successRedirectUrl, `${appBaseUrl}/?checkout=success`),
    cancelRedirectUrl: trustedRedirectUrl(body.cancelRedirectUrl, `${appBaseUrl}/?checkout=cancelled`),
    callbackUrl: getCallbackUrl(appBaseUrl),
    merchantOrderNumber: safeMerchantOrderNumber(body.merchantOrderNumber),
    discountCode: safeDiscountCode(body.discountCode),
    metadata: {
      app: 'memberhub',
      ...safeMetadata(body.metadata),
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
    return json({ error: 'portaly_checkout_failed', status: response.status }, response.status, corsHeaders)
  }

  return json(payload, 200, corsHeaders)
}
