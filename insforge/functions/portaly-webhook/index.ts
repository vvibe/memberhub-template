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

function normalizeSignature(signature: string) {
  return signature.startsWith('sha256=') ? signature.slice('sha256='.length) : signature
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405)
  }

  const callbackSecret = process.env.PORTALY_CALLBACK_SECRET
  if (!callbackSecret) {
    return json({ error: 'missing_callback_secret' }, 500)
  }

  const timestamp = request.headers.get('x-portaly-timestamp')
  const signature = request.headers.get('x-portaly-signature')
  if (!timestamp || !signature) {
    return json({ error: 'missing_signature_headers' }, 401)
  }

  const timestampMs = Date.parse(timestamp)
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return json({ error: 'stale_callback' }, 401)
  }

  const rawBody = await request.text()
  const expected = await hmacHex(callbackSecret, `${timestamp}.${rawBody}`)
  if (!timingSafeEqual(expected, normalizeSignature(signature))) {
    return json({ error: 'invalid_signature' }, 401)
  }

  let payload: PortalyPayload
  try {
    payload = JSON.parse(rawBody) as PortalyPayload
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }
  if (!payload.sessionId || !payload.status) return json({ error: 'invalid_payload' }, 400)

  // Production step:
  // 1. Upsert payment_events by payload.sessionId.
  // 2. If payload.status === "completed", update memberships and invoice task status.
  // 3. Sync member/payment state to Portaly Vibe analytics if needed.
  return json({ ok: true, sessionId: payload.sessionId, status: payload.status }, 200)
}
