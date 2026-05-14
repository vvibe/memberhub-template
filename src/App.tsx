import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  AlertCircle,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  Flame,
  Gift,
  Globe2,
  Hash,
  LayoutDashboard,
  LogIn,
  Lock,
  Mail,
  Megaphone,
  MessageSquareText,
  PlayCircle,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { getPreset, presets } from './data/presets'
import { createCheckoutSessionPreview, portalyIntegrationNotes } from './lib/portaly'
import { createPaymentEvent, loadState, presetLabel, resetState, roleLabel, saveState } from './lib/store'
import type { AppState, ContentItem, Course, Member, ModerationItem, NewsletterIssue, Plan, PresetId, ReferralCampaign, Role, VerticalPreset, ViewId } from './types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const navItems: Array<{ id: ViewId; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'home', label: '預覽', icon: Globe2 },
  { id: 'blog', label: '部落格', icon: FileText },
  { id: 'join', label: '加入會員', icon: CircleDollarSign },
  { id: 'content', label: '內容庫', icon: BookOpen },
  { id: 'newsletter', label: '通訊', icon: Megaphone },
  { id: 'courses', label: '課程', icon: PlayCircle },
  { id: 'community', label: '社群', icon: MessageSquareText },
  { id: 'members', label: '成員', icon: UsersRound },
  { id: 'search', label: '搜尋', icon: Search },
  { id: 'challenges', label: '打卡', icon: Trophy },
  { id: 'events', label: '活動', icon: CalendarDays },
  { id: 'login', label: '登入', icon: LogIn },
  { id: 'member', label: '會員', icon: UserRound },
  { id: 'admin', label: '後台', icon: LayoutDashboard },
  { id: 'setup', label: '設定', icon: Settings2 },
]

const validPresetIds = new Set(presets.map((preset) => preset.id))
const validViewIds = new Set(navItems.map((item) => item.id))
const publicationHiddenViews: ViewId[] = ['courses', 'community', 'members', 'challenges', 'events']

function isPresetId(value: string): value is PresetId {
  return validPresetIds.has(value as PresetId)
}

function normalizePresetId(value: string | null): PresetId | undefined {
  if (!value) return undefined
  if (value === 'superstake') return 'signal-brief'
  return isPresetId(value) ? value : undefined
}

function isViewId(value: string): value is ViewId {
  return validViewIds.has(value as ViewId)
}

function presetIdFromHost(hostname: string): PresetId | undefined {
  const host = hostname.toLowerCase()
  if (host.includes('signal-brief')) return 'signal-brief'
  if (host.includes('skills-school')) return 'skills-school'
  return undefined
}

function isPublicationPreset(preset: { id: string }) {
  return preset.id === 'signal-brief'
}

function navLabel(item: { id: ViewId; label: string }, preset: { id: string }) {
  if (!isPublicationPreset(preset)) return item.label
  const labels: Partial<Record<ViewId, string>> = {
    home: '首頁',
    blog: '文章',
    join: '訂閱',
    content: '文章庫',
    newsletter: '電子報',
    member: '我的訂閱',
  }
  return labels[item.id] ?? item.label
}

function getInitialRoute() {
  if (typeof window === 'undefined') return { presetId: undefined, view: undefined }
  const params = new URLSearchParams(window.location.search)
  const caseParam = params.get('case') ?? params.get('preset')
  const viewParam = params.get('view')
  const presetId = normalizePresetId(caseParam) ?? presetIdFromHost(window.location.hostname)

  return {
    presetId,
    view: viewParam && isViewId(viewParam) ? viewParam : undefined,
  }
}

function siteEyebrow(preset: ReturnType<typeof getPreset>) {
  return isPublicationPreset(preset) ? '獨立策略通訊' : '職能學習社群'
}

function brandMark(preset: ReturnType<typeof getPreset>) {
  return preset.id === 'signal-brief' ? 'S' : 'S'
}

function homeMetrics(preset: ReturnType<typeof getPreset>, selectedPlan: Plan) {
  if (isPublicationPreset(preset)) {
    return [
      { label: '本月研究', value: '8 篇', icon: BarChart3 },
      { label: '讀者', value: String(preset.metrics.activeMembers), icon: UsersRound },
      { label: '資料庫更新', value: '每週', icon: ChevronRight },
      { label: '目前方案', value: selectedPlan.name, icon: ShieldCheck },
    ]
  }

  return [
    { label: '本月回饋', value: '36 份', icon: BarChart3 },
    { label: '學員', value: String(preset.metrics.activeMembers), icon: UsersRound },
    { label: '課程進度', value: `${preset.courses[0]?.progress ?? 0}%`, icon: ChevronRight },
    { label: '目前方案', value: selectedPlan.name, icon: ShieldCheck },
  ]
}

function beforeJoinEyebrow(preset: ReturnType<typeof getPreset>) {
  return isPublicationPreset(preset) ? '訂閱前先閱讀' : '加入前先看看'
}

function beforeJoinHeading(preset: ReturnType<typeof getPreset>) {
  return isPublicationPreset(preset) ? '訂閱前可以先閱讀的公開文章與研究節奏' : '加入前可以先看見的內容與社群節奏'
}

function defaultViewForRole(role: Role): ViewId {
  if (role === 'admin') return 'admin'
  if (role === 'member') return 'member'
  return 'home'
}

type AuthResult = {
  ok: boolean
  error?: string
}

function roleProfile(preset: ReturnType<typeof getPreset>, role: Role) {
  const publication = isPublicationPreset(preset)
  if (publication) {
    if (role === 'admin') {
      return {
        label: '管理員視角',
        title: '出版者後台開啟',
        description: '可以管理文章、設定付費牆段落、排程 Newsletter、查看讀者與訂閱狀態。',
        points: ['後台與設定可見', '可編輯付費牆', '可查看讀者資料'],
      }
    }
    if (role === 'member') {
      return {
        label: '付費讀者視角',
        title: '已解鎖完整文章',
        description: '可以閱讀付費牆後的完整內容，並在我的訂閱中查看方案、收據與贈閱狀態。',
        points: ['付費文章完整可讀', '可管理訂閱', '不顯示後台'],
      }
    }
    return {
      label: '訪客視角',
      title: '先閱讀公開文章',
      description: '可以直接閱讀免費文章；付費文章會停在創作者設定的付費牆位置。',
      points: ['免費文章可讀', '付費文章被鎖定', '不顯示後台'],
    }
  }

  if (role === 'admin') {
    return {
      label: '管理員視角',
      title: '社群營運後台開啟',
      description: '可以編輯內容與課程、邀請會員、查看審核佇列、管理活動與付款狀態。',
      points: ['後台與設定可見', '可邀請會員', '可管理課程與社群'],
    }
  }
  if (role === 'member') {
    return {
      label: '會員視角',
      title: '課程與社群已解鎖',
      description: '可以接續課程進度、進入會員討論、完成打卡，並查看自己的會員方案。',
      points: ['會員內容可讀', '可更新課程進度', '可打卡與參與討論'],
    }
  }
  return {
    label: '訪客視角',
    title: '只看到公開預覽',
    description: '可以瀏覽公開內容與方案；課程進度、會員討論、打卡與後台功能會被保留給會員或管理員。',
    points: ['公開內容可讀', '會員功能鎖定', '不顯示後台'],
  }
}

function contentTypeLabel(type: ContentItem['type'] | string) {
  const labels: Record<string, string> = {
    article: '文章',
    video: '影片',
    podcast: '音訊',
    resource: '資源',
    newsletter: '通訊',
    course: '課程',
    lesson: '單元',
    thread: '討論',
    member: '成員',
    event: '活動',
  }
  return labels[type] ?? type
}

function contentParagraphs(item: Pick<ContentItem, 'body'>) {
  return item.body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function paywallParagraph(item: ContentItem) {
  const paragraphCount = Math.max(1, contentParagraphs(item).length)
  return Math.min(Math.max(1, item.paywallAfterParagraph ?? 1), paragraphCount)
}

function limitedFreeDate(item: ContentItem) {
  if (!item.limitedFreeUntil) return null
  const date = new Date(item.limitedFreeUntil)
  return Number.isNaN(date.getTime()) ? null : date
}

function isLimitedFreeActive(item: ContentItem, now = new Date()) {
  const date = limitedFreeDate(item)
  return Boolean(item.isPaid && date && date.getTime() > now.getTime())
}

function requiresPaidAccess(item: ContentItem) {
  return item.isPaid && !isLimitedFreeActive(item)
}

function isContentLocked(item: ContentItem, hasPaidAccess: boolean) {
  return requiresPaidAccess(item) && !hasPaidAccess
}

function limitedFreeLabel(item: ContentItem) {
  const date = limitedFreeDate(item)
  if (!date) return ''
  return `限時免費至 ${date.toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`
}

function datetimeLocalValue(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function sourceLabel(source: string) {
  const labels: Record<string, string> = {
    blog: '公開網站',
    course: '課程教室',
    classroom: '課程教室',
    resource: '資源庫',
    email: '電子報',
    'member research': '會員研究',
    database: '資料庫',
    podcast: '音訊',
    newsletter: '電子報',
    referral: '會員推薦',
    line: 'LINE',
    organic: '自然搜尋',
    'community preview': '社群預覽頁',
    'public blog': '公開部落格',
    'subscriber gift': '會員贈閱',
    'referral link': '推薦連結',
    'live campaign': '直播活動',
  }
  return labels[source] ?? source
}

function channelLabel(channel: string) {
  const labels: Record<string, string> = {
    email: 'Email',
    line: 'LINE',
    'in-app': '站內通知',
  }
  return labels[channel] ?? channel
}

function segmentLabel(segment: string) {
  const labels: Record<string, string> = {
    all: '全部訂閱者',
    paid: '付費會員',
    free: '免費讀者',
  }
  return labels[segment] ?? segment
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    scheduled: '已排程',
    draft: '草稿',
    sent: '已發送',
    ready: '已準備',
    active: '有效',
    free: '免費',
    reviewing: '審核中',
    open: '待處理',
    resolved: '已完成',
    upcoming: '即將開始',
    replay: '可回看',
  }
  return labels[status] ?? status
}

function notificationTriggerLabel(trigger: string) {
  const labels: Record<string, string> = {
    'new-post': '新內容發布',
    'live-start': '直播開始提醒',
    'course-reminder': '課程進度提醒',
    'payment-failed': '付款未完成提醒',
  }
  return labels[trigger] ?? trigger
}

function notificationAudienceLabel(audience: string, publication = false) {
  const labels: Record<string, string> = publication ? {
    all: '全部讀者',
    free: '免費讀者',
    paid: '付費讀者',
    'at-risk': '需關懷讀者',
  } : {
    all: '全部會員',
    free: '免費會員',
    paid: '付費會員',
    'at-risk': '需關懷會員',
    subscribers: '訂閱讀者',
  }
  return labels[audience] ?? audience
}

function moderationKindLabel(kind: string, publication = false) {
  const labels: Record<string, string> = publication ? {
    'membership-question': '訂閱問題',
    'reported-post': '留言檢舉',
    'automod-risk': '存取風險',
    'billing-dispute': '退款爭議',
  } : {
    'membership-question': '入會問題',
    'reported-post': '檢舉內容',
    'automod-risk': '風險行為',
    'billing-dispute': '付款爭議',
  }
  return labels[kind] ?? kind
}

function priorityLabel(priority: string) {
  const labels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
  }
  return labels[priority] ?? priority
}

function resourceKindLabel(kind: string) {
  const labels: Record<string, string> = {
    template: '模板',
    link: '連結',
    file: '檔案',
    transcript: '逐字稿',
  }
  return labels[kind] ?? kind
}

function accessLabel(access: string) {
  const labels: Record<string, string> = {
    free: '公開',
    member: '會員',
    'level-gated': '進階會員',
    paid: '付費會員',
    subscribers: '訂閱者',
    all: '全部會員',
  }
  return labels[access] ?? access
}

function roleDisplayLabel(role: string) {
  const labels: Record<string, string> = {
    member: '會員',
    moderator: '版主',
    admin: '管理員',
  }
  return labels[role] ?? role
}

function riskLabel(risk: string) {
  const labels: Record<string, string> = {
    low: '穩定',
    medium: '需關注',
    high: '高風險',
  }
  return labels[risk] ?? risk
}

function eventKindLabel(kind: string) {
  const labels: Record<string, string> = {
    live: '直播',
    webinar: 'Webinar',
    'office-hour': '問答時段',
  }
  return labels[kind] ?? kind
}

function paymentValueLabel(value?: string) {
  const labels: Record<string, string> = {
    not_required: '尚未產生',
    pending: '待處理',
    issued: '已開立',
    active: '有效',
    ready: '可使用',
  }
  return value ? labels[value] ?? value : '尚未產生'
}

function mergePresetOverrides(preset: VerticalPreset, override?: Partial<VerticalPreset>): VerticalPreset {
  if (!override) return preset
  return {
    ...preset,
    ...override,
    brand: { ...preset.brand, ...override.brand },
    copy: { ...preset.copy, ...override.copy },
    metrics: { ...preset.metrics, ...override.metrics },
    plans: override.plans ?? preset.plans,
    content: override.content ?? preset.content,
    newsletter: override.newsletter ?? preset.newsletter,
    courses: override.courses ?? preset.courses,
    threads: override.threads ?? preset.threads,
    challenges: override.challenges ?? preset.challenges,
    events: override.events ?? preset.events,
    members: override.members ?? preset.members,
    referrals: override.referrals ?? preset.referrals,
    moderation: override.moderation ?? preset.moderation,
    notifications: override.notifications ?? preset.notifications,
  }
}

