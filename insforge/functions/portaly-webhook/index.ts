// InsForge Edge Function template for Portaly hosted checkout callbacks.
// Deploy with: npx @insforge/cli functions deploy portaly-webhook

type PortalyPayload = {
  sessionId: string
  subscriptionId?: string
  planId?: string
  status: string
  amountLabel?: string
  invoiceStatus?: string
  metadata?: Record<string, unknown>
}

const encoder = new TextEncoder()

async function hmacHex(secret: string, value: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return mismatch === 0
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const object = value as Record<string, unknown>
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(object[key])}`)
    .join(',')}}`
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 })
  }

  const callbackSecret = process.env.PORTALY_CALLBACK_SECRET
  if (!callbackSecret) {
    return new Response(JSON.stringify({ error: 'missing_callback_secret' }), { status: 500 })
  }

  const timestamp = request.headers.get('x-portaly-timestamp')
  const signature = request.headers.get('x-portaly-signature')
  if (!timestamp || !signature) {
    return new Response(JSON.stringify({ error: 'missing_signature_headers' }), { status: 401 })
  }

  const timestampMs = Date.parse(timestamp)
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return new Response(JSON.stringify({ error: 'stale_callback' }), { status: 401 })
  }

  const payload = (await request.json()) as PortalyPayload
  const expected = await hmacHex(callbackSecret, `${timestamp}.${stableStringify(payload)}`)
  if (!timingSafeEqual(expected, signature)) {
    return new Response(JSON.stringify({ error: 'invalid_signature' }), { status: 401 })
  }

  // Production step:
  // 1. Upsert payment_events by payload.sessionId.
  // 2. If payload.status === "completed", update memberships and invoice task status.
  // 3. Sync member/payment state to Portaly Vibe analytics if needed.
  return new Response(JSON.stringify({ ok: true, sessionId: payload.sessionId, status: payload.status }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
