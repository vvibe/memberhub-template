import type { PaymentEvent, Plan } from '../types'

export function createCheckoutSessionPreview(plan: Plan) {
  return {
    id: `checkout_preview_${plan.id}_${Date.now()}`,
    planId: plan.id,
    amountLabel: plan.price,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }
}

export function paymentEventToCallbackPayload(event: PaymentEvent) {
  return {
    provider: event.provider,
    event_id: event.id,
    type: 'checkout.paid',
    plan_id: event.planId,
    amount: event.amountLabel,
    invoice_status: event.invoiceStatus,
    created_at: event.createdAt,
    idempotency_key: `${event.provider}:${event.id}`,
  }
}

export const portalyIntegrationNotes = [
  'Portaly Vibe MCP 已依官方 guideline 放在 project-scoped 設定中',
  '使用者需要在 Portaly 後台建立正式 MCP Token，並以 PORTALY_API_TOKEN 存在本機',
  '前台、登入、內容、會員流程完成後，再詢問是否啟用金流',
  '金流需要另外設定 server-side checkout key，不要共用 MCP token',
  '發票狀態由 payment_events.invoice_status 追蹤',
]
