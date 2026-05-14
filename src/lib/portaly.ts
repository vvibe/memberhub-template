import type { PaymentEvent, Plan } from '../types'

export function createDemoCheckoutSession(plan: Plan) {
  return {
    id: `demo_checkout_${plan.id}_${Date.now()}`,
    planId: plan.id,
    amountLabel: plan.price,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }
}

export function paymentEventToWebhookFixture(event: PaymentEvent) {
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
  'Portaly Vibe 產品優化工具已預設納入流程',
  '使用者只需要申請 Portaly key 與 InsForge key',
  '前台、登入、內容、會員流程完成後，再詢問是否啟用金流',
  '金流先使用 test checkout，確認後才切換 live mode',
  '發票狀態由 payment_events.invoice_status 追蹤',
]