function updateById<T extends { id: string }>(items: T[], id: string, patch: Partial<T>) {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

function App() {
  const initialRoute = useMemo(() => getInitialRoute(), [])
  const standalonePresetId = useMemo(() => {
    if (typeof window === 'undefined') return undefined
    return presetIdFromHost(window.location.hostname)
  }, [])
  const formalAuthPresetId = standalonePresetId === 'skills-school' || standalonePresetId === 'signal-brief' ? standalonePresetId : undefined
  const formalAuth = Boolean(formalAuthPresetId)
  const formalSkillsAuth = formalAuthPresetId === 'skills-school'
  const [state, setState] = useState<AppState>(() => {
    const storedState = loadState()
    if (formalAuthPresetId) {
      return {
        ...storedState,
        presetId: formalAuthPresetId,
        role: 'visitor',
        selectedPlanId: 'free',
      }
    }
    if (!initialRoute.presetId) return storedState
    return {
      ...storedState,
      presetId: initialRoute.presetId,
      selectedPlanId: 'free',
      localContentItems: [],
      localNewsletterIssues: [],
      localReferralCampaigns: [],
      localMembers: [],
      localModeration: [],
    }
  })
  const [view, setView] = useState<ViewId>(initialRoute.view ?? 'home')
  const [query, setQuery] = useState('')
  const [globalQuery, setGlobalQuery] = useState('')
  const [authEmail, setAuthEmail] = useState<string | null>(null)
  const [authChecking, setAuthChecking] = useState(formalAuth)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    if (!formalAuthPresetId) return
    let active = true

    fetch('/api/auth/me')
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return
        if (payload?.authenticated && payload?.user?.email) {
          const role: Role = payload.user.role === 'member' ? 'member' : 'admin'
          const authenticatedPreset = getPreset(formalAuthPresetId)
          const memberPlan = authenticatedPreset.plans.find((plan) => plan.highlighted) ?? authenticatedPreset.plans[1] ?? authenticatedPreset.plans[0]
          setState((prev) => ({
            ...prev,
            presetId: formalAuthPresetId,
            role,
            selectedPlanId: memberPlan.id,
          }))
          setAuthEmail(payload.user.email)
          setView(role === 'admin' ? 'admin' : 'member')
          return
        }
        setAuthEmail(null)
        setState((prev) => ({ ...prev, presetId: formalAuthPresetId, role: 'visitor', selectedPlanId: 'free' }))
      })
      .catch(() => {
        if (!active) return
        setAuthEmail(null)
        setState((prev) => ({ ...prev, presetId: formalAuthPresetId, role: 'visitor', selectedPlanId: 'free' }))
      })
      .finally(() => {
        if (active) setAuthChecking(false)
      })

    return () => {
      active = false
    }
  }, [formalAuthPresetId])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('case', state.presetId)
    params.set('view', view)
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
  }, [state.presetId, view])

  const preset = useMemo(() => getPreset(state.presetId), [state.presetId])
  const runtimePreset = useMemo(
    () => {
      const configuredPreset = mergePresetOverrides(preset, state.presetOverrides[preset.id])
      return {
        ...configuredPreset,
        content: [...state.localContentItems, ...configuredPreset.content],
        newsletter: [...state.localNewsletterIssues, ...configuredPreset.newsletter],
        referrals: [...state.localReferralCampaigns, ...configuredPreset.referrals],
        members: [...state.localMembers, ...configuredPreset.members],
        moderation: [...state.localModeration, ...configuredPreset.moderation],
      }
    },
    [preset, state.localContentItems, state.localMembers, state.localModeration, state.localNewsletterIssues, state.localReferralCampaigns, state.presetOverrides],
  )
  const selectedPlan = runtimePreset.plans.find((plan) => plan.id === state.selectedPlanId) ?? runtimePreset.plans[0]
  const currentMember = runtimePreset.members[0]
  const activeLevel = state.role === 'visitor' ? 0 : currentMember.level
  const hasPaidAccess = state.role === 'admin' || state.selectedPlanId !== 'free'
  const visibleNavItems = useMemo(
    () => {
      let items = isPublicationPreset(runtimePreset)
        ? navItems.filter((item) => !publicationHiddenViews.includes(item.id))
        : navItems

      if (state.role !== 'admin') items = items.filter((item) => !['admin', 'setup', 'newsletter'].includes(item.id))
      if (state.role === 'visitor') items = items.filter((item) => !['member', 'members'].includes(item.id))
      if (state.role !== 'visitor') items = items.filter((item) => item.id !== 'login')
      return items
    },
    [runtimePreset.id, state.role],
  )

  useEffect(() => {
    if (isPublicationPreset(runtimePreset) && publicationHiddenViews.includes(view)) {
      setView('blog')
    }
  }, [runtimePreset.id, view])

  useEffect(() => {
    if (!visibleNavItems.some((item) => item.id === view)) {
      setView(defaultViewForRole(state.role))
    }
  }, [state.role, view, visibleNavItems])

  const updateState = (patch: Partial<AppState>) => setState((prev) => ({ ...prev, ...patch }))

  const handlePresetChange = (presetId: PresetId) => {
    const nextPreset = getPreset(presetId)
    updateState({
      presetId,
      selectedPlanId: 'free',
      completedLessons: [],
      checkedInChallenges: [],
      paymentEvents: [],
      presetOverrides: state.presetOverrides,
      localContentItems: [],
      localNewsletterIssues: [],
      localReferralCampaigns: [],
      localMembers: [],
      localModeration: [],
    })
    document.documentElement.style.setProperty('--brand-primary', nextPreset.brand.primary)
    document.documentElement.style.setProperty('--brand-accent', nextPreset.brand.accent)
  }

  const handleUpdatePreset = (patch: Partial<VerticalPreset>) => {
    updateState({
      presetOverrides: {
        ...state.presetOverrides,
        [runtimePreset.id]: {
          ...state.presetOverrides[runtimePreset.id],
          ...patch,
          brand: patch.brand ? { ...(state.presetOverrides[runtimePreset.id]?.brand ?? {}), ...patch.brand } : state.presetOverrides[runtimePreset.id]?.brand,
          copy: patch.copy ? { ...(state.presetOverrides[runtimePreset.id]?.copy ?? {}), ...patch.copy } : state.presetOverrides[runtimePreset.id]?.copy,
        },
      },
    })
  }

  const handleRoleChange = (role: Role) => {
    const memberPlan = runtimePreset.plans.find((plan) => plan.highlighted) ?? runtimePreset.plans[1] ?? runtimePreset.plans[0]
    updateState({
      role,
      selectedPlanId: role === 'visitor' ? 'free' : memberPlan.id,
    })
    setView(defaultViewForRole(role))
  }

  const handleCheckout = (plan: Plan) => {
    const session = createCheckoutSessionPreview(plan)
    const event = createPaymentEvent(plan.id, session.amountLabel)
    updateState({
      role: 'member',
      selectedPlanId: plan.id,
      paymentEvents: [event, ...state.paymentEvents],
    })
    setView('member')
  }

  const handleLogin = (role: Role = 'member') => {
    const memberPlan = runtimePreset.plans.find((plan) => plan.highlighted) ?? runtimePreset.plans[1] ?? runtimePreset.plans[0]
    updateState({
      role,
      selectedPlanId: role === 'visitor' ? 'free' : memberPlan.id,
    })
    setView(role === 'admin' ? 'admin' : 'member')
  }

  const handleCredentialsLogin = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        if (payload?.error === 'auth_not_configured') return { ok: false, error: '登入服務尚未完成環境變數設定。' }
        return { ok: false, error: '帳號或密碼不正確。' }
      }

      const role: Role = payload.user?.role === 'member' ? 'member' : 'admin'
      const memberPlan = runtimePreset.plans.find((plan) => plan.highlighted) ?? runtimePreset.plans[1] ?? runtimePreset.plans[0]
      setAuthEmail(payload.user.email)
      updateState({
        role,
        selectedPlanId: memberPlan.id,
      })
      setView(role === 'admin' ? 'admin' : 'member')
      return { ok: true }
    } catch {
      return { ok: false, error: '暫時無法連線到登入服務，請稍後再試。' }
    }
  }

  const handleLogout = async () => {
    if (formalAuth) {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
      setAuthEmail(null)
    }
    updateState({ role: 'visitor', selectedPlanId: 'free' })
    setView('home')
  }

  const handleCreateContent = (item: Omit<ContentItem, 'id' | 'source' | 'minutes'>) => {
    const nextItem: ContentItem = {
      ...item,
      id: `local_content_${Date.now()}`,
      source: 'editor',
      minutes: Math.max(3, Math.ceil(item.body.length / 220)),
    }
    updateState({ localContentItems: [nextItem, ...state.localContentItems] })
    setQuery('')
  }

  const handleAddNewsletterIssue = () => {
    const issueNumber = state.localNewsletterIssues.length + 1
    const nextIssue: NewsletterIssue = {
      id: `local_issue_${Date.now()}`,
      subject: `新增快訊 ${issueNumber}：${runtimePreset.name} 本週內容預告`,
      segment: 'paid',
      status: 'draft',
      sendAt: 'draft',
      openRate: '-',
      clickRate: '-',
      paidConversions: 0,
    }
    updateState({ localNewsletterIssues: [nextIssue, ...state.localNewsletterIssues] })
  }

  const handleCreateReferralCampaign = () => {
    const serial = state.localReferralCampaigns.length + 1
    const campaign: ReferralCampaign = {
      id: `local_ref_${Date.now()}`,
      code: `GIFT${serial + 7}`,
      label: `會員贈閱活動 ${serial}`,
      source: 'manual gift link',
      reward: '新會員 7 天試用，推薦人獲得續訂提醒',
      freeTrials: 0,
      paidConversions: 0,
      revenueLabel: 'NT$0',
    }
    updateState({ localReferralCampaigns: [campaign, ...state.localReferralCampaigns] })
  }

  const handleInviteMember = () => {
    const serial = state.localMembers.length + 1
    const member: Member = {
      id: `local_member_${Date.now()}`,
      name: `新會員 ${serial}`,
      email: `new.member${serial}@${runtimePreset.id === 'signal-brief' ? 'signalbrief.tw' : 'skillsschool.tw'}`,
      role: 'member',
      groupRole: 'member',
      planId: 'free',
      status: 'free',
      level: 1,
      points: 0,
      source: 'manual invite',
      bio: '由後台邀請加入的會員，等待完成入會問題。',
      joinedAt: new Date().toISOString().slice(0, 10),
      contributions: { posts: 0, comments: 0, likesReceived: 0 },
      risk: 'low',
    }
    const review: ModerationItem = {
      id: `local_review_${Date.now()}`,
      kind: 'membership-question',
      title: '邀請會員待完成入會問題',
      subject: member.name,
      status: 'open',
      priority: 'medium',
      action: '寄送邀請信後，等待回答入會問題並由管理員批准。',
    }
    updateState({
      localMembers: [member, ...state.localMembers],
      localModeration: [review, ...state.localModeration],
    })
  }

  const visibleContent = runtimePreset.content.filter((item) => {
    if (!query.trim()) return true
    const haystack = `${item.title} ${item.category} ${item.excerpt} ${item.type}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  })

  if (standalonePresetId === 'signal-brief') {
    return (
      <SignalBriefStandalone
        preset={runtimePreset}
        state={state}
        role={state.role}
        selectedPlan={selectedPlan}
        hasPaidAccess={hasPaidAccess}
        authEmail={authEmail}
        authChecking={authChecking}
        query={query}
        visibleContent={visibleContent}
        onQuery={setQuery}
        onCredentialsLogin={handleCredentialsLogin}
        onLogout={handleLogout}
        onCheckout={handleCheckout}
        onUpdatePreset={handleUpdatePreset}
        onCreateContent={handleCreateContent}
      />
    )
  }

  return (
    <main className="app-shell" style={{ ['--brand-primary' as string]: runtimePreset.brand.primary, ['--brand-accent' as string]: runtimePreset.brand.accent }}>
      <aside className="sidebar">
        <button className="brand-button" onClick={() => setView('home')} aria-label="Open home">
          <span className="brand-mark">{brandMark(runtimePreset)}</span>
          <span>
            <strong>{runtimePreset.brand.creatorName}</strong>
            <small>{siteEyebrow(runtimePreset)}</small>
          </span>
        </button>

        <nav className="nav-list" aria-label="Main navigation">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}>
                <Icon size={18} />
                <span>{navLabel(item, runtimePreset)}</span>
              </button>
            )
          })}
        </nav>

        {formalSkillsAuth ? (
          <div className="sidebar-panel account-panel">
            <span className="eyebrow">測試帳號</span>
            <strong>{authEmail ?? '尚未登入'}</strong>
            <small>{authChecking ? '正在確認登入狀態' : `${roleLabel(state.role)}視角`}</small>
          </div>
        ) : (
          <div className="sidebar-panel">
            <span className="eyebrow">目前身份</span>
            <div className="segmented">
              {(['visitor', 'member', 'admin'] as Role[]).map((role) => (
                <button key={role} className={state.role === role ? 'selected' : ''} onClick={() => handleRoleChange(role)}>
                  {roleLabel(role)}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{siteEyebrow(runtimePreset)}</p>
            <h1>{runtimePreset.brand.productName}</h1>
          </div>
          <div className="topbar-actions">
            {!standalonePresetId && (
              <>
                <label className="select-label">
                  類型
                  <Select value={state.presetId} onValueChange={(value) => handlePresetChange(value as PresetId)}>
                    <SelectTrigger className="preset-select-trigger">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {presets.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {presetLabel(item.id)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </label>
                <Button variant="outline" className="ghost-button" onClick={() => updateState(resetState())}>重置狀態</Button>
              </>
            )}
            {state.role === 'visitor' ? (
              <Button className="primary-button" onClick={() => setView('login')}><LogIn data-icon="inline-start" />登入</Button>
            ) : (
              <Button variant="outline" className="ghost-button" onClick={handleLogout}>登出</Button>
            )}
          </div>
        </header>

        <RoleStateBanner preset={runtimePreset} role={state.role} selectedPlan={selectedPlan} />

        {view === 'home' && (
          isPublicationPreset(runtimePreset) ? (
            <BlogView
              preset={runtimePreset}
              hasPaidAccess={hasPaidAccess}
              onJoin={() => setView('join')}
              publicationHome
            />
          ) : (
            <HomeView
              preset={runtimePreset}
              role={state.role}
              selectedPlan={selectedPlan}
              onOpenBlog={() => setView('blog')}
              onOpenJoin={() => setView('join')}
            />
          )
        )}
        {view === 'blog' && (
          <BlogView
            preset={runtimePreset}
            hasPaidAccess={hasPaidAccess}
            onJoin={() => setView('join')}
          />
        )}
        {view === 'join' && (
          <JoinView
            preset={runtimePreset}
            role={state.role}
            selectedPlan={selectedPlan}
            onCheckout={handleCheckout}
          />
        )}
        {view === 'content' && (
          <ContentView
            preset={runtimePreset}
            items={visibleContent}
            query={query}
            onQuery={setQuery}
            hasPaidAccess={hasPaidAccess}
            canCreateContent={state.role === 'admin'}
            onCreateContent={handleCreateContent}
            onCheckout={() => handleCheckout(runtimePreset.plans.find((plan) => plan.highlighted) ?? runtimePreset.plans[1])}
          />
        )}
        {view === 'newsletter' && <NewsletterView preset={runtimePreset} onAddIssue={handleAddNewsletterIssue} onCreateReferral={handleCreateReferralCampaign} />}
        {view === 'courses' && (
          <CoursesView
            preset={runtimePreset}
            level={activeLevel}
            role={state.role}
            completedLessons={state.completedLessons}
            onToggleLesson={(lessonId) =>
              updateState({
                completedLessons: state.completedLessons.includes(lessonId)
                  ? state.completedLessons.filter((id) => id !== lessonId)
                  : [...state.completedLessons, lessonId],
              })
            }
          />
        )}
        {view === 'community' && <CommunityView preset={runtimePreset} role={state.role} />}
        {view === 'members' && <MembersView preset={runtimePreset} role={state.role} onInviteMember={handleInviteMember} onOpenMembershipQuestions={() => setView('admin')} />}
        {view === 'search' && <SearchView preset={runtimePreset} query={globalQuery} onQuery={setGlobalQuery} />}
        {view === 'challenges' && (
          <ChallengesView
            preset={runtimePreset}
            role={state.role}
            checkedInChallenges={state.checkedInChallenges}
            onCheckIn={(challengeId) =>
              updateState({
                checkedInChallenges: state.checkedInChallenges.includes(challengeId)
                  ? state.checkedInChallenges
                  : [...state.checkedInChallenges, challengeId],
              })
            }
          />
        )}
        {view === 'events' && <EventsView preset={runtimePreset} />}
        {view === 'login' && (
          <LoginView
            preset={runtimePreset}
            onLogin={handleLogin}
            formalAuth={formalSkillsAuth}
            onCredentialsLogin={handleCredentialsLogin}
          />
        )}
        {view === 'member' && <MemberView preset={runtimePreset} state={state} selectedPlan={selectedPlan} />}
        {view === 'admin' && <AdminView preset={runtimePreset} state={state} onUpdatePreset={handleUpdatePreset} />}
        {view === 'setup' && <SetupView presetId={state.presetId} onSelectPreset={handlePresetChange} />}
      </section>
    </main>
  )
}

type SignalScreen = 'home' | 'post' | 'subscribe' | 'login' | 'account' | 'admin'

function SignalBriefStandalone({
  preset,
  state,
  role,
  selectedPlan,
  hasPaidAccess,
  authEmail,
  authChecking,
  query,
  visibleContent,
  onQuery,
  onCredentialsLogin,
  onLogout,
  onCheckout,
  onUpdatePreset,
  onCreateContent,
}: {
  preset: VerticalPreset
  state: AppState
  role: Role
  selectedPlan: Plan
  hasPaidAccess: boolean
  authEmail: string | null
  authChecking: boolean
  query: string
  visibleContent: ContentItem[]
  onQuery: (value: string) => void
  onCredentialsLogin: (email: string, password: string) => Promise<AuthResult>
  onLogout: () => Promise<void>
  onCheckout: (plan: Plan) => void
  onUpdatePreset: (patch: Partial<VerticalPreset>) => void
  onCreateContent: (item: Omit<ContentItem, 'id' | 'source' | 'minutes'>) => void
}) {
  const [screen, setScreen] = useState<SignalScreen>('home')
  const [selectedPostId, setSelectedPostId] = useState<string>(preset.content[0]?.id ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [subscribedEmail, setSubscribedEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const publicPosts = preset.content.filter((item) => !item.isPaid)
  const paidPosts = preset.content.filter((item) => item.isPaid)
  const featurePost = publicPosts[0] ?? preset.content[0]
  const selectedPost = preset.content.find((item) => item.id === selectedPostId) ?? featurePost
  const paidPlan = preset.plans.find((plan) => plan.highlighted) ?? preset.plans[1] ?? preset.plans[0]
  const paidReaderCount = Math.max(0, Math.round((preset.metrics.activeMembers * Number.parseFloat(preset.metrics.conversion)) / 100))
  const freeReaderCount = Math.max(0, preset.metrics.activeMembers - paidReaderCount)

  const openPost = (postId: string) => {
    setSelectedPostId(postId)
    setScreen('post')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginError('')
    setIsSubmitting(true)
    const result = await onCredentialsLogin(email, password)
    setIsSubmitting(false)
    if (!result.ok) {
      setLoginError(result.error ?? '登入失敗，請稍後再試。')
      return
    }
    setScreen('admin')
  }

  const submitSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nextEmail = String(form.get('email') ?? '').trim()
    if (nextEmail) setSubscribedEmail(nextEmail)
  }

  const handleLogout = async () => {
    await onLogout()
    setScreen('home')
  }

  return (
    <main className="signal-site">
      <header className="signal-header">
        <button className="signal-brand" type="button" onClick={() => setScreen('home')} aria-label="Signal Brief home">
          <span>SB</span>
          <strong>Signal Brief</strong>
        </button>
        <nav aria-label="Signal Brief navigation">
          <button type="button" className={screen === 'home' ? 'active' : ''} onClick={() => setScreen('home')}>文章</button>
          <button type="button" className={screen === 'subscribe' ? 'active' : ''} onClick={() => setScreen('subscribe')}>訂閱</button>
          {role === 'admin' && <button type="button" className={screen === 'admin' ? 'active' : ''} onClick={() => setScreen('admin')}>出版後台</button>}
          {role === 'visitor' ? (
            <button type="button" className="signal-login-link" onClick={() => setScreen('login')}>登入</button>
          ) : (
            <button type="button" className="signal-login-link" onClick={() => setScreen('account')}>{authEmail ?? roleLabel(role)}</button>
          )}
        </nav>
      </header>

      {screen === 'home' && (
        <div className="signal-page">
          <section className="signal-hero">
            <div className="signal-hero-copy">
              <span className="signal-kicker">Independent brief on AI products</span>
              <h1>{preset.copy.heroTitle}</h1>
              <p>{preset.copy.heroBody}</p>
              <form className="signal-subscribe-form" onSubmit={submitSubscribe}>
                <Input name="email" type="email" placeholder="輸入 Email，收到每週摘要" required />
                <Button className="primary-button" type="submit"><Mail data-icon="inline-start" />訂閱免費信</Button>
              </form>
              {subscribedEmail && <small className="signal-form-note">已記錄 {subscribedEmail}，正式串接後會加入 Newsletter 名單。</small>}
            </div>
            <aside className="signal-author-card" aria-label="關於創作者">
              <div className="signal-author-profile">
                <div className="signal-author-mark signal-author-avatar">SB</div>
                <div>
                  <span className="signal-author-label">關於創作者</span>
                  <strong>{preset.brand.creatorName}</strong>
                </div>
              </div>
              <p>每週整理 AI 工具、內容產品與創作者商業模式的變化，保留公開文章，也提供付費深度分析。</p>
              <div className="signal-author-stats">
                <span><strong>{freeReaderCount}</strong> 免費讀者</span>
                <span><strong>{paidReaderCount}</strong> 付費讀者</span>
              </div>
            </aside>
          </section>

          <section className="signal-feature">
            <button type="button" className="signal-feature-post" onClick={() => featurePost && openPost(featurePost.id)}>
              <span className="signal-kicker">Featured</span>
              <h2>{featurePost ? cleanPostTitle(featurePost.title) : '最新公開文章'}</h2>
              <p>{featurePost?.excerpt}</p>
              <small>{featurePost && postMeta(featurePost, preset)}</small>
            </button>
            <div className="signal-paid-panel">
              <span className="signal-kicker">For subscribers</span>
              <h3>付費牆不是整篇鎖住，而是由作者指定段落位置。</h3>
              <p>你可以先讀公開段落；到了付費牆後，再決定是否訂閱完整研究與資料補充。</p>
              <Button className="primary-button" onClick={() => setScreen('subscribe')}>查看訂閱方案</Button>
            </div>
          </section>

          <section className="signal-feed-layout">
            <div className="signal-feed-main">
              <div className="signal-section-head">
                <div>
                  <span className="signal-kicker">Latest writing</span>
                  <h2>最新文章</h2>
                </div>
                <label className="signal-search">
                  <Search size={16} />
                  <Input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="搜尋文章" />
                </label>
              </div>
              <div className="signal-post-list">
                {visibleContent.map((item) => (
                  <button key={item.id} type="button" className="signal-post-row" onClick={() => openPost(item.id)}>
                    <span>
                      <small>{isLimitedFreeActive(item) ? '限時免費公開' : item.isPaid ? '付費文章' : item.category} · {item.minutes} 分鐘閱讀</small>
                      <strong>{cleanPostTitle(item.title)}</strong>
                      <p>{item.excerpt}</p>
                    </span>
                    {requiresPaidAccess(item) ? <Lock size={18} /> : <ChevronRight size={18} />}
                  </button>
                ))}
              </div>
            </div>
            <aside className="signal-sidebar">
              <article>
                <span className="signal-kicker">Start here</span>
                <h3>第一次閱讀 Signal Brief</h3>
                <p>先讀兩篇公開文章，了解這份信的判斷方式；需要完整拆解時再升級付費方案。</p>
              </article>
              <article>
                <span className="signal-kicker">Paid archive</span>
                <div className="signal-mini-list">
                  {paidPosts.slice(0, 3).map((item) => (
                    <button key={item.id} type="button" onClick={() => openPost(item.id)}>
                      <strong>{cleanPostTitle(item.title)}</strong>
                      <small>{isLimitedFreeActive(item) ? limitedFreeLabel(item) : `付費牆在第 ${paywallParagraph(item)} 段後`}</small>
                    </button>
                  ))}
                </div>
              </article>
            </aside>
          </section>
        </div>
      )}

      {screen === 'post' && selectedPost && (
        <SignalPostArticle
          item={selectedPost}
          preset={preset}
          hasPaidAccess={hasPaidAccess}
          onBack={() => setScreen('home')}
          onJoin={() => setScreen('subscribe')}
        />
      )}

      {screen === 'subscribe' && (
        <section className="signal-page signal-subscribe-page">
          <div className="signal-section-head wide">
            <div>
              <span className="signal-kicker">Subscribe</span>
              <h1>訂閱後閱讀完整研究與每週 Newsletter</h1>
              <p>免費讀者可以閱讀公開文章；付費讀者可以解鎖付費牆後內容、資料補充與完整電子報。</p>
            </div>
          </div>
          <div className="signal-plan-grid">
            {preset.plans.map((plan) => (
              <article key={plan.id} className={plan.highlighted ? 'signal-plan-card highlighted' : 'signal-plan-card'}>
                <span>{plan.name}</span>
                <strong>{plan.price}</strong>
                <small>{plan.cadence}</small>
                <p>{plan.description}</p>
                <ul>
                  {plan.features.map((feature) => <li key={feature}><CheckCircle2 size={16} />{feature}</li>)}
                </ul>
                <Button className={plan.highlighted ? 'primary-button' : 'ghost-button'} onClick={() => onCheckout(plan)}>
                  {plan.id === selectedPlan.id && role !== 'visitor' ? '目前方案' : plan.id === 'free' ? '加入免費讀者' : '選擇此方案'}
                </Button>
              </article>
            ))}
          </div>
        </section>
      )}

      {screen === 'login' && (
        <section className="signal-auth-page">
          <form className="signal-auth-card" onSubmit={submitLogin}>
            <span className="signal-kicker">Publisher login</span>
            <h1>登入 Signal Brief</h1>
            <p>登入後可以測試付費文章完整閱讀、Newsletter 管理、付費牆設定與出版者後台。</p>
            <label>
              Email
              <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="輸入你的 Email" required />
            </label>
            <label>
              密碼
              <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="輸入測試密碼" required />
            </label>
            {loginError && <p className="auth-error" role="alert">{loginError}</p>}
            <Button className="primary-button" type="submit" disabled={isSubmitting}>
              <LogIn data-icon="inline-start" />{isSubmitting ? '登入中' : '登入正式測試站'}
            </Button>
          </form>
        </section>
      )}

      {screen === 'account' && (
        <section className="signal-page signal-account-page">
          <div className="signal-account-card">
            <span className="signal-kicker">Account</span>
            <h1>{authChecking ? '確認登入狀態中' : authEmail ?? '尚未登入'}</h1>
            <p>目前是 {roleLabel(role)} 視角，方案為 {selectedPlan.name}。</p>
            <div className="button-row">
              {role === 'admin' && <Button className="primary-button" onClick={() => setScreen('admin')}>進入出版後台</Button>}
              <Button variant="outline" className="ghost-button" onClick={handleLogout}>登出</Button>
            </div>
          </div>
        </section>
      )}

      {screen === 'admin' && role === 'admin' && (
        <section className="signal-admin-page">
          <div className="signal-section-head wide">
            <div>
              <span className="signal-kicker">Publisher studio</span>
              <h1>Signal Brief 出版後台</h1>
              <p>管理文章、付費牆、訂閱方案、Newsletter、讀者與付款狀態。</p>
            </div>
          </div>
          <AdminView preset={preset} state={state} onUpdatePreset={onUpdatePreset} />
          <ContentView
            preset={preset}
            items={visibleContent}
            query={query}
            onQuery={onQuery}
            hasPaidAccess={hasPaidAccess}
            canCreateContent
            onCreateContent={onCreateContent}
            onCheckout={() => onCheckout(paidPlan)}
          />
        </section>
      )}
    </main>
  )
}

function SignalPostArticle({
  item,
  preset,
  hasPaidAccess,
  onBack,
  onJoin,
}: {
  item: ContentItem
  preset: VerticalPreset
  hasPaidAccess: boolean
  onBack: () => void
  onJoin: () => void
}) {
  const paragraphs = contentParagraphs(item)
  const gateAfter = paywallParagraph(item)
  const locked = isContentLocked(item, hasPaidAccess)
  const visibleParagraphs = locked ? paragraphs.slice(0, gateAfter) : paragraphs

  return (
    <article className="signal-article-page">
      <button type="button" className="signal-back-button" onClick={onBack}>回到文章列表</button>
      <header className="signal-article-header">
        <span className="signal-kicker">{isLimitedFreeActive(item) ? 'Limited free' : item.isPaid ? 'Paid essay' : item.category}</span>
        <h1>{cleanPostTitle(item.title)}</h1>
        <p>{item.excerpt}</p>
        <small>
          {postMeta(item, preset)}
          {isLimitedFreeActive(item) ? ` · ${limitedFreeLabel(item)}` : requiresPaidAccess(item) ? ` · 付費牆在第 ${gateAfter} 段後` : ''}
        </small>
      </header>
      <div className="signal-article-body">
        {visibleParagraphs.map((paragraph, index) => (
          <p key={`${item.id}-signal-paragraph-${index}`}>{paragraph}</p>
        ))}
      </div>
      {locked ? (
        <div className="signal-paywall">
          <span><Lock size={18} /></span>
          <div>
            <strong>付費牆已啟用</strong>
            <p>作者把這篇文章設定在第 {gateAfter} 段後進入付費牆。訂閱後可繼續閱讀完整分析與資料補充。</p>
          </div>
          <Button className="primary-button" onClick={onJoin}>訂閱後繼續閱讀</Button>
        </div>
      ) : null}
    </article>
  )
}

function HomeView({
  preset,
  role,
  selectedPlan,
  onOpenBlog,
  onOpenJoin,
}: {
  preset: ReturnType<typeof getPreset>
  role: Role
  selectedPlan: Plan
  onOpenBlog: () => void
  onOpenJoin: () => void
}) {
  const publicContent = preset.content.filter((item) => !item.isPaid).slice(0, 2)
  const paidContent = preset.content.filter((item) => item.isPaid).slice(0, 2)
  const firstCourse = preset.courses[0]

  return (
    <div className="view-stack">
      <section className="hero-band">
        <div className="hero-copy">
          <span className="eyebrow">{preset.tagline}</span>
          <h2>{preset.copy.heroTitle}</h2>
          <p>{preset.copy.heroBody}</p>
          <div className="button-row">
            <Button className="primary-button" onClick={onOpenJoin}>
              <CircleDollarSign data-icon="inline-start" />
              {preset.copy.ctaPrimary}
            </Button>
            <Button variant="outline" className="secondary-button" onClick={onOpenBlog}>
              <BookOpen data-icon="inline-start" />
              {preset.copy.ctaSecondary}
            </Button>
          </div>
        </div>
        <div className="hero-product">
          <div className="mock-header">
            <span>{preset.brand.creatorName}</span>
            <strong>{roleLabel(role)}</strong>
          </div>
          <div className="mock-grid">
            {homeMetrics(preset, selectedPlan).map((metric) => (
              <MetricTile key={metric.label} label={metric.label} value={metric.value} icon={metric.icon} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <span className="eyebrow">{beforeJoinEyebrow(preset)}</span>
          <h3>{beforeJoinHeading(preset)}</h3>
        </div>
        <div className="plan-grid">
          <article className="plan-card">
            <span className="plan-name">{isPublicationPreset(preset) ? '公開文章' : '公開內容'}</span>
            <strong>{publicContent.length}</strong>
            <small>可直接閱讀</small>
            <p>{publicContent.map((item) => item.title.replace(/^公開文章：/, '')).join('、')}</p>
            <Button variant="outline" onClick={onOpenBlog}>閱讀公開文章</Button>
          </article>
          <article className="plan-card highlighted">
            <span className="plan-name">{isPublicationPreset(preset) ? '付費文章' : '會員內容'}</span>
            <strong>{paidContent.length}</strong>
            <small>加入後解鎖</small>
            <p>{paidContent.map((item) => item.category).join('、')}，適合想持續深入{isPublicationPreset(preset) ? '閱讀與追蹤的人。' : '學習或追蹤的人。'}</p>
            <Button onClick={onOpenJoin}>{isPublicationPreset(preset) ? '查看訂閱方案' : '查看會員方案'}</Button>
          </article>
          <article className="plan-card">
            <span className="plan-name">{isPublicationPreset(preset) ? 'Newsletter' : '課程與社群'}</span>
            <strong>{isPublicationPreset(preset) ? preset.newsletter.length : `${firstCourse?.progress ?? 0}%`}</strong>
            <small>{isPublicationPreset(preset) ? '封已排程或寄出' : '持續更新'}</small>
            <p>{isPublicationPreset(preset) ? '訂閱後可收到完整文章、資料補充與每週研究信。' : firstCourse?.description ?? preset.audience}</p>
            <Button variant="outline" onClick={isPublicationPreset(preset) ? onOpenBlog : onOpenJoin}>{isPublicationPreset(preset) ? '先閱讀文章' : '加入後開始使用'}</Button>
          </article>
        </div>
      </section>
    </div>
  )
}

function RoleStateBanner({
  preset,
  role,
  selectedPlan,
}: {
  preset: ReturnType<typeof getPreset>
  role: Role
  selectedPlan: Plan
}) {
  const profile = roleProfile(preset, role)
  return (
    <section className={`role-state-banner role-${role}`}>
      <div>
        <span className="eyebrow">{profile.label}</span>
        <h3>{profile.title}</h3>
        <p>{profile.description}</p>
      </div>
      <div className="role-state-details">
        <StatusPill tone={role === 'admin' ? 'blue' : role === 'member' ? 'green' : 'yellow'}>{roleLabel(role)}</StatusPill>
        <small>{role === 'visitor' ? '目前方案：免費預覽' : `目前方案：${selectedPlan.name}`}</small>
        <ul>
          {profile.points.map((point) => (
            <li key={point}><CheckCircle2 size={14} />{point}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function BlogView({
  preset,
  hasPaidAccess,
  onJoin,
  publicationHome = false,
}: {
  preset: ReturnType<typeof getPreset>
  hasPaidAccess: boolean
  onJoin: () => void
  publicationHome?: boolean
}) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const selectedPost = preset.content.find((item) => item.id === selectedPostId)
  const publicPosts = preset.content.filter((item) => !item.isPaid)
  const memberPosts = preset.content.filter((item) => item.isPaid)
  const featurePost = publicPosts[0] ?? preset.content[0]

  if (selectedPost && isPublicationPreset(preset)) {
    return (
      <ArticleReader
        item={selectedPost}
        preset={preset}
        hasPaidAccess={hasPaidAccess}
        onBack={() => setSelectedPostId(null)}
        onJoin={onJoin}
      />
    )
  }

  if (isPublicationPreset(preset)) {
    const feedPosts = preset.content.filter((item) => item.id !== featurePost?.id)
    return (
      <section className="publication-page">
        <header className="publication-masthead">
          <div className="publication-logo-mark">SB</div>
          <h2>Signal Brief</h2>
          <p>{preset.copy.heroBody}</p>
          <small>By {preset.brand.creatorName}</small>
          <div className="publication-subscribe-inline">
            <Input aria-label="訂閱 Email" type="email" placeholder="輸入你的 Email" />
            <Button className="primary-button" onClick={onJoin}>訂閱</Button>
          </div>
        </header>

        <nav className="publication-tabs" aria-label="Signal Brief sections">
          <button className="active" type="button">首頁</button>
          <button type="button">公開文章</button>
          <button type="button">付費文章</button>
          <button type="button">Archive</button>
          <button type="button">About</button>
        </nav>

        {featurePost && (
          <button className="publication-feature-card article-card-button" type="button" aria-label={featurePost.title} onClick={() => setSelectedPostId(featurePost.id)}>
            <span className="publication-cover publication-cover-large">
              <span>AI WORK SIGNALS</span>
            </span>
            <span className="publication-feature-copy">
              <Badge variant="outline" className="pill">{featurePost.category}</Badge>
              <strong>{cleanPostTitle(featurePost.title)}</strong>
              <span>{featurePost.excerpt}</span>
              <small>{postMeta(featurePost, preset)}</small>
            </span>
          </button>
        )}

        <div className="publication-body-grid">
          <div className="publication-feed">
            <div className="publication-feed-head">
              <h3>最新文章</h3>
              <button type="button">View all</button>
            </div>
            <div className="publication-card-grid">
              {feedPosts.slice(0, 3).map((item, index) => (
                <button key={item.id} type="button" className="publication-post-card article-card-button" aria-label={item.title} onClick={() => setSelectedPostId(item.id)}>
                  <span className={`publication-cover publication-cover-${index + 1}`}>
                    <span>{item.isPaid ? 'PAID BRIEF' : 'OPEN NOTE'}</span>
                  </span>
                  <Badge variant="outline" className="pill">{item.isPaid ? '付費文章' : item.category}</Badge>
                  <strong>{cleanPostTitle(item.title)}</strong>
                  <span>{item.excerpt}</span>
                  <small>{postMeta(item, preset)}{item.isPaid ? ` · 付費牆在第 ${paywallParagraph(item)} 段後` : ''}</small>
                </button>
              ))}
            </div>

            <div className="publication-feed-head compact">
              <h3>付費讀者專欄</h3>
              <button type="button" onClick={onJoin}>訂閱完整研究</button>
            </div>
            <div className="publication-paid-list">
              {memberPosts.slice(1).map((item) => (
                <button key={item.id} type="button" className="publication-paid-row article-card-button" aria-label={item.title} onClick={() => setSelectedPostId(item.id)}>
                  <span>
                    <Badge variant="outline" className="pill">付費文章</Badge>
                    <strong>{cleanPostTitle(item.title)}</strong>
                    <small>{item.minutes} 分鐘閱讀 · 付費牆在第 {paywallParagraph(item)} 段後</small>
                  </span>
                  {hasPaidAccess ? <span className="access-ok"><CheckCircle2 size={16} />可閱讀</span> : <span className="lock-button lock-label"><Lock data-icon="inline-start" />訂閱後閱讀</span>}
                </button>
              ))}
            </div>
          </div>

          <aside className="publication-sidebar">
            <article className="publication-sidebar-card">
              <div className="publication-logo-mark small">SB</div>
              <h3>Signal Brief</h3>
              <p>每週整理 AI 工具、內容產品與創作者商業模式的可追蹤變化。</p>
              <div className="publication-subscribe-inline stacked">
                <Input aria-label="側欄訂閱 Email" type="email" placeholder="輸入你的 Email" />
                <Button className="primary-button" onClick={onJoin}>訂閱</Button>
              </div>
            </article>
            <article className="publication-sidebar-card">
              <h3>訂閱後可以閱讀</h3>
              <ul className="check-list">
                <li><CheckCircle2 size={16} />付費牆後的完整分析</li>
                <li><CheckCircle2 size={16} />每週研究信與資料補充</li>
                <li><CheckCircle2 size={16} />文章留言與讀者問答</li>
              </ul>
            </article>
          </aside>
        </div>
      </section>
    )
  }

  return (
    <section className={publicationHome ? 'section-block publication-home' : 'section-block'}>
      <div className="section-heading horizontal">
        <div>
          <span className="eyebrow">{preset.id === 'signal-brief' ? '公開閱讀' : '社群預覽'}</span>
          <h3>{preset.id === 'signal-brief' ? 'Signal Brief 公開部落格' : 'Skills School 社群預覽頁'}</h3>
          {publicationHome && <p>閱讀公開文章，或訂閱後解鎖完整研究、資料補充與每週 Newsletter。</p>}
        </div>
        <Button className="primary-button" onClick={onJoin}><CircleDollarSign data-icon="inline-start" />{preset.id === 'signal-brief' ? '訂閱完整研究' : '加入會員'}</Button>
      </div>

      <button className="hero-product blog-feature article-card-button" type="button" onClick={() => isPublicationPreset(preset) && featurePost && setSelectedPostId(featurePost.id)}>
        <Badge variant="outline" className="pill">{featurePost.category}</Badge>
        <h4>{featurePost.title}</h4>
        <p>{featurePost.excerpt}</p>
        <small>{featurePost.minutes} 分鐘閱讀 · {preset.brand.creatorName}</small>
      </button>

      <div className="content-list blog-list">
        {publicPosts.map((item) => (
          <button key={item.id} type="button" className="content-row article-card-button" onClick={() => isPublicationPreset(preset) && setSelectedPostId(item.id)}>
            <div>
              <Badge variant="outline" className="pill">{contentTypeLabel(item.type)}</Badge>
              <h4>{item.title}</h4>
              <p>{item.excerpt}</p>
              <small>{item.category} · {item.minutes} 分鐘 · {sourceLabel(item.source)}</small>
            </div>
            <span className="access-ok"><CheckCircle2 size={16} />可閱讀</span>
          </button>
        ))}
        {memberPosts.slice(0, 3).map((item) => (
          <button key={item.id} type="button" className="content-row article-card-button" onClick={() => isPublicationPreset(preset) && setSelectedPostId(item.id)}>
            <div>
              <Badge variant="outline" className="pill">會員限定</Badge>
              <h4>{item.title}</h4>
              <p>{item.excerpt}</p>
              <small>{item.category} · {item.minutes} 分鐘 · 付費牆在第 {paywallParagraph(item)} 段後</small>
            </div>
            {hasPaidAccess ? <span className="access-ok"><CheckCircle2 size={16} />可閱讀</span> : <span className="lock-button lock-label"><Lock data-icon="inline-start" />{preset.id === 'signal-brief' ? '訂閱後閱讀' : '加入後閱讀'}</span>}
          </button>
        ))}
      </div>
    </section>
  )
}

function cleanPostTitle(title: string) {
  return title.replace(/^(公開文章|付費文章)：/, '')
}

function postMeta(item: ContentItem, preset: ReturnType<typeof getPreset>) {
  return `${preset.brand.creatorName} · ${item.minutes} 分鐘閱讀 · ${sourceLabel(item.source)}`
}

function ArticleReader({
  item,
  preset,
  hasPaidAccess,
  onBack,
  onJoin,
}: {
  item: ContentItem
  preset: ReturnType<typeof getPreset>
  hasPaidAccess: boolean
  onBack: () => void
  onJoin: () => void
}) {
  const paragraphs = contentParagraphs(item)
  const gateAfter = paywallParagraph(item)
  const locked = isContentLocked(item, hasPaidAccess)
  const visibleParagraphs = locked ? paragraphs.slice(0, gateAfter) : paragraphs

  return (
    <article className="section-block article-reader">
      <div className="article-reader-top">
        <Button variant="outline" className="ghost-button" onClick={onBack}>回到文章列表</Button>
        <Badge variant="outline" className="pill">{isLimitedFreeActive(item) ? '限時免費' : item.isPaid ? '付費文章' : '免費文章'}</Badge>
      </div>
      <header className="article-header">
        <span className="eyebrow">{item.category}</span>
        <h3>{item.title}</h3>
        <p>{item.excerpt}</p>
        <small>
          {preset.brand.creatorName} · {item.minutes} 分鐘閱讀 · {sourceLabel(item.source)}
          {isLimitedFreeActive(item) ? ` · ${limitedFreeLabel(item)}` : ''}
        </small>
      </header>
      <div className="article-body">
        {visibleParagraphs.map((paragraph, index) => (
          <p key={`${item.id}-paragraph-${index}`}>{paragraph}</p>
        ))}
      </div>
      {locked ? (
        <div className="paywall-box">
          <Lock size={18} />
          <div>
            <strong>付費牆已啟用</strong>
            <p>這篇文章由創作者設定在第 {gateAfter} 段後進入付費牆。訂閱後可以繼續閱讀完整內容、資料補充與每週 Newsletter。</p>
          </div>
          <Button className="primary-button" onClick={onJoin}><CircleDollarSign data-icon="inline-start" />訂閱後繼續閱讀</Button>
        </div>
      ) : null}
    </article>
  )
}

function JoinView({
  preset,
  role,
  selectedPlan,
  onCheckout,
}: {
  preset: ReturnType<typeof getPreset>
  role: Role
  selectedPlan: Plan
  onCheckout: (plan: Plan) => void
}) {
  const memberPlan = preset.plans.find((plan) => plan.highlighted) ?? preset.plans[1]
  const roleCopy = roleProfile(preset, role)

  return (
    <section className="section-block join-section">
      <div className="section-heading horizontal">
        <div>
          <span className="eyebrow">{preset.id === 'skills-school' ? '加入社群' : '訂閱研究'}</span>
          <h3>{preset.id === 'skills-school' ? '加入 Skills School，開始課程、社群與每週實作' : '訂閱 Signal Brief，閱讀付費文章與每週電子報'}</h3>
          <p>{roleCopy.label}：{roleCopy.description}</p>
        </div>
        <Button className="primary-button" onClick={() => onCheckout(memberPlan)}><CircleDollarSign data-icon="inline-start" />選擇 {memberPlan.name}</Button>
      </div>
      <div className="plan-grid">
        {preset.plans.map((plan) => (
          <article key={plan.id} className={`${plan.highlighted ? 'plan-card highlighted' : 'plan-card'} ${role !== 'visitor' && selectedPlan.id === plan.id ? 'current-plan' : ''}`}>
            <span className="plan-name">{plan.name}</span>
            <strong>{plan.price}</strong>
            <small>{plan.cadence}</small>
            <p>{plan.description}</p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}><CheckCircle2 size={16} />{feature}</li>
              ))}
            </ul>
            <Button variant={plan.highlighted ? 'default' : 'outline'} onClick={() => onCheckout(plan)}>
              {role !== 'visitor' && selectedPlan.id === plan.id
                ? '目前方案'
                : plan.price === 'NT$0'
                  ? (preset.id === 'signal-brief' ? '加入免費讀者' : '加入免費方案')
                  : role === 'admin'
                    ? '預覽此方案'
                    : '選擇此方案'}
            </Button>
          </article>
        ))}
      </div>
      <div className="self-service-grid join-proof">
        <article>
          <h4>{preset.id === 'skills-school' ? '加入後會看到什麼' : '訂閱後會收到什麼'}</h4>
          <ul className="check-list">
            {preset.id === 'skills-school' ? (
              <>
                <li><CheckCircle2 size={16} />完整課程與會員限定文章</li>
                <li><CheckCircle2 size={16} />每週任務、資源下載與直播回放</li>
                <li><CheckCircle2 size={16} />會員討論區、作品回饋與活動通知</li>
              </>
            ) : (
              <>
                <li><CheckCircle2 size={16} />完整研究專欄與會員資料庫</li>
                <li><CheckCircle2 size={16} />每週摘要、資料表更新與問答回放</li>
                <li><CheckCircle2 size={16} />讀者討論、專題直播與活動通知</li>
              </>
            )}
          </ul>
        </article>
        <article>
          <h4>{preset.id === 'signal-brief' ? '適合這樣的讀者' : '適合這樣的學員'}</h4>
          <p>{preset.audience}</p>
        </article>
      </div>
    </section>
  )
}

function ContentView({
  preset,
  items,
  query,
  onQuery,
  hasPaidAccess,
  canCreateContent,
  onCreateContent,
  onCheckout,
}: {
  preset: ReturnType<typeof getPreset>
  items: ContentItem[]
  query: string
  onQuery: (value: string) => void
  hasPaidAccess: boolean
  canCreateContent: boolean
  onCreateContent: (item: Omit<ContentItem, 'id' | 'source' | 'minutes'>) => void
  onCheckout: () => void
}) {
  const isPublication = isPublicationPreset(preset)
  const [draft, setDraft] = useState({
    title: '',
    type: 'article' as ContentItem['type'],
    category: '公開內容',
    excerpt: '',
    body: '',
    isPaid: false,
    paywallAfterParagraph: 1,
  })

  const canPublish = draft.title.trim() && draft.excerpt.trim() && draft.body.trim()

  const updateDraft = (patch: Partial<typeof draft>) => setDraft((prev) => ({ ...prev, ...patch }))

  const handlePublish = () => {
    if (!canPublish) return
    onCreateContent({
      title: draft.title.trim(),
      type: draft.type,
      category: draft.category.trim() || '未分類',
      excerpt: draft.excerpt.trim(),
      body: draft.body.trim(),
      isPaid: draft.isPaid,
      paywallAfterParagraph: draft.isPaid ? draft.paywallAfterParagraph : undefined,
    })
    setDraft({
      title: '',
      type: 'article',
      category: '公開內容',
      excerpt: '',
      body: '',
      isPaid: false,
      paywallAfterParagraph: 1,
    })
  }

  return (
    <section className="section-block">
      <div className="section-heading horizontal">
        <div>
          <span className="eyebrow">{isPublication ? '文章庫' : '內容庫'}</span>
          <h3>{isPublication ? '公開文章、付費文章與付費牆' : '公開文章、會員內容與付費牆'}</h3>
        </div>
        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <Input value={query} onChange={(event) => onQuery(event.target.value)} placeholder={isPublication ? '搜尋文章、主題、類型' : '搜尋內容、分類、類型'} />
        </label>
      </div>

      {canCreateContent && (
        <article className="editor-panel" aria-label="Content editor">
          <div className="editor-head">
            <div>
              <span className="eyebrow">發文管理</span>
              <h4>發文編輯器</h4>
            </div>
            <StatusPill tone={draft.isPaid ? 'blue' : 'green'}>{draft.isPaid ? '會員限定' : '公開'}</StatusPill>
          </div>
          <div className="editor-grid">
            <label>
              標題
              <Input value={draft.title} onChange={(event) => updateDraft({ title: event.target.value })} placeholder="輸入文章標題" />
            </label>
            <label>
              分類
              <Input value={draft.category} onChange={(event) => updateDraft({ category: event.target.value })} placeholder={isPublication ? '公開文章 / 付費文章 / 讀者信' : '公開內容 / 會員課 / 公告'} />
            </label>
            <label>
              類型
              <select className="editor-select" value={draft.type} onChange={(event) => updateDraft({ type: event.target.value as ContentItem['type'] })}>
                <option value="article">文章</option>
                <option value="podcast">音訊</option>
                <option value="newsletter">通訊</option>
                {!isPublication && <option value="video">影片</option>}
                {!isPublication && <option value="resource">資源</option>}
              </select>
            </label>
            <label className="editor-toggle">
              <input type="checkbox" checked={draft.isPaid} onChange={(event) => updateDraft({ isPaid: event.target.checked })} />
              {isPublication ? '付費訂閱 / 付費牆' : '會員限定 / 付費牆'}
            </label>
            {isPublication && draft.isPaid && (
              <label>
                付費牆段落
                <Input
                  type="number"
                  min={1}
                  value={draft.paywallAfterParagraph}
                  onChange={(event) => updateDraft({ paywallAfterParagraph: Math.max(1, Number(event.target.value) || 1) })}
                />
              </label>
            )}
          </div>
          <label className="editor-field">
            摘要
            <Input value={draft.excerpt} onChange={(event) => updateDraft({ excerpt: event.target.value })} placeholder="列表與分享時顯示的短摘要" />
          </label>
          <label className="editor-field">
            內文
            <Textarea value={draft.body} onChange={(event) => updateDraft({ body: event.target.value })} placeholder={isPublication ? '撰寫文章或電子報內容…' : '撰寫文章、課程公告或通訊內容…'} />
          </label>
          <div className="editor-actions">
            <small>{draft.body.length} 字 · 預估 {Math.max(3, Math.ceil(draft.body.length / 220))} 分鐘閱讀</small>
            <Button className="primary-button" type="button" disabled={!canPublish} onClick={handlePublish}><FileText data-icon="inline-start" />{isPublication ? '發布文章' : '發布到內容庫'}</Button>
          </div>
        </article>
      )}

      <div className="content-list">
        {items.map((item) => {
          const locked = item.isPaid && !hasPaidAccess
          return (
            <article key={item.id} className="content-row">
              <div>
              <Badge variant="outline" className="pill">{contentTypeLabel(item.type)}</Badge>
                <h4>{item.title}</h4>
                <p>{item.excerpt}</p>
                <small>{item.category} · {item.minutes} 分鐘 · {sourceLabel(item.source)}</small>
              </div>
              {locked ? (
                <Button className="lock-button" onClick={onCheckout}><Lock data-icon="inline-start" />升級解鎖</Button>
              ) : (
              <span className="access-ok"><CheckCircle2 size={16} />可閱讀</span>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function NewsletterView({
  preset,
  onAddIssue,
  onCreateReferral,
}: {
  preset: ReturnType<typeof getPreset>
  onAddIssue: () => void
  onCreateReferral: () => void
}) {
  const isPublication = isPublicationPreset(preset)
  return (
    <section className="section-block">
      <div className="section-heading horizontal">
        <div>
          <span className="eyebrow">通訊與成長</span>
          <h3>{isPublication ? 'Newsletter、付費轉換與推薦贈閱' : 'Email/LINE 通訊、付費轉換與推薦贈閱'}</h3>
        </div>
        <div className="button-row compact">
          <Button variant="outline" className="secondary-button" onClick={onAddIssue}><Mail data-icon="inline-start" />新增通訊</Button>
          <Button className="primary-button" onClick={onCreateReferral}><Gift data-icon="inline-start" />建立贈閱碼</Button>
        </div>
      </div>

      <div className="newsletter-grid">
        <article className="newsletter-panel span-2">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">{isPublication ? '文章電子報' : '課程通訊'}</span>
              <h4>{isPublication ? '把文章寄給訂閱讀者' : '把文章、課程或活動寄給會員'}</h4>
            </div>
            <Mail size={18} aria-hidden="true" />
          </div>
          <div className="newsletter-send-flow">
            <div>
              <span>1</span>
              <strong>選擇文章</strong>
              <small>{preset.content[0]?.title ?? '尚未建立文章'}</small>
            </div>
            <div>
              <span>2</span>
              <strong>選擇讀者</strong>
              <small>{isPublication ? '免費讀者、付費讀者或全部訂閱者' : '免費會員、付費會員或全部會員'}</small>
            </div>
            <div>
              <span>3</span>
              <strong>安排發送</strong>
              <small>立即寄出、排程發送或存成草稿</small>
            </div>
          </div>
          <div className="button-row compact">
            <Button variant="outline" className="secondary-button" onClick={onAddIssue}><FileText data-icon="inline-start" />建立文章電子報</Button>
            <Button className="primary-button" onClick={onCreateReferral}><Gift data-icon="inline-start" />建立訂閱贈閱碼</Button>
          </div>
        </article>

        <article className="newsletter-panel span-2">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">發送排程</span>
              <h4>發送排程與內容存檔</h4>
            </div>
            <Megaphone size={18} />
          </div>
          <div className="admin-content-stack">
            {preset.newsletter.map((issue) => (
              <div key={issue.id} className="newsletter-row">
                <span>
                  <Badge variant="outline" className="pill">{segmentLabel(issue.segment)} · {statusLabel(issue.status)}</Badge>
                  <strong>{issue.subject}</strong>
                  <small>{issue.sendAt === 'on signup' ? '註冊後自動寄送' : issue.sendAt} · 開信 {issue.openRate} · 點擊 {issue.clickRate}</small>
                </span>
                <StatusPill tone={issue.paidConversions > 0 ? 'green' : 'yellow'}>{`${issue.paidConversions} 人升級`}</StatusPill>
              </div>
            ))}
          </div>
        </article>

        <article className="newsletter-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">通知設定</span>
              <h4>{isPublication ? 'Email / 站內通知' : 'Email / LINE / 站內通知'}</h4>
            </div>
            <Bell size={18} />
          </div>
          <div className="admin-content-stack">
            {preset.notifications.map((notification) => (
              <div key={notification.id} className="admin-content-item">
                <Badge variant="outline" className="pill">{channelLabel(notification.channel)}</Badge>
                <strong>{notificationTriggerLabel(notification.trigger)}</strong>
                <small>{notificationAudienceLabel(notification.audience, isPublication)} · {statusLabel(notification.status)}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="newsletter-panel span-2">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">推薦成長</span>
              <h4>推薦碼、贈閱與來源歸因</h4>
            </div>
            <Hash size={18} />
          </div>
          <div className="referral-grid">
            {preset.referrals.map((campaign) => (
              <div key={campaign.id} className="referral-card">
                <Badge variant="outline" className="pill">{campaign.code}</Badge>
                <strong>{campaign.label}</strong>
                <small>{sourceLabel(campaign.source)} · {campaign.reward}</small>
                <div className="referral-metrics">
                  <span>{campaign.freeTrials} 人體驗</span>
                  <span>{campaign.paidConversions} 人升級</span>
                  <span>{campaign.revenueLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}

function LoginView({
  preset,
  onLogin,
  formalAuth = false,
  onCredentialsLogin,
}: {
  preset: ReturnType<typeof getPreset>
  onLogin: (role?: Role) => void
  formalAuth?: boolean
  onCredentialsLogin?: (email: string, password: string) => Promise<AuthResult>
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <section className="auth-layout">
      <article className="auth-card">
        <span className="eyebrow">會員登入</span>
        <h3>登入 {preset.brand.productName}</h3>
        <p>
          {formalAuth
            ? '這是正式測試入口。登入後可以進入會員區與管理後台，實際測試課程、社群、打卡與內容管理流程。'
            : preset.id === 'signal-brief'
              ? '登入後可以閱讀會員研究、下載資料表、參與讀者問答，並管理自己的訂閱狀態。'
              : '登入後可以繼續課程進度、參與討論區、完成每週打卡，並查看自己的會員方案。'}
        </p>
        <form
          className="auth-form"
          onSubmit={async (event) => {
            event.preventDefault()
            setError('')
            if (!formalAuth) {
              onLogin('member')
              return
            }
            if (!onCredentialsLogin) return
            setIsSubmitting(true)
            const result = await onCredentialsLogin(email, password)
            setIsSubmitting(false)
            if (!result.ok) setError(result.error ?? '登入失敗，請稍後再試。')
          }}
        >
          <label>
            Email
            <span className="auth-input">
              <Mail size={18} />
              <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="輸入你的 Email" required />
            </span>
          </label>
          {formalAuth && (
            <label>
              密碼
              <span className="auth-input">
                <Lock size={18} />
                <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="輸入測試密碼" required />
              </span>
            </label>
          )}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {formalAuth && <small className="auth-helper">帳密由伺服器驗證，測試密碼不會寫在前端或 GitHub。</small>}
          <Button className="primary-button" type="submit" disabled={isSubmitting}>
            <LogIn data-icon="inline-start" />{formalAuth ? (isSubmitting ? '登入中' : '登入正式測試站') : '以會員身份登入'}
          </Button>
        </form>
        {!formalAuth && (
          <div className="button-row">
            <Button variant="outline" className="secondary-button" onClick={() => onLogin('member')}>以 Google 帳號登入</Button>
            <Button variant="outline" className="ghost-button" onClick={() => onLogin('admin')}>管理員登入</Button>
          </div>
        )}
      </article>
      <article className="auth-notes">
        <h4>{preset.id === 'signal-brief' ? '登入後可以使用' : '登入後可以開始'}</h4>
        <ul className="check-list">
          {preset.id === 'signal-brief' ? (
            <>
              <li><CheckCircle2 size={16} />閱讀完整會員專欄與資料庫更新</li>
              <li><CheckCircle2 size={16} />查看每週摘要、問答回放與專題直播</li>
              <li><CheckCircle2 size={16} />管理訂閱方案、收據與贈閱碼</li>
            </>
          ) : (
            <>
              <li><CheckCircle2 size={16} />接續課程進度與下載學習資源</li>
              <li><CheckCircle2 size={16} />進入會員討論區並提交作品回饋</li>
              <li><CheckCircle2 size={16} />查看打卡、等級、活動與回放</li>
            </>
          )}
        </ul>
      </article>
    </section>
  )
}

function CoursesView({
  preset,
  level,
  role,
  completedLessons,
  onToggleLesson,
}: {
  preset: ReturnType<typeof getPreset>
  level: number
  role: Role
  completedLessons: string[]
  onToggleLesson: (lessonId: string) => void
}) {
  const canUseLessons = role !== 'visitor'
  return (
    <section className="section-block">
      <div className="section-heading">
        <span className="eyebrow">{preset.id === 'signal-brief' ? '研究室課程' : '課程教室'}</span>
        <h3>課程、進度與等級解鎖</h3>
        {role === 'visitor' && <p>訪客可以看課程架構，但需要加入會員後才能標記進度、下載會員資源與進入討論。</p>}
        {role === 'admin' && <p>管理員正在檢查課程內容、資源權限與學員進度。</p>}
      </div>
      <div className="course-grid">
        {preset.courses.map((course) => (
          <article key={course.id} className="course-panel">
            <div className="course-title">
              <div>
                <h4>{course.title}</h4>
                <p>{course.description}</p>
              </div>
              <strong>{course.progress}%</strong>
            </div>
            <div className="progress-track"><span style={{ width: `${course.progress}%` }} /></div>
            <div className="lesson-list">
              {course.lessons.map((lesson) => {
                const locked = lesson.lockedLevel != null && level < lesson.lockedLevel
                const complete = lesson.complete || completedLessons.includes(lesson.id)
                return (
                  <div key={lesson.id} className={complete ? 'lesson-card complete' : 'lesson-card'}>
                    <button className="lesson-row" disabled={locked || !canUseLessons} onClick={() => onToggleLesson(lesson.id)}>
                      {locked || !canUseLessons ? <Lock size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
                      <span>{lesson.title}</span>
                      <small>{!canUseLessons ? '會員限定' : locked ? `Level ${lesson.lockedLevel}` : `${lesson.minutes} 分鐘`}</small>
                    </button>
                    <div className="lesson-meta">
                      {lesson.transcript && <span><FileText size={14} aria-hidden="true" />逐字稿可搜尋</span>}
                      {lesson.pinnedThreadId && <span><MessageSquareText size={14} aria-hidden="true" />已連到課程討論</span>}
                    </div>
                    {lesson.resources && lesson.resources.length > 0 && (
                      <div className="resource-list">
                        {lesson.resources.map((resource) => (
                          <Badge key={resource.id} variant="outline" className="pill">{resourceKindLabel(resource.kind)} · {accessLabel(resource.access)}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function CommunityView({ preset, role }: { preset: ReturnType<typeof getPreset>; role: Role }) {
  return (
    <section className="section-block">
      <div className="section-heading">
        <span className="eyebrow">{preset.id === 'signal-brief' ? '讀者討論' : '社群討論'}</span>
        <h3>分類、權限、公告、留言與反應</h3>
        {role === 'visitor' && <p>訪客只能看到公開討論與公告摘要；會員討論串會保留給已加入的人。</p>}
        {role === 'member' && <p>會員可以閱讀公開與會員討論，並依照權限參與課程討論或活動公告。</p>}
        {role === 'admin' && <p>管理員可以檢查置頂公告、發文權限、檢舉數與需要處理的討論串。</p>}
      </div>
      <div className="thread-list">
        {preset.threads.map((thread) => {
          const hidden = role === 'visitor' && (thread.adminOnly || thread.canStart === 'paid')
          return (
            <article key={thread.id} className={hidden ? 'thread-row locked' : 'thread-row'}>
              <div>
                <Badge variant="outline" className="pill">{thread.category}{thread.pinned ? ' · 置頂' : ''}</Badge>
                <h4>{hidden ? '會員限定討論串' : thread.title}</h4>
                <small>{thread.author} · {thread.replies} 則回覆 · {thread.reactions} 個反應 · 發文權限：{accessLabel(thread.canStart ?? 'all')}{thread.reportCount ? ` · ${thread.reportCount} 則檢舉` : ''}</small>
              </div>
              {hidden ? <Lock size={18} /> : <MessageSquareText size={18} />}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function MembersView({
  preset,
  role,
  onInviteMember,
  onOpenMembershipQuestions,
}: {
  preset: ReturnType<typeof getPreset>
  role: Role
  onInviteMember: () => void
  onOpenMembershipQuestions: () => void
}) {
  return (
    <section className="section-block">
      <div className="section-heading horizontal">
        <div>
          <span className="eyebrow">{preset.id === 'signal-brief' ? '讀者社群' : '學員社群'}</span>
          <h3>會員目錄、角色、個人頁與活躍度</h3>
          {role === 'member' && <p>會員可以看到社群成員與公開活躍度；Email、風險狀態與審核操作只會出現在管理員視角。</p>}
          {role === 'admin' && <p>管理員可以邀請會員、查看 Email、風險狀態、入會問題與社群參與紀錄。</p>}
        </div>
        {role === 'admin' && (
          <div className="button-row compact">
            <Button variant="outline" className="secondary-button" onClick={onInviteMember}><UserRound data-icon="inline-start" />邀請會員</Button>
            <Button variant="outline" className="ghost-button" onClick={onOpenMembershipQuestions}><ClipboardCheck data-icon="inline-start" />入會問題</Button>
          </div>
        )}
      </div>
      <div className="member-directory">
        {preset.members.map((member) => {
          const canSeeEmail = role === 'admin'
          const plan = preset.plans.find((item) => item.id === member.planId)
          return (
            <article key={member.id} className="member-card">
              <div className="member-avatar">{member.name.slice(0, 1)}</div>
              <div>
                <div className="member-card-head">
                  <strong>{member.name}</strong>
                  <StatusPill tone={member.risk === 'high' ? 'red' : member.risk === 'medium' ? 'yellow' : 'green'}>{riskLabel(member.risk)}</StatusPill>
                </div>
                <p>{member.bio}</p>
                <small>{canSeeEmail ? `${member.email} · ` : ''}{roleDisplayLabel(member.groupRole)} · {plan?.name ?? member.planId} · 加入日期 {member.joinedAt}</small>
                <div className="member-stats">
                  <span>Level {member.level}</span>
                  <span>{member.points} 分</span>
                  <span>{member.contributions.posts} 篇發文</span>
                  <span>{member.contributions.comments} 則留言</span>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function SearchView({
  preset,
  query,
  onQuery,
}: {
  preset: ReturnType<typeof getPreset>
  query: string
  onQuery: (value: string) => void
}) {
  const isPublication = isPublicationPreset(preset)
  const searchTerm = query.trim().toLowerCase()
  const results = useMemo(() => {
    const rows: Array<{ id: string; type: string; title: string; meta: string; text: string }> = []
    preset.content.forEach((item) => rows.push({ id: item.id, type: contentTypeLabel(item.type), title: item.title, meta: `${item.category} · ${sourceLabel(item.source)}`, text: `${item.title} ${item.category} ${item.excerpt} ${item.body}` }))
    preset.newsletter.forEach((issue) => rows.push({ id: issue.id, type: isPublication ? '電子報' : '通訊', title: issue.subject, meta: `${segmentLabel(issue.segment)} · ${statusLabel(issue.status)}`, text: `${issue.subject} ${issue.segment} ${issue.status}` }))
    preset.courses.forEach((course) => {
      rows.push({ id: course.id, type: '課程', title: course.title, meta: `完成度 ${course.progress}%`, text: `${course.title} ${course.description}` })
      course.lessons.forEach((lesson) => rows.push({ id: lesson.id, type: '單元', title: lesson.title, meta: `${course.title} · ${lesson.minutes} 分鐘`, text: `${lesson.title} ${lesson.transcript ?? ''} ${(lesson.resources ?? []).map((resource) => resource.title).join(' ')}` }))
    })
    preset.threads.forEach((thread) => rows.push({ id: thread.id, type: '討論', title: thread.title, meta: `${thread.category} · ${thread.replies} 則回覆`, text: `${thread.title} ${thread.category} ${thread.author}` }))
    preset.members.forEach((member) => rows.push({ id: member.id, type: isPublication ? '訂閱者' : '成員', title: member.name, meta: isPublication ? `${statusLabel(member.status)} · ${sourceLabel(member.source)}` : `${roleDisplayLabel(member.groupRole)} · Level ${member.level}`, text: `${member.name} ${member.bio} ${member.source} ${member.groupRole}` }))
    preset.events.forEach((event) => rows.push({ id: event.id, type: '活動', title: event.title, meta: `${eventKindLabel(event.kind)} · ${event.date}`, text: `${event.title} ${event.description} ${event.audience}` }))

    if (!searchTerm) return rows
    return rows.filter((row) => row.text.toLowerCase().includes(searchTerm))
  }, [isPublication, preset, searchTerm])

  return (
    <section className="section-block">
      <div className="section-heading horizontal">
        <div>
          <span className="eyebrow">站內搜尋</span>
          <h3>{isPublication ? '搜尋文章、Newsletter、讀者與訂閱資料' : '搜尋文章、課程、逐字稿、討論、活動與會員'}</h3>
        </div>
        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <Input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="輸入想搜尋的東西" />
        </label>
      </div>
      <div className="search-results">
        {results.map((result) => (
          <article key={`${result.type}-${result.id}`} className="search-result">
            <div className="search-result-main">
              <strong>{result.title}</strong>
              <small>{result.meta}</small>
            </div>
            <Badge variant="outline" className="pill search-result-type">{result.type}</Badge>
          </article>
        ))}
      </div>
    </section>
  )
}

function ChallengesView({
  preset,
  role,
  checkedInChallenges,
  onCheckIn,
}: {
  preset: ReturnType<typeof getPreset>
  role: Role
  checkedInChallenges: string[]
  onCheckIn: (challengeId: string) => void
}) {
  const canCheckIn = role !== 'visitor'
  return (
    <section className="section-block">
      <div className="section-heading">
        <span className="eyebrow">打卡挑戰</span>
        <h3>打卡挑戰、積分、等級與排行榜</h3>
        {role === 'visitor' && <p>訪客可以先看到挑戰節奏與排行榜；加入會員後才能完成打卡、累積積分與更新連續紀錄。</p>}
        {role === 'member' && <p>會員可以完成每日或每週打卡，累積積分並在排行榜中追蹤自己的進度。</p>}
        {role === 'admin' && <p>管理員可以檢查挑戰參與狀態、積分規則與排行榜呈現是否正常。</p>}
      </div>
      <div className="challenge-grid">
        {preset.challenges.map((challenge) => {
          const done = checkedInChallenges.includes(challenge.id)
          return (
            <article key={challenge.id} className="challenge-card">
              <Flame size={22} aria-hidden="true" />
              <h4>{challenge.title}</h4>
              <p>{challenge.cadence} · {challenge.participants} 位參與</p>
              <strong>連續 {challenge.streak} 次 · +{challenge.points} 分</strong>
              <button disabled={done || !canCheckIn} onClick={() => onCheckIn(challenge.id)}>
                {!canCheckIn ? '加入後打卡' : done ? '今日已打卡' : role === 'admin' ? '檢查打卡' : '完成打卡'}
              </button>
            </article>
          )
        })}
      </div>
      <div className="leaderboard">
        {preset.members
          .slice()
          .sort((a, b) => b.points - a.points)
          .map((member, index) => (
            <div key={member.id}>
              <span>#{index + 1}</span>
              <strong>{member.name}</strong>
              <small>Level {member.level} · {member.points} 分</small>
            </div>
          ))}
      </div>
    </section>
  )
}

function EventsView({ preset }: { preset: ReturnType<typeof getPreset> }) {
  return (
    <section className="section-block">
      <div className="section-heading">
        <span className="eyebrow">活動日曆</span>
        <h3>Webinar、Live、Office hour 與回放</h3>
      </div>
      <div className="event-grid">
        {preset.events.map((event) => (
          <article key={event.id} className="event-card">
            <Badge variant="outline" className="pill">{eventKindLabel(event.kind)} · {statusLabel(event.status)}</Badge>
            <h4>{event.title}</h4>
            <p>{event.description}</p>
            <small>{event.date} · 對象：{accessLabel(event.audience)} · 回放：{accessLabel(event.replayAccess)}</small>
          </article>
        ))}
      </div>
    </section>
  )
}

function MemberView({ preset, state, selectedPlan }: { preset: ReturnType<typeof getPreset>; state: AppState; selectedPlan: Plan }) {
  const lastEvent = state.paymentEvents[0]
  const isPublication = isPublicationPreset(preset)
  return (
    <section className="section-block">
      <div className="section-heading">
        <span className="eyebrow">{isPublication ? '我的訂閱' : '我的會員中心'}</span>
        <h3>{isPublication ? '訂閱方案、收據/發票與付款自助' : '會員方案、收據/發票狀態與付款自助'}</h3>
        <p>{isPublication ? '讀者可以在這裡確認目前訂閱、收據/發票、付款方式與推薦贈閱。' : '會員可以在這裡確認目前方案、收據/發票、付款方式與推薦贈閱。'}</p>
      </div>
      <div className="member-grid">
        <MetricTile label="目前方案" value={selectedPlan.name} icon={ShieldCheck} />
        <MetricTile label={isPublication ? '讀者狀態' : '會員狀態'} value={state.role === 'visitor' ? '訪客' : '有效'} icon={UserRound} />
        <MetricTile label="收據/發票" value={paymentValueLabel(lastEvent?.invoiceStatus)} icon={CircleDollarSign} />
        <MetricTile label="付款自助" value="可使用" icon={ChevronRight} />
      </div>
      <div className="self-service-grid">
        <article>
          <h4>付款與訂閱自助</h4>
          <ul className="check-list">
            <li><CircleDollarSign size={16} />更新付款方式、取消訂閱或恢復訂閱</li>
            <li><FileText size={16} />查看收據、發票與付款紀錄</li>
            <li><Bell size={16} />付款失敗時可發 Email、LINE、站內通知</li>
          </ul>
        </article>
        <article>
          <h4>我的推薦與贈閱</h4>
          <div className="referral-grid compact">
            {preset.referrals.slice(0, 2).map((campaign) => (
              <div key={campaign.id} className="referral-card">
                <Badge variant="outline" className="pill">{campaign.code}</Badge>
                <strong>{campaign.label}</strong>
                <small>{campaign.reward}</small>
              </div>
            ))}
          </div>
        </article>
      </div>
      <div className="empty-state">
        <strong>{lastEvent ? '最近一次付款紀錄' : '目前沒有付款紀錄'}</strong>
        <small>{lastEvent ? `${lastEvent.planId} · ${lastEvent.amountLabel} · ${paymentValueLabel(lastEvent.invoiceStatus)}` : '加入付費方案後，這裡會顯示付款、收據與發票狀態。'}</small>
      </div>
    </section>
  )
}

function AdminSettingsEditor({
  preset,
  onUpdatePreset,
  section = 'all',
}: {
  preset: VerticalPreset
  onUpdatePreset: (patch: Partial<VerticalPreset>) => void
  section?: 'all' | 'site' | 'content' | 'newsletter' | 'courses'
}) {
  const isPublication = isPublicationPreset(preset)
  const showSite = section === 'all' || section === 'site'
  const showContent = section === 'all' || section === 'content'
  const showNewsletter = section === 'all' || section === 'newsletter'
  const showCourses = section === 'all' || section === 'courses'
  const editorTitle = {
    all: isPublication ? '出版站可調整的內容' : 'Fork 後可調整的網站內容',
    site: isPublication ? '站點、品牌與訂閱方案' : '網站、品牌與會員方案',
    content: isPublication ? '文章、付費牆與限時免費' : '內容、權限與素材',
    newsletter: isPublication ? 'Newsletter 發送設定' : '通訊發送設定',
    courses: '課程標題與說明',
  }[section]
  const updateBrand = (key: keyof VerticalPreset['brand'], value: string) => {
    onUpdatePreset({ brand: { ...preset.brand, [key]: value } })
  }
  const updateCopy = (key: keyof VerticalPreset['copy'], value: string) => {
    onUpdatePreset({ copy: { ...preset.copy, [key]: value } })
  }
  const updatePlan = (planId: string, patch: Partial<Plan>) => {
    onUpdatePreset({ plans: updateById(preset.plans, planId, patch) })
  }
  const updateContent = (contentId: string, patch: Partial<ContentItem>) => {
    onUpdatePreset({ content: updateById(preset.content, contentId, patch) })
  }
  const updateNewsletter = (issueId: string, patch: Partial<NewsletterIssue>) => {
    onUpdatePreset({ newsletter: updateById(preset.newsletter, issueId, patch) })
  }
  const updateCourse = (courseId: string, patch: Partial<Course>) => {
    onUpdatePreset({ courses: updateById(preset.courses, courseId, patch) })
  }

  return (
    <article className={`admin-panel ${section === 'all' ? 'span-3' : 'span-2'} settings-editor`}>
      <div className="admin-panel-head">
        <div>
          <span className="eyebrow">基礎編輯</span>
          <h4>{editorTitle}</h4>
        </div>
        <StatusPill tone="green">可編輯</StatusPill>
      </div>

      {showSite && (
        <>
          <div className="settings-editor-grid">
            <label>
              網站名稱
              <Input name="productName" value={preset.brand.productName} onChange={(event) => updateBrand('productName', event.target.value)} autoComplete="off" />
            </label>
            <label>
              作者 / 品牌名稱
              <Input name="creatorName" value={preset.brand.creatorName} onChange={(event) => updateBrand('creatorName', event.target.value)} autoComplete="off" />
            </label>
            <label>
              首頁主標題
              <Input name="heroTitle" value={preset.copy.heroTitle} onChange={(event) => updateCopy('heroTitle', event.target.value)} autoComplete="off" />
            </label>
            <label>
              主要按鈕
              <Input name="ctaPrimary" value={preset.copy.ctaPrimary} onChange={(event) => updateCopy('ctaPrimary', event.target.value)} autoComplete="off" />
            </label>
            <label className="span-2">
              首頁介紹
              <Textarea name="heroBody" value={preset.copy.heroBody} onChange={(event) => updateCopy('heroBody', event.target.value)} autoComplete="off" />
            </label>
          </div>

          <div className="settings-editor-section">
            <div>
              <span className="eyebrow">方案設定</span>
              <h5>訂閱方案、價格與權益</h5>
            </div>
            <div className="settings-repeat-grid">
              {preset.plans.map((plan) => (
                <div key={plan.id} className="settings-card">
                  <label>
                    方案名稱
                    <Input name={`plan-${plan.id}-name`} value={plan.name} onChange={(event) => updatePlan(plan.id, { name: event.target.value })} autoComplete="off" />
                  </label>
                  <label>
                    價格
                    <Input name={`plan-${plan.id}-price`} value={plan.price} onChange={(event) => updatePlan(plan.id, { price: event.target.value })} autoComplete="off" />
                  </label>
                  <label>
                    說明
                    <Textarea name={`plan-${plan.id}-description`} value={plan.description} onChange={(event) => updatePlan(plan.id, { description: event.target.value })} autoComplete="off" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {showContent && (
        <div className="settings-editor-section">
          <div>
            <span className="eyebrow">文章與付費牆</span>
            <h5>{isPublication ? '公開文章、付費文章與付費牆' : '公開內容、會員內容與課程素材'}</h5>
          </div>
          <div className="settings-stack">
            {preset.content.slice(0, 4).map((item) => (
              <div key={item.id} className="settings-card compact">
                <div className="settings-card-head">
                  <StatusPill tone={item.isPaid ? 'blue' : 'green'}>{item.isPaid ? '付費訂閱' : '公開'}</StatusPill>
                  <label className="editor-toggle compact-toggle">
                    <input
                      type="checkbox"
                      checked={item.isPaid}
                      onChange={(event) => updateContent(item.id, {
                        isPaid: event.target.checked,
                        limitedFreeUntil: event.target.checked ? item.limitedFreeUntil : undefined,
                      })}
                    />
                    訂閱制
                  </label>
                </div>
                {isPublication && item.isPaid && (
                  <div className="settings-inline-grid">
                    <label>
                      付費牆段落位置
                      <Input
                        name={`content-${item.id}-paywall`}
                        type="number"
                        min={1}
                        value={paywallParagraph(item)}
                        onChange={(event) => updateContent(item.id, { paywallAfterParagraph: Math.max(1, Number(event.target.value) || 1) })}
                        autoComplete="off"
                      />
                    </label>
                    <label>
                      限時免費公開到
                      <Input
                        name={`content-${item.id}-limited-free`}
                        type="datetime-local"
                        value={datetimeLocalValue(item.limitedFreeUntil)}
                        onChange={(event) => updateContent(item.id, { limitedFreeUntil: event.target.value || undefined })}
                        autoComplete="off"
                      />
                    </label>
                    <small className="settings-helper span-2">
                      設定後，這篇付費文章會在期限前開放閱讀；時間過後會自動回到付費牆。
                    </small>
                  </div>
                )}
                <label>
                  標題
                  <Input name={`content-${item.id}-title`} value={item.title} onChange={(event) => updateContent(item.id, { title: event.target.value })} autoComplete="off" />
                </label>
                <label>
                  摘要
                  <Textarea name={`content-${item.id}-excerpt`} value={item.excerpt} onChange={(event) => updateContent(item.id, { excerpt: event.target.value })} autoComplete="off" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCourses && preset.courses.length > 0 && (
        <div className="settings-editor-section">
          <div>
            <span className="eyebrow">課程設定</span>
            <h5>課程標題與說明</h5>
          </div>
          <div className="settings-repeat-grid">
            {preset.courses.map((course) => (
              <div key={course.id} className="settings-card">
                <label>
                  課程名稱
                  <Input name={`course-${course.id}-title`} value={course.title} onChange={(event) => updateCourse(course.id, { title: event.target.value })} autoComplete="off" />
                </label>
                <label>
                  課程說明
                  <Textarea name={`course-${course.id}-description`} value={course.description} onChange={(event) => updateCourse(course.id, { description: event.target.value })} autoComplete="off" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {showNewsletter && (
        <div className="settings-editor-section">
          <div>
            <span className="eyebrow">電子報設定</span>
            <h5>{isPublication ? 'Newsletter 發送、分眾與歡迎信' : '文章電子報、分眾與發送時間'}</h5>
          </div>
          <div className="settings-stack">
            {preset.newsletter.map((issue) => (
              <div key={issue.id} className="settings-card compact">
                <div className="settings-card-head">
                  <StatusPill tone={issue.status === 'sent' ? 'green' : issue.status === 'scheduled' ? 'blue' : 'yellow'}>{statusLabel(issue.status)}</StatusPill>
                  <small>{segmentLabel(issue.segment)}</small>
                </div>
                <label>
                  主旨
                  <Input name={`newsletter-${issue.id}-subject`} value={issue.subject} onChange={(event) => updateNewsletter(issue.id, { subject: event.target.value })} autoComplete="off" />
                </label>
                <label>
                  發送時間
                  <Input name={`newsletter-${issue.id}-sendAt`} value={issue.sendAt} onChange={(event) => updateNewsletter(issue.id, { sendAt: event.target.value })} autoComplete="off" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

type PublicationAdminTabId = 'overview' | 'articles' | 'newsletter' | 'readers' | 'growth' | 'system' | 'settings'

const publicationAdminTabs: Array<{ id: PublicationAdminTabId; label: string; description: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: '總覽', description: '今日狀態與待處理事項', icon: LayoutDashboard },
  { id: 'articles', label: '文章與付費牆', description: '公開、付費、限時免費', icon: BookOpen },
  { id: 'newsletter', label: 'Newsletter', description: '發送、分眾與歡迎信', icon: Megaphone },
  { id: 'readers', label: '讀者', description: '免費與付費讀者狀態', icon: UsersRound },
  { id: 'growth', label: '成長', description: '推薦、贈閱與升級', icon: Gift },
  { id: 'system', label: '金流與系統', description: '付款、發票與整合狀態', icon: ShieldCheck },
  { id: 'settings', label: '設定', description: '品牌、首頁與方案', icon: Settings2 },
]

function PublicationAdminView({ preset, state, onUpdatePreset }: { preset: VerticalPreset; state: AppState; onUpdatePreset: (patch: Partial<VerticalPreset>) => void }) {
  const [activeTab, setActiveTab] = useState<PublicationAdminTabId>('overview')
  const activeTabMeta = publicationAdminTabs.find((tab) => tab.id === activeTab) ?? publicationAdminTabs[0]
  const paidMembers = preset.members.filter((member) => member.status === 'active').length
  const freeMembers = preset.members.filter((member) => member.status === 'free').length
  const paidContent = preset.content.filter((item) => item.isPaid).length
  const publicContent = preset.content.filter((item) => !item.isPaid).length
  const openModeration = preset.moderation.filter((item) => item.status !== 'resolved').length
  const scheduledNewsletter = preset.newsletter.filter((issue) => issue.status === 'scheduled').length
  const adminQueue = [
    { label: '付費文章', value: `${paidContent}`, tone: 'yellow' },
    { label: '讀者回覆待處理', value: `${openModeration}`, tone: 'red' },
    { label: '付款狀態待確認', value: `${state.paymentEvents.length}`, tone: 'blue' },
    { label: 'Newsletter 排程', value: `${scheduledNewsletter}`, tone: 'green' },
  ]

  return (
    <div className="admin-workspace publication-admin-workspace">
      <section className="section-block admin-hero publication-admin-hero">
        <div className="section-heading">
          <span className="eyebrow">出版後台</span>
          <h3>{preset.brand.productName} 出版後台</h3>
          <p>用分頁管理出版站日常工作：文章與付費牆、Newsletter、讀者、推薦成長、付款發票與站點設定各自獨立，避免所有功能擠在同一頁。</p>
        </div>
        <div className="admin-grid">
          <MetricTile label="月訂閱收入" value={preset.metrics.mrr} icon={BarChart3} />
          <MetricTile label="免費讀者" value={String(freeMembers)} icon={UsersRound} />
          <MetricTile label="付費讀者" value={String(paidMembers)} icon={ShieldCheck} />
          <MetricTile label="公開 / 付費文章" value={`${publicContent} / ${paidContent}`} icon={BookOpen} />
        </div>
      </section>

      <section className="publication-admin-shell">
        <aside className="publication-admin-tabs" aria-label="Signal Brief 後台分頁">
          {publicationAdminTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>
                <Icon size={17} />
                <span>
                  <strong>{tab.label}</strong>
                  <small>{tab.description}</small>
                </span>
              </button>
            )
          })}
        </aside>

        <div className="publication-admin-content">
          <div className="publication-admin-tab-head">
            <span className="eyebrow">目前分頁</span>
            <h4>{activeTabMeta.label}</h4>
            <p>{activeTabMeta.description}</p>
          </div>

          {activeTab === 'overview' && (
            <div className="publication-admin-tab-grid">
              <article className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <span className="eyebrow">待辦</span>
                    <h4>今日待辦</h4>
                  </div>
                  <AlertCircle size={18} />
                </div>
                <div className="admin-queue">
                  {adminQueue.map((item) => (
                    <div key={item.label}>
                      <StatusPill tone={item.tone}>{item.value}</StatusPill>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <span className="eyebrow">審核</span>
                    <h4>留言、讀者回覆與付款爭議</h4>
                  </div>
                  <ShieldCheck size={18} />
                </div>
                <div className="admin-content-stack">
                  {preset.moderation.map((item) => (
                    <div key={item.id} className="admin-content-item">
                      <Badge variant="outline" className="pill">{moderationKindLabel(item.kind, true)} · {statusLabel(item.status)}</Badge>
                      <strong>{item.title}</strong>
                      <small>{item.subject} · 優先度 {priorityLabel(item.priority)}</small>
                      <small>{item.action}</small>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          )}

          {activeTab === 'articles' && (
            <div className="publication-admin-tab-grid">
              <AdminSettingsEditor preset={preset} onUpdatePreset={onUpdatePreset} section="content" />
              <article className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <span className="eyebrow">文章狀態</span>
                    <h4>內容與付費牆總覽</h4>
                  </div>
                  <BookOpen size={18} />
                </div>
                <div className="admin-content-stack">
                  {preset.content.map((item) => (
                    <div key={item.id} className="admin-content-item">
                      <Badge variant="outline" className="pill">{item.isPaid ? '付費文章' : '公開文章'} · {contentTypeLabel(item.type)}</Badge>
                      <strong>{item.title}</strong>
                      <small>{item.isPaid ? `第 ${paywallParagraph(item)} 段後啟用付費牆` : '公開可閱讀'} · {item.minutes} 分鐘</small>
                      {item.limitedFreeUntil && <small>限時免費至 {item.limitedFreeUntil}</small>}
                    </div>
                  ))}
                </div>
              </article>
            </div>
          )}

          {activeTab === 'newsletter' && (
            <div className="publication-admin-tab-grid">
              <AdminSettingsEditor preset={preset} onUpdatePreset={onUpdatePreset} section="newsletter" />
              <article className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <span className="eyebrow">成效</span>
                    <h4>發信、分眾與升級</h4>
                  </div>
                  <Megaphone size={18} />
                </div>
                <div className="admin-content-stack">
                  {preset.newsletter.map((issue) => (
                    <div key={issue.id} className="admin-content-item horizontal">
                      <span>
                        <Badge variant="outline" className="pill">{segmentLabel(issue.segment)} · {statusLabel(issue.status)}</Badge>
                        <strong>{issue.subject}</strong>
                        <small>{issue.sendAt === 'on signup' ? '註冊後自動寄送' : issue.sendAt} · 開信 {issue.openRate} · 點擊 {issue.clickRate}</small>
                      </span>
                      <StatusPill tone={issue.paidConversions > 0 ? 'green' : 'yellow'}>{`${issue.paidConversions} 人升級`}</StatusPill>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          )}

          {activeTab === 'readers' && (
            <article className="admin-panel publication-admin-table-panel">
              <div className="admin-panel-head">
                <div>
                  <span className="eyebrow">讀者營運</span>
                  <h4>讀者與訂閱狀態</h4>
                </div>
                <Button variant="outline" className="ghost-button"><SlidersHorizontal data-icon="inline-start" />篩選</Button>
              </div>
              <div className="admin-table">
                <div className="admin-table-head">
                  <span>讀者</span>
                  <span>方案</span>
                  <span>狀態</span>
                  <span>來源</span>
                  <span>互動</span>
                </div>
                {preset.members.map((member) => {
                  const plan = preset.plans.find((item) => item.id === member.planId)
                  return (
                    <div key={member.id} className="admin-table-row">
                      <span>
                        <strong>{member.name}</strong>
                        <small>{member.email}</small>
                      </span>
                      <span>{plan?.name ?? member.planId}</span>
                      <span><StatusPill tone={member.status === 'active' ? 'green' : 'yellow'}>{statusLabel(member.status)}</StatusPill></span>
                      <span>{sourceLabel(member.source)}</span>
                      <span>{member.contributions.posts} 則留言 · {member.contributions.comments} 次互動</span>
                    </div>
                  )
                })}
              </div>
            </article>
          )}

          {activeTab === 'growth' && (
            <div className="publication-admin-tab-grid">
              <article className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <span className="eyebrow">成長</span>
                    <h4>推薦、贈閱與來源成長</h4>
                  </div>
                  <Gift size={18} />
                </div>
                <div className="admin-content-stack">
                  {preset.referrals.map((campaign) => (
                    <div key={campaign.id} className="admin-content-item">
                      <Badge variant="outline" className="pill">{campaign.code}</Badge>
                      <strong>{campaign.label}</strong>
                      <small>{campaign.freeTrials} 人體驗 · {campaign.paidConversions} 人升級 · {campaign.revenueLabel}</small>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <span className="eyebrow">來源</span>
                    <h4>讀者來源與轉換</h4>
                  </div>
                  <Globe2 size={18} />
                </div>
                <div className="integration-grid">
                  <IntegrationItem label="主要來源" value={sourceLabel(preset.metrics.topSource)} />
                  <IntegrationItem label="付費轉換率" value={preset.metrics.conversion} />
                  <IntegrationItem label="流失風險" value={`${preset.metrics.churnRisk} 位需追蹤`} />
                  <IntegrationItem label="推薦碼" value={`${preset.referrals.length} 組活動中`} />
                </div>
              </article>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="publication-admin-tab-grid">
              <article className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <span className="eyebrow">付款</span>
                    <h4>金流、訂閱與發票</h4>
                  </div>
                  <CircleDollarSign size={18} />
                </div>
                {state.paymentEvents.length === 0 ? (
                  <div className="empty-state">
                    <strong>尚未啟用正式金流</strong>
                    <small>等文章、讀者、登入與訂閱流程確認後，再啟用金流與發票。</small>
                  </div>
                ) : (
                  state.paymentEvents.map((event) => (
                    <div key={event.id} className="event-line">
                      <strong>{event.planId}</strong>
                      <small>{event.amountLabel} · {event.invoiceStatus}</small>
                    </div>
                  ))
                )}
              </article>

              <article className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <span className="eyebrow">系統狀態</span>
                    <h4>InsForge / Portaly Vibe 設定狀態</h4>
                  </div>
                  <ShieldCheck size={18} />
                </div>
                <div className="integration-grid">
                  <IntegrationItem label="登入" value="正式測試登入已可使用" />
                  <IntegrationItem label="資料庫權限" value="文章、讀者與訂閱表已準備" />
                  <IntegrationItem label="檔案儲存" value="文章圖片與付費附件" />
                  <IntegrationItem label="Portaly Vibe MCP" value="專案層級設定已加入" />
                  <IntegrationItem label="金流" value="核心流程完成後再啟用" />
                  <IntegrationItem label="發票狀態" value="可同步到付款紀錄" />
                </div>
              </article>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="publication-admin-tab-grid">
              <AdminSettingsEditor preset={preset} onUpdatePreset={onUpdatePreset} section="site" />
              <article className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <span className="eyebrow">設定檢查</span>
                    <h4>目前出版站設定</h4>
                  </div>
                  <Settings2 size={18} />
                </div>
                <div className="integration-grid">
                  <IntegrationItem label="網站名稱" value={preset.brand.productName} />
                  <IntegrationItem label="作者名稱" value={preset.brand.creatorName} />
                  <IntegrationItem label="訂閱方案" value={`${preset.plans.length} 種方案`} />
                  <IntegrationItem label="主要按鈕" value={preset.copy.ctaPrimary} />
                </div>
              </article>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function AdminView({ preset, state, onUpdatePreset }: { preset: VerticalPreset; state: AppState; onUpdatePreset: (patch: Partial<VerticalPreset>) => void }) {
  const isPublication = isPublicationPreset(preset)
  const paidMembers = preset.members.filter((member) => member.status === 'active').length
  const paidContent = preset.content.filter((item) => item.isPaid).length
  const totalLessons = preset.courses.reduce((count, course) => count + course.lessons.length, 0)
  const openModeration = preset.moderation.filter((item) => item.status !== 'resolved').length
  const adminQueue = isPublication
    ? [
        { label: '付費文章草稿', value: `${paidContent}`, tone: 'yellow' },
        { label: '讀者回覆待處理', value: `${openModeration}`, tone: 'red' },
        { label: '付款狀態待確認', value: `${state.paymentEvents.length}`, tone: 'blue' },
        { label: 'Newsletter 排程', value: `${preset.newsletter.filter((issue) => issue.status === 'scheduled').length}`, tone: 'green' },
      ]
    : [
        { label: '內容草稿待審', value: `${paidContent + 2}`, tone: 'yellow' },
        { label: '社群檢舉待處理', value: `${openModeration}`, tone: 'red' },
        { label: '付款狀態待確認', value: `${state.paymentEvents.length}`, tone: 'blue' },
        { label: '通訊排程', value: `${preset.newsletter.filter((issue) => issue.status === 'scheduled').length}`, tone: 'green' },
      ]

  if (isPublication) {
    return <PublicationAdminView preset={preset} state={state} onUpdatePreset={onUpdatePreset} />
  }

  return (
    <div className="admin-workspace">
      <section className="section-block admin-hero">
        <div className="section-heading">
          <span className="eyebrow">營運後台</span>
          <h3>{preset.brand.productName} 營運後台</h3>
          <p>{isPublication ? '這裡集中管理文章、付費牆、訂閱者、Newsletter、推薦贈閱、金流、發票與出版設定，只保留出版與訂閱需要的營運模組。' : '這裡集中管理會員、內容、課程、社群、活動、金流、發票與產品設定狀態，適合每天檢查營運進度。'}</p>
        </div>
        <div className="admin-grid">
          <MetricTile label={isPublication ? '訂閱收入' : '月經常收入'} value={preset.metrics.mrr} icon={BarChart3} />
          <MetricTile label={isPublication ? '訂閱讀者' : '活躍會員'} value={String(preset.metrics.activeMembers)} icon={UsersRound} />
          <MetricTile label={isPublication ? '付費訂閱' : '付費會員'} value={String(paidMembers)} icon={ShieldCheck} />
          <MetricTile label="主要來源" value={sourceLabel(preset.metrics.topSource)} icon={Globe2} />
        </div>
      </section>

      <section className="admin-dashboard-grid">
        <AdminSettingsEditor preset={preset} onUpdatePreset={onUpdatePreset} />

        <article className="admin-panel span-2">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">{isPublication ? '讀者營運' : '會員營運'}</span>
              <h4>{isPublication ? '讀者與訂閱狀態' : '會員與訂閱狀態'}</h4>
            </div>
            <Button variant="outline" className="ghost-button"><SlidersHorizontal data-icon="inline-start" />篩選</Button>
          </div>
          <div className="admin-table">
            <div className="admin-table-head">
              <span>{isPublication ? '讀者' : '會員'}</span>
              <span>方案</span>
              <span>狀態</span>
              <span>來源</span>
              <span>{isPublication ? '互動' : '等級'}</span>
            </div>
            {preset.members.map((member) => {
              const plan = preset.plans.find((item) => item.id === member.planId)
              return (
                <div key={member.id} className="admin-table-row">
                  <span>
                    <strong>{member.name}</strong>
                    <small>{member.email}</small>
                  </span>
                  <span>{plan?.name ?? member.planId}</span>
                  <span><StatusPill tone={member.status === 'active' ? 'green' : 'yellow'}>{statusLabel(member.status)}</StatusPill></span>
                  <span>{sourceLabel(member.source)}</span>
                  <span>{isPublication ? `${member.contributions.posts} 則留言 · ${member.contributions.comments} 次互動` : `Level ${member.level} · ${roleDisplayLabel(member.groupRole)} · ${member.points} 分`}</span>
                </div>
              )
            })}
          </div>
        </article>

        <article className="admin-panel span-2">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">通訊營運</span>
              <h4>發信、分眾與付費轉換</h4>
            </div>
            <Megaphone size={18} />
          </div>
          <div className="admin-content-stack">
            {preset.newsletter.map((issue) => (
              <div key={issue.id} className="admin-content-item horizontal">
                <span>
                  <Badge variant="outline" className="pill">{segmentLabel(issue.segment)} · {statusLabel(issue.status)}</Badge>
                  <strong>{issue.subject}</strong>
                  <small>{issue.sendAt === 'on signup' ? '註冊後自動寄送' : issue.sendAt} · 開信 {issue.openRate} · 點擊 {issue.clickRate}</small>
                </span>
                <StatusPill tone={issue.paidConversions > 0 ? 'green' : 'yellow'}>{`${issue.paidConversions} 人升級`}</StatusPill>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">待辦</span>
              <h4>今日待辦</h4>
            </div>
            <AlertCircle size={18} />
          </div>
          <div className="admin-queue">
            {adminQueue.map((item) => (
              <div key={item.label}>
                <StatusPill tone={item.tone}>{item.value}</StatusPill>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">審核</span>
              <h4>{isPublication ? '留言、讀者回覆與付款爭議' : '入會審核、檢舉與風險處理'}</h4>
            </div>
            <ShieldCheck size={18} />
          </div>
          <div className="admin-content-stack">
            {preset.moderation.map((item) => (
              <div key={item.id} className="admin-content-item">
                <Badge variant="outline" className="pill">{moderationKindLabel(item.kind, isPublication)} · {statusLabel(item.status)}</Badge>
                <strong>{item.title}</strong>
                <small>{item.subject} · 優先度 {priorityLabel(item.priority)}</small>
                <small>{item.action}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">成長</span>
              <h4>推薦、贈閱與來源成長</h4>
            </div>
            <Gift size={18} />
          </div>
          <div className="admin-content-stack">
            {preset.referrals.map((campaign) => (
              <div key={campaign.id} className="admin-content-item">
                <Badge variant="outline" className="pill">{campaign.code}</Badge>
                <strong>{campaign.label}</strong>
                <small>{campaign.freeTrials} 人體驗 · {campaign.paidConversions} 人升級 · {campaign.revenueLabel}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">內容營運</span>
              <h4>內容與付費牆</h4>
            </div>
            <BookOpen size={18} />
          </div>
          <div className="admin-content-stack">
            {preset.content.map((item) => (
              <div key={item.id} className="admin-content-item">
                <Badge variant="outline" className="pill">{contentTypeLabel(item.type)}</Badge>
                <strong>{item.title}</strong>
                <small>{item.category} · {item.isPaid ? '會員限定' : '公開'} · {item.minutes} 分鐘</small>
              </div>
            ))}
          </div>
        </article>

        {preset.courses.length > 0 && (
          <article className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <span className="eyebrow">課程</span>
                <h4>課程與進度</h4>
              </div>
              <PlayCircle size={18} />
            </div>
            {preset.courses.map((course) => (
              <div key={course.id} className="admin-course-summary">
                <div>
                  <strong>{course.title}</strong>
                  <small>{course.lessons.length} 個單元 · 共 {totalLessons} 筆課程紀錄</small>
                </div>
                <div className="progress-track"><span style={{ width: `${course.progress}%` }} /></div>
              </div>
            ))}
          </article>
        )}

        {preset.threads.length > 0 && (
          <article className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <span className="eyebrow">社群</span>
                <h4>社群審核與互動</h4>
              </div>
              <MessageSquareText size={18} />
            </div>
            <div className="admin-content-stack">
              {preset.threads.map((thread) => (
                <div key={thread.id} className="admin-content-item">
                  <Badge variant="outline" className="pill">{thread.category}</Badge>
                  <strong>{thread.title}</strong>
                  <small>{thread.replies} 則回覆 · {thread.reactions} 個反應{thread.adminOnly ? ' · 會員限定' : ''}</small>
                </div>
              ))}
            </div>
          </article>
        )}

        {preset.events.length > 0 && (
          <article className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <span className="eyebrow">活動</span>
                <h4>活動、直播與回放</h4>
              </div>
              <CalendarDays size={18} />
            </div>
            <div className="admin-content-stack">
              {preset.events.map((event) => (
                <div key={event.id} className="admin-content-item">
                  <Badge variant="outline" className="pill">{eventKindLabel(event.kind)}</Badge>
                  <strong>{event.title}</strong>
                  <small>{event.date} · {statusLabel(event.status)}</small>
                </div>
              ))}
            </div>
          </article>
        )}

        <article className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">付款</span>
              <h4>金流、訂閱與發票</h4>
            </div>
            <CircleDollarSign size={18} />
          </div>
          {state.paymentEvents.length === 0 ? (
            <div className="empty-state">
              <strong>尚未啟用正式金流</strong>
              <small>等前台、登入、內容與會員流程完成後，再決定是否啟用金流與發票。</small>
            </div>
          ) : (
            state.paymentEvents.map((event) => (
              <div key={event.id} className="event-line">
                <strong>{event.planId}</strong>
                <small>{event.amountLabel} · {event.invoiceStatus}</small>
              </div>
            ))
          )}
        </article>

        <article className="admin-panel span-2">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">系統狀態</span>
              <h4>InsForge / Portaly Vibe 設定狀態</h4>
            </div>
            <ShieldCheck size={18} />
          </div>
          <div className="integration-grid">
            <IntegrationItem label="登入" value="Google 登入可啟用" />
            <IntegrationItem label="資料庫權限" value="資料表與權限規則已準備" />
            <IntegrationItem label="檔案儲存" value={isPublication ? '文章圖片與付費附件' : '課程資源與回放檔案'} />
            <IntegrationItem label="Portaly Vibe MCP" value="專案層級設定已加入" />
            <IntegrationItem label="金流" value="核心流程完成後再啟用" />
            <IntegrationItem label="發票狀態" value="可同步到付款紀錄" />
          </div>
        </article>
      </section>
    </div>
  )
}

function StatusPill({ tone, children }: { tone: string; children: string }) {
  return <Badge variant="outline" className={`status-pill tone-${tone}`}>{children}</Badge>
}

function IntegrationItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="integration-item">
      <CheckCircle2 size={16} />
      <span>
        <strong>{label}</strong>
        <small>{value}</small>
      </span>
    </div>
  )
}

function SetupView({ presetId, onSelectPreset }: { presetId: PresetId; onSelectPreset: (presetId: PresetId) => void }) {
  const isPublication = presetId === 'signal-brief'
  const setupChoices: Array<{
    id: PresetId
    title: string
    subtitle: string
    description: string
    includes: string[]
  }> = [
    {
      id: 'skills-school',
      title: '全功能會員社群',
      subtitle: '類 Skool / School',
      description: '適合課程、社群、陪跑、教練、挑戰活動與會員制學習產品。',
      includes: ['課程進度與等級', '社群討論與會員目錄', '打卡挑戰、活動與後台審核'],
    },
    {
      id: 'signal-brief',
      title: '出版訂閱通訊',
      subtitle: '類 Substack',
      description: '適合 Newsletter、專欄、付費文章、研究報告與個人出版站。',
      includes: ['公開文章與付費文章', '段落付費牆與限時免費', '訂閱方案、Newsletter 與讀者管理'],
    },
  ]

  return (
    <section className="section-block">
      <div className="section-heading">
        <span className="eyebrow">設定指南</span>
        <h3>{isPublication ? '調整出版品牌、文章與訂閱設定' : '調整品牌、內容與會員設定'}</h3>
      </div>
      <div className="setup-choice-grid" aria-label="選擇 fork 版本">
        {setupChoices.map((choice) => (
          <article key={choice.id} className={choice.id === presetId ? 'setup-choice-card selected' : 'setup-choice-card'}>
            <div>
              <span className="eyebrow">{choice.subtitle}</span>
              <h4>{choice.title}</h4>
              <p>{choice.description}</p>
            </div>
            <ul className="check-list">
              {choice.includes.map((item) => <li key={item}><CheckCircle2 size={16} />{item}</li>)}
            </ul>
            <Button
              className={choice.id === presetId ? 'primary-button' : 'ghost-button'}
              variant={choice.id === presetId ? 'default' : 'outline'}
              onClick={() => onSelectPreset(choice.id)}
            >
              {choice.id === presetId ? '目前選擇' : '切換到這個版本'}
            </Button>
          </article>
        ))}
      </div>
      <div className="setup-grid">
        <article>
          <h4>先改這些檔案</h4>
          <ul className="check-list">
            <li><Settings2 size={16} />`src/data/presets.ts`：{isPublication ? '文案、方案、文章、電子報、訂閱者' : '文案、方案、課程、社群、活動'}</li>
            <li><Settings2 size={16} />`.env.local`：InsForge 和 Portaly Vibe MCP token</li>
            <li><Settings2 size={16} />`migrations/*.sql`：正式部署前套用資料表</li>
            <li><Settings2 size={16} />金流 functions：需要收款時再啟用</li>
          </ul>
        </article>
        <article>
          <h4>目前版本</h4>
          <pre className="code-block">{JSON.stringify({ 目前案例: presetId, 下一步: isPublication ? '調整出版品牌、訂閱方案、文章與 Newsletter 設定' : '調整品牌、方案、內容、課程與社群設定' }, null, 2)}</pre>
        </article>
        <article>
          <h4>Portaly Vibe MCP</h4>
          <ul className="check-list">
            {portalyIntegrationNotes.map((note) => <li key={note}><ShieldCheck size={16} />{note}</li>)}
          </ul>
        </article>
      </div>
    </section>
  )
}

function MetricTile({ label, value, icon: Icon }: { label: string; value: string; icon: typeof BarChart3 }) {
  return (
    <div className="metric-tile">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default App
