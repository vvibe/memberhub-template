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
  'Portaly Vibe MCP 已放在 project-scoped 設定中',
  '使用者只需要申請 Portaly Vibe MCP token 與 InsForge key',
  '前台、登入、內容、會員流程完成後，再詢問是否啟用金流',
  '金流先使用測試模式，確認後才切換正式收款',
  '發票狀態由 payment_events.invoice_status 追蹤',
]
