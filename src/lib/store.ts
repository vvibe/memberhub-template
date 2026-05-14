import type { AppState, PaymentEvent, PlanId, PresetId, Role } from '../types'

const STORAGE_KEY = 'memberhub-demo-state-v3'

export const defaultState: AppState = {
  presetId: 'baking-community',
  role: 'visitor',
  selectedPlanId: 'free',
  completedLessons: [],
  checkedInChallenges: [],
  paymentEvents: [],
  demoContentItems: [],
  demoNewsletterIssues: [],
  demoReferralCampaigns: [],
  demoMembers: [],
  demoModeration: [],
}

export function loadState(): AppState {
  if (typeof localStorage === 'undefined') return defaultState
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState
  } catch {
    return defaultState
  }
}

export function saveState(state: AppState) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function resetState(): AppState {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY)
  return defaultState
}

export function roleLabel(role: Role) {
  if (role === 'admin') return '管理員'
  if (role === 'member') return '會員'
  return '訪客'
}

export function presetLabel(id: PresetId) {
  const labels: Record<PresetId, string> = {
    'baking-community': '烘焙會員社群',
    'design-teacher': '設計師教學',
    'fitness-coach': '健身教練',
    'finance-newsletter': '財經 Newsletter',
  }
  return labels[id]
}

export function createPaymentEvent(planId: PlanId, amountLabel: string): PaymentEvent {
  return {
    id: `pay_${Date.now()}`,
    planId,
    amountLabel,
    provider: 'portaly',
    status: 'paid',
    invoiceStatus: planId === 'free' ? 'not_required' : 'pending',
    createdAt: new Date().toISOString(),
  }
}
