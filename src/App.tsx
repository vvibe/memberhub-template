import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  Heart,
  LayoutDashboard,
  Link2,
  Lock,
  LogIn,
  LogOut,
  MessageCircle,
  MessageSquareX,
  MessageSquareText,
  Pencil,
  Pin,
  PinOff,
  PlayCircle,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  Trophy,
  Upload,
  UserRound,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import { sanitizeRichTextHtml } from './lib/rich-text'
import { loadState, planLabel, roleLabel, saveState } from './lib/store'
import type {
  AppState,
  CalendarEvent,
  ClassroomCourse,
  CommunityComment,
  CommunityCategory,
  CommunityPost,
  CourseAccessMode,
  Member,
  MembershipApplication,
  Plan,
  PointRuleId,
  Role,
  ViewId,
} from './types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const RichTextEditor = lazy(() => import('@/components/RichTextEditor').then((module) => ({ default: module.RichTextEditor })))

type DeferredRichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel: string
  compact?: boolean
}

function DeferredRichTextEditor(props: DeferredRichTextEditorProps) {
  return (
    <Suspense fallback={<div className="rich-text-editor rich-text-loading">正在載入編輯器…</div>}>
      <RichTextEditor {...props} />
    </Suspense>
  )
}

type AuthResult = {
  ok: boolean
  role?: Role
  email?: string
  requiresVerification?: boolean
  message?: string
  error?: string
}

function useEscapeKey(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return undefined
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [active, onClose])
}

function matchesQuery(query: string, ...values: Array<string | undefined>) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return values.some((value) => value?.toLowerCase().includes(normalized))
}

const navItems: Array<{ id: ViewId; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'community', label: 'Community', icon: MessageSquareText },
  { id: 'classroom', label: 'Classroom', icon: PlayCircle },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'members', label: 'Members', icon: UsersRound },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'about', label: 'About', icon: FileText },
]

const adminTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'general', label: 'General', icon: UserRound },
  { id: 'access', label: 'Access', icon: ShieldCheck },
  { id: 'community', label: 'Community', icon: MessageSquareText },
  { id: 'classroom', label: 'Classroom', icon: PlayCircle },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'members', label: 'Members', icon: UsersRound },
  { id: 'pricing', label: 'Pricing', icon: CircleDollarSign },
  { id: 'plugins', label: 'Plugins', icon: Settings2 },
] as const

type AdminTab = (typeof adminTabs)[number]['id']

const viewIds = new Set<ViewId>([...navItems.map((item) => item.id), 'login', 'account', 'admin'])
const publicViews = new Set<ViewId>(['about'])
const fallbackCoverImage = 'https://picsum.photos/seed/memberhub-cover/1200/630'
const fallbackGalleryImages = [
  'https://picsum.photos/seed/memberhub-workshop-a/1200/630',
  'https://picsum.photos/seed/memberhub-workshop-b/1200/630',
]
const courseCoverImages = [
  'https://picsum.photos/seed/memberhub-course-a/900/540',
  'https://picsum.photos/seed/memberhub-course-b/900/540',
  'https://picsum.photos/seed/memberhub-course-c/900/540',
  'https://picsum.photos/seed/memberhub-course-d/900/540',
  'https://picsum.photos/seed/memberhub-course-e/900/540',
]

function stockCoverStyle(url: string) {
  return { backgroundImage: `linear-gradient(135deg, rgba(17, 24, 39, 0.42), rgba(17, 24, 39, 0.08)), url("${url}")` }
}

function defaultViewForRole(role: Role): ViewId {
  if (role === 'admin') return 'admin'
  return role === 'visitor' ? 'about' : 'community'
}

function isAdminCredentials(state: AppState, email: string, password: string) {
  return email.trim().toLowerCase() === state.adminEmail.trim().toLowerCase() && password === state.adminPassword
}

function getInitialView(): ViewId | undefined {
  if (typeof window === 'undefined') return undefined
  const value = new URLSearchParams(window.location.search).get('view')
  return value && viewIds.has(value as ViewId) ? (value as ViewId) : undefined
}

function levelForPoints(points: number, thresholds: number[]) {
  const index = thresholds.reduce((levelIndex, threshold, currentIndex) => (points >= threshold ? currentIndex : levelIndex), 0)
  return index + 1
}

function maxLevelPoints(thresholds: number[]) {
  return thresholds[thresholds.length - 1] ?? 0
}

function effectivePointsForRole(role: Role, points: number, thresholds: number[]) {
  return role === 'admin' ? maxLevelPoints(thresholds) : points
}

function nextLevelPoints(points: number, thresholds: number[]) {
  return thresholds.find((threshold) => threshold > points)
}

function pointValue(state: AppState, id: PointRuleId) {
  const rule = state.pointRules.find((item) => item.id === id)
  return rule?.enabled ? Math.max(0, rule.points) : 0
}

function authorName(state: AppState, authEmail: string | null) {
  return state.profileName.trim() || authEmail?.split('@')[0] || 'You'
}

function mentionLabel(name: string) {
  return `@${name.replace(/\s+/g, '')}`
}

function renderMentionText(text: string) {
  return text.split(/(@[^\s@]+)/g).map((part, index) => (
    part.startsWith('@') ? <span className="mention-token" key={`${part}-${index}`}>{part}</span> : part
  ))
}

function commentCount(comments: CommunityComment[]): number {
  return comments.reduce((total, comment) => total + 1 + commentCount(comment.replies), 0)
}

function commentIds(comments: CommunityComment[]): string[] {
  return comments.flatMap((comment) => [comment.id, ...commentIds(comment.replies)])
}

function mapComments(comments: CommunityComment[], id: string, update: (comment: CommunityComment) => CommunityComment): CommunityComment[] {
  return comments.map((comment) => (comment.id === id ? update(comment) : { ...comment, replies: mapComments(comment.replies, id, update) }))
}

function newComment(body: string, state: AppState, authEmail: string | null): CommunityComment {
  return {
    id: `comment-${Date.now()}`,
    authorId: 'current',
    authorName: authorName(state, authEmail),
    body,
    createdAt: new Intl.DateTimeFormat('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()),
    likes: 0,
    replies: [],
  }
}

function benefitsForLevel(state: AppState, level: number) {
  return state.levelBenefits.find((item) => item.level === level)?.benefits.filter(Boolean) ?? []
}

function profileInitial(name: string) {
  return (name.trim().charAt(0) || 'M').toUpperCase()
}

function ProfileAvatar({ name, url, className = '' }: { name: string; url?: string; className?: string }) {
  const src = url?.trim()
  return (
    <span className={`avatar${className ? ` ${className}` : ''}`}>
      {src ? <img src={src} alt="" /> : profileInitial(name)}
    </span>
  )
}

function attachmentDownloadName(resource: string) {
  const filename = resource.trim().replace(/[\\/:*?"<>|]+/g, '-') || 'attachment'
  return /\.[A-Za-z0-9]{1,8}$/.test(filename) ? filename : `${filename}.txt`
}

function attachmentDownloadHref(resource: string) {
  return `data:text/plain;charset=utf-8,${encodeURIComponent(resource.trim() || 'Attachment')}`
}

function accessLabel(access: CourseAccessMode) {
  const labels: Record<CourseAccessMode, string> = {
    open: 'Open',
    'level-unlock': 'Level unlock',
    'buy-now': 'Buy now',
    'time-unlock': 'Time unlock',
    private: 'Private',
  }
  return labels[access]
}

function applicationStatusLabel(status: MembershipApplication['status']) {
  return status === 'approved' ? '已同意' : status === 'rejected' ? '已拒絕' : '待審核'
}

function eventDurationMinutes(duration: string) {
  return Number(duration.match(/\d+/)?.[0] ?? 60)
}

function calendarEventDates(event: CalendarEvent) {
  const [year, month, day] = event.date.split('-').map(Number)
  const [hour, minute] = event.time.split(':').map(Number)
  const start = new Date(Date.UTC(year, month - 1, day, hour, minute || 0, 0))
  const end = new Date(start.getTime() + eventDurationMinutes(event.duration) * 60_000)
  const compact = (date: Date) => `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}T${String(date.getUTCHours()).padStart(2, '0')}${String(date.getUTCMinutes()).padStart(2, '0')}00`
  const isoLocal = (date: Date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}T${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}:00`
  return { compactStart: compact(start), compactEnd: compact(end), isoStart: isoLocal(start), isoEnd: isoLocal(end) }
}

function eventEndsAt(event: CalendarEvent) {
  const suffix = event.timezone === 'Asia/Taipei' ? '+08:00' : ''
  const start = new Date(`${event.date}T${event.time}:00${suffix}`)
  return new Date(start.getTime() + eventDurationMinutes(event.duration) * 60_000)
}

function isEventExpired(event: CalendarEvent) {
  return eventEndsAt(event).getTime() < Date.now()
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

function buildCalendarOptions(event: CalendarEvent) {
  const dates = calendarEventDates(event)
  const recurrenceRule = event.recurrence === 'none' ? '' : `RRULE:FREQ=${event.recurrence.toUpperCase()}`
  const details = [event.description, `Timezone: ${event.timezone}`, recurrenceRule && `Recurrence: ${event.recurrence}`].filter(Boolean).join('\n\n')
  const googleParams = new URLSearchParams({ action: 'TEMPLATE', text: event.title, dates: `${dates.compactStart}/${dates.compactEnd}`, ctz: event.timezone, details, location: event.location })
  if (recurrenceRule) googleParams.set('recur', recurrenceRule)
  const outlookParams = new URLSearchParams({ rru: 'addevent', subject: event.title, startdt: dates.isoStart, enddt: dates.isoEnd, body: details, location: event.location })
  const yahooParams = new URLSearchParams({ v: '60', title: event.title, st: dates.compactStart, et: dates.compactEnd, desc: details, in_loc: event.location })
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MemberHub//Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@memberhub`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`,
    `DTSTART;TZID=${event.timezone}:${dates.compactStart}`,
    `DTEND;TZID=${event.timezone}:${dates.compactEnd}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(details)}`,
    `LOCATION:${escapeIcs(event.location)}`,
    recurrenceRule,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
  const filename = `${event.date}-${event.title.replace(/[\\/:*?"<>|]+/g, '-')}.ics`

  return [
    { label: 'Google', href: `https://calendar.google.com/calendar/render?${googleParams.toString()}` },
    { label: 'Apple', href: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`, download: filename },
    { label: 'Outlook', href: `https://outlook.office.com/calendar/0/deeplink/compose?${outlookParams.toString()}` },
    { label: 'Outlook.com', href: `https://outlook.live.com/calendar/0/deeplink/compose?${outlookParams.toString()}` },
    { label: 'Yahoo', href: `https://calendar.yahoo.com/?${yahooParams.toString()}` },
  ]
}

function eventAccessLabel(event: CalendarEvent, state: AppState) {
  if (event.accessMode === 'level') return `Level ${event.requiredLevel ?? 1}+`
  if (event.accessMode === 'plan') return `${state.plans.find((plan) => plan.id === event.requiredPlanId)?.name ?? 'Plan'}+`
  if (event.accessMode === 'course') return state.courses.find((course) => course.id === event.courseId)?.title ?? 'Course members'
  return 'All members'
}

function CalendarProviderLinks({ event, onSelect }: { event: CalendarEvent; onSelect?: () => void }) {
  return (
    <div className="calendar-provider-list">
      {buildCalendarOptions(event).map((option) => (
        <a key={option.label} href={option.href} target={option.download ? undefined : '_blank'} rel={option.download ? undefined : 'noreferrer'} download={option.download} onClick={onSelect}>
          <span>{option.label}</span>
          <Plus size={18} aria-hidden="true" />
        </a>
      ))}
    </div>
  )
}

function EventCalendarAction({ event, onOpen }: { event: CalendarEvent; onOpen: (event: CalendarEvent) => void }) {
  if (isEventExpired(event)) return <button className="event-calendar-disabled" type="button" disabled>Event ended</button>

  return (
    <button className="event-calendar-button" type="button" onClick={() => onOpen(event)}>
      Add to calendar
    </button>
  )
}

function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [view, setView] = useState<ViewId>(() => {
    const initialView = getInitialView()
    const role = loadState().role
    return initialView === 'login' ? defaultViewForRole(role) : initialView ?? defaultViewForRole(role)
  })
  const [loginOpen, setLoginOpen] = useState(() => getInitialView() === 'login')
  const [joinPlan, setJoinPlan] = useState<Plan | null>(null)
  const [authEmail, setAuthEmail] = useState<string | null>(null)
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [saveNotice, setSaveNotice] = useState('')
  const initialInviteRef = useRef(typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('invite') ?? '')

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('view', view)
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
  }, [view])

  useEscapeKey(loginOpen, () => setLoginOpen(false))
  useEscapeKey(Boolean(joinPlan), () => setJoinPlan(null))

  useEffect(() => {
    if (!saveNotice) return undefined
    const timeout = window.setTimeout(() => setSaveNotice(''), 2200)
    return () => window.clearTimeout(timeout)
  }, [saveNotice])

  const updateState = (patch: Partial<AppState>, notice?: string) => {
    setState((current) => ({ ...current, ...patch }))
    if (notice) setSaveNotice(notice)
  }

  useEffect(() => {
    const invite = initialInviteRef.current.trim()
    if (!invite || state.inviteRecords.includes(invite)) return
    updateState({ inviteRecords: [invite, ...state.inviteRecords] }, '邀請來源已記錄在本機預覽。')
    initialInviteRef.current = ''
  }, [state.inviteRecords])
  const activePoints = effectivePointsForRole(state.role, state.currentMemberPoints, state.levelThresholds)
  const activeLevel = levelForPoints(activePoints, state.levelThresholds)
  const currentPlan = state.plans.find((plan) => plan.id === state.selectedPlanId) ?? state.plans[0]
  const isVisitor = state.role === 'visitor'
  const routedView = view === 'login' ? defaultViewForRole(state.role) : view
  const effectiveView = isVisitor && !publicViews.has(routedView) ? 'about' : state.role !== 'admin' && routedView === 'admin' ? defaultViewForRole(state.role) : routedView

  useEffect(() => {
    if (effectiveView !== view) setView(effectiveView)
  }, [effectiveView, view])

  const completeSession = (role: Role, email?: string) => {
    const nextEmail = email ?? authEmail ?? state.profileEmail
    const shouldUseEmailName = email && (!state.profileName.trim() || state.profileName === 'You')
    setAuthEmail(email ?? authEmail)
    updateState({
      role,
      selectedPlanId: role === 'visitor' ? 'free' : state.selectedPlanId,
      currentMemberPoints: role === 'admin' ? maxLevelPoints(state.levelThresholds) : role === 'visitor' ? 0 : state.currentMemberPoints,
      profileEmail: nextEmail,
      profileName: shouldUseEmailName ? email.split('@')[0] : state.profileName,
    })
    setView(defaultViewForRole(role))
  }

  const handleVerifyEmail = async (email: string, otp: string, role: Role): Promise<AuthResult> => {
    if (!otp.trim()) return { ok: false, error: '請輸入驗證碼。' }
    completeSession(role, email)
    return { ok: true, role, email }
  }

  const handleForgotPassword = async (email: string): Promise<AuthResult> => {
    const resetEmail = email.trim().toLowerCase()
    if (!resetEmail.includes('@')) return { ok: false, error: '請先輸入 Email。' }
    return { ok: true, message: '本機 demo 不會寄信；正式站請串接你選擇的 Auth provider 重設密碼流程。' }
  }

  const handleCredentialsLogin = async (email: string, password: string, role: Role): Promise<AuthResult> => {
    const loginEmail = email.trim().toLowerCase()
    if (isAdminCredentials(state, loginEmail, password)) {
      completeSession('admin', loginEmail)
      return { ok: true, role: 'admin', email: loginEmail }
    }
    if (role === 'admin') return { ok: false, role, email, error: '請使用測試管理員帳號登入。' }
    completeSession(role, email)
    return { ok: true, role, email }
  }

  const handleLogout = async () => {
    setAuthEmail(null)
    updateState({ role: 'visitor', selectedPlanId: 'free', currentMemberPoints: 0 }, '已登出社群。')
    setView('about')
  }

  const handlePlanSelect = (plan: Plan) => {
    if (state.role === 'visitor') {
      setJoinPlan(plan)
      return
    }
    updateState({
      role: 'member',
      selectedPlanId: plan.id,
      currentMemberPoints: Math.max(state.currentMemberPoints, 1),
    })
    setView('community')
  }

  const handleJoinRequest = (email: string, answers: Record<string, string>, plan: Plan) => {
    const approved = plan.id !== 'free' || state.accessSettings.instantMembershipApproval
    const application: MembershipApplication = {
      id: `application-${Date.now()}`,
      email,
      planId: plan.id,
      answers,
      status: approved ? 'approved' : 'pending',
      createdAt: '剛剛',
    }
    if (approved) {
      setAuthEmail(email)
      setJoinPlan(null)
      setView('community')
    }
    updateState({
      role: approved ? 'member' : state.role,
      selectedPlanId: approved ? plan.id : state.selectedPlanId,
      currentMemberPoints: approved ? Math.max(state.currentMemberPoints, 1) : state.currentMemberPoints,
      profileEmail: approved ? email : state.profileEmail,
      profileName: approved && (!state.profileName.trim() || state.profileName === 'You') ? email.split('@')[0] : state.profileName,
      membershipAnswers: answers,
      membershipApplications: [application, ...state.membershipApplications],
    })
    return approved
  }

  const handleAddPost = (body: string, categoryId: string) => {
    const nextPost: CommunityPost = {
      id: `post-${Date.now()}`,
      categoryId,
      authorId: 'current',
      authorName: authorName(state, authEmail),
      body,
      createdAt: '剛剛',
      likes: 0,
      comments: [],
    }
    updateState({ posts: [nextPost, ...state.posts], currentMemberPoints: state.currentMemberPoints + pointValue(state, 'post') }, '貼文已發布。')
  }

  const handleLikePost = (postId: string) => {
    if (state.likedPostIds.includes(postId)) return
    updateState({
      likedPostIds: [...state.likedPostIds, postId],
      posts: state.posts.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)),
      currentMemberPoints: state.currentMemberPoints + pointValue(state, 'like'),
    }, '已按讚。')
  }

  const handleLikeComment = (commentId: string) => {
    if (state.likedCommentIds.includes(commentId)) return
    updateState({
      likedCommentIds: [...state.likedCommentIds, commentId],
      posts: state.posts.map((post) => ({ ...post, comments: mapComments(post.comments, commentId, (comment) => ({ ...comment, likes: comment.likes + 1 })) })),
      currentMemberPoints: state.currentMemberPoints + pointValue(state, 'like'),
    }, '已按讚。')
  }

  const handleAddComment = (postId: string, comment: string, parentCommentId?: string) => {
    const nextComment = newComment(comment, state, authEmail)
    updateState({
      posts: state.posts.map((post) => {
        if (post.id !== postId) return post
        if (!parentCommentId) return { ...post, comments: [...post.comments, nextComment] }
        return { ...post, comments: mapComments(post.comments, parentCommentId, (item) => ({ ...item, replies: [...item.replies, nextComment] })) }
      }),
      currentMemberPoints: state.currentMemberPoints + pointValue(state, 'comment'),
    }, parentCommentId ? '回覆已新增。' : '留言已新增。')
  }

  const handleTogglePostPinned = (postId: string) => {
    updateState({ posts: state.posts.map((post) => post.id === postId ? { ...post, pinned: !post.pinned } : post) }, '貼文置頂狀態已更新。')
  }

  const handleClearPostComments = (postId: string) => {
    const post = state.posts.find((item) => item.id === postId)
    const removedIds = new Set(post ? commentIds(post.comments) : [])
    updateState({
      posts: state.posts.map((item) => item.id === postId ? { ...item, comments: [] } : item),
      likedCommentIds: state.likedCommentIds.filter((id) => !removedIds.has(id)),
    }, '留言已清除。')
  }

  const handleDeletePost = (postId: string) => {
    const post = state.posts.find((item) => item.id === postId)
    const removedIds = new Set(post ? commentIds(post.comments) : [])
    updateState({
      posts: state.posts.filter((item) => item.id !== postId),
      likedPostIds: state.likedPostIds.filter((id) => id !== postId),
      likedCommentIds: state.likedCommentIds.filter((id) => !removedIds.has(id)),
    }, '貼文已刪除。')
  }

  const handleTogglePage = (pageId: string) => {
    updateState({
      completedPageIds: state.completedPageIds.includes(pageId)
        ? state.completedPageIds.filter((id) => id !== pageId)
        : [...state.completedPageIds, pageId],
    })
  }

  const handleAddEvent = (event: Omit<CalendarEvent, 'id'>) => {
    updateState({ events: [{ ...event, id: `event-${Date.now()}` }, ...state.events] }, '活動已新增。')
  }

  const openAdminTab = (tab: AdminTab) => {
    setAdminTab(tab)
    setView('admin')
  }

  return (
    <main className={`app-shell${isVisitor ? ' public-shell' : ' member-shell'}`}>
      {!isVisitor && (
        <header className="hub-topbar">
          <div className="hub-topbar-main">
            <button className="hub-brand" type="button" onClick={() => setView(defaultViewForRole(state.role))} aria-label="Open community home">
              <span className="brand-mark">MH</span>
              <span>
                <strong>{state.group.name}</strong>
                <small>{state.group.slug}.community</small>
              </span>
            </button>

            <label className="hub-search">
              <Search size={17} aria-hidden="true" />
              <input
                aria-label="Search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={effectiveView === 'members' ? 'Search members' : 'Search community'}
              />
            </label>

            <div className="hub-topbar-actions">
              <Button variant="outline" className="icon-button ghost-button" type="button" onClick={handleLogout} aria-label="登出"><LogOut size={16} aria-hidden="true" /></Button>
              <button className="avatar-button" type="button" onClick={() => setView('account')} aria-label="Account">
                <ProfileAvatar name={state.profileName} url={state.profileAvatarUrl} />
              </button>
            </div>
          </div>

          <nav className="nav-list hub-nav-row" aria-label="Main navigation">
            {navItems.map((item) => (
              <button key={item.id} type="button" className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}>
                <item.icon size={17} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            ))}
            {state.role === 'admin' && (
              <button type="button" className={view === 'admin' ? 'active' : ''} onClick={() => openAdminTab('dashboard')}>
                <LayoutDashboard size={17} aria-hidden="true" />
                <span>Admin</span>
              </button>
            )}
          </nav>
        </header>
      )}

      <section className="workspace">
        {isVisitor && (
          <header className="topbar">
            <div>
              <p>{state.group.tagline}</p>
              <h1>{state.group.name}</h1>
            </div>
            <div className="topbar-actions">
              <Button className="primary-button topbar-login-button" type="button" onClick={() => setLoginOpen(true)}><LogIn data-icon="inline-start" />登入社群</Button>
            </div>
          </header>
        )}

        {effectiveView === 'about' && (
          <AboutView
            state={state}
            updateState={updateState}
            onSelectPlan={handlePlanSelect}
            onLeaveGroup={() => { void handleLogout() }}
            onOpenAdmin={openAdminTab}
          />
        )}
        {effectiveView === 'community' && (
          <CommunityView
            state={state}
            searchQuery={searchQuery}
            onAddPost={handleAddPost}
            onLikePost={handleLikePost}
            onLikeComment={handleLikeComment}
            onAddComment={handleAddComment}
            onTogglePostPinned={handleTogglePostPinned}
            onClearPostComments={handleClearPostComments}
            onDeletePost={handleDeletePost}
            onJoin={() => handlePlanSelect(state.plans[0])}
            onOpenAdmin={openAdminTab}
          />
        )}
        {effectiveView === 'classroom' && <ClassroomView state={state} activeLevel={activeLevel} searchQuery={searchQuery} onTogglePage={handleTogglePage} onJoin={() => handlePlanSelect(state.plans[0])} onOpenAdmin={openAdminTab} />}
        {effectiveView === 'calendar' && <CalendarView state={state} activeLevel={activeLevel} searchQuery={searchQuery} onAddEvent={handleAddEvent} onOpenAdmin={openAdminTab} />}
        {effectiveView === 'members' && <MembersView state={state} activePoints={activePoints} activeLevel={activeLevel} searchQuery={searchQuery} onOpenAdmin={openAdminTab} />}
        {effectiveView === 'leaderboard' && <LeaderboardView state={state} activePoints={activePoints} activeLevel={activeLevel} onOpenAdmin={openAdminTab} />}
        {effectiveView === 'account' && <AccountView state={state} updateState={updateState} currentPlan={currentPlan} activeLevel={activeLevel} activePoints={activePoints} />}
        {effectiveView === 'admin' && state.role === 'admin' && (
          <AdminView
            state={state}
            updateState={updateState}
            onAddEvent={handleAddEvent}
            tab={adminTab}
            setTab={setAdminTab}
          />
        )}
      </section>
      {loginOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLoginOpen(false)
          }}
        >
          <div className="login-modal" role="dialog" aria-modal="true" aria-label="登入社群">
            <button className="modal-close" type="button" onClick={() => setLoginOpen(false)} aria-label="關閉登入視窗">×</button>
            <LoginView
              onCredentialsLogin={handleCredentialsLogin}
              onForgotPassword={handleForgotPassword}
              onJoin={() => {
                setLoginOpen(false)
                handlePlanSelect(state.plans[0])
              }}
              onVerifyEmail={handleVerifyEmail}
              onSuccess={() => setLoginOpen(false)}
            />
          </div>
        </div>
      )}
      {joinPlan && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setJoinPlan(null)
          }}
        >
          <div className="join-modal" role="dialog" aria-modal="true" aria-label="加入社群申請">
            <button className="modal-close" type="button" onClick={() => setJoinPlan(null)} aria-label="關閉加入申請">×</button>
            <JoinRequestView
              plan={joinPlan}
              questions={state.membershipQuestions}
              onSubmit={(email, answers) => handleJoinRequest(email, answers, joinPlan)}
            />
          </div>
        </div>
      )}
      {saveNotice && <div className="save-toast" role="status">{saveNotice}</div>}
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function AdminFrontActions({
  state,
  actions,
  onOpenAdmin,
}: {
  state: AppState
  actions: Array<{ label: string; tab: AdminTab }>
  onOpenAdmin: (tab: AdminTab) => void
}) {
  if (state.role !== 'admin') return null
  return (
    <div className="admin-front-actions" aria-label="Admin quick actions">
      {actions.map((action) => (
        <Button key={`${action.tab}-${action.label}`} variant="outline" className="secondary-button" type="button" onClick={() => onOpenAdmin(action.tab)}>
          <Settings2 data-icon="inline-start" />
          {action.label}
        </Button>
      ))}
    </div>
  )
}

function JoinRequestView({ plan, questions, onSubmit }: { plan: Plan; questions: string[]; onSubmit: (email: string, answers: Record<string, string>) => boolean }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const isPaidPlan = plan.id !== 'free'

  if (submitted) {
    return (
      <article className="join-card">
        <SectionHeading eyebrow="Join request" title={isPaidPlan ? '訂閱申請已建立' : '申請已送出，等待審核'}>
          {isPaidPlan
            ? '管理員可先確認方案與入會回答，再接上你選擇的付款服務。'
            : '免費會員不會直接進入社群，管理員會在後台審核你的回答後核准。'}
        </SectionHeading>
      </article>
    )
  }

  return (
    <article className="join-card">
      <SectionHeading eyebrow="Join request" title={`加入 ${plan.name}`}>
        {isPaidPlan ? `${plan.price} ${plan.cadence}，送出後會以本機預覽狀態加入。` : '回答問題後送出申請，免費會員需由管理員審核。'}
      </SectionHeading>
      <form className="settings-form" onSubmit={(event) => {
        event.preventDefault()
        setError('')
        if (password.length < 8) {
          setError('密碼至少需要 8 位數。')
          return
        }
        if (password !== confirmPassword) {
          setError('兩次輸入的密碼不一致。')
          return
        }
        if (!onSubmit(email, answers)) setSubmitted(true)
      }}>
        <label>What's your best email?<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" required /></label>
        <div className="two-col">
          <label>Password<Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} placeholder="至少 8 位數" required /></label>
          <label>Confirm password<Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} placeholder="再次輸入密碼" required /></label>
        </div>
        <p className="form-helper">本機 demo 只檢查格式；正式站 fork 後請用 Auth provider 儲存密碼。</p>
        {questions.map((question) => (
          <label key={question}>{question}<Textarea value={answers[question] ?? ''} onChange={(event) => setAnswers({ ...answers, [question]: event.target.value })} placeholder="Your answer" maxLength={200} required /></label>
        ))}
        {error && <p className="form-error">{error}</p>}
        <Button className="primary-button" type="submit">{isPaidPlan ? '送出訂閱申請' : '送出申請'}</Button>
      </form>
    </article>
  )
}

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  )
}

function AboutView({
  state,
  updateState,
  onSelectPlan,
  onLeaveGroup,
  onOpenAdmin,
}: {
  state: AppState
  updateState: (patch: Partial<AppState>) => void
  onSelectPlan: (plan: Plan) => void
  onLeaveGroup: () => void
  onOpenAdmin: (tab: AdminTab) => void
}) {
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const paidPlan = state.plans.find((plan) => plan.id !== 'free' && plan.highlighted) ?? state.plans.find((plan) => plan.id !== 'free')
  const publicPlan = state.pricingMode === 'free' ? state.plans[0] : paidPlan ?? state.plans[0]
  const isFreePublicPlan = publicPlan.id === 'free'
  const PublicJoinIcon = isFreePublicPlan ? UserPlus : CircleDollarSign
  const publicJoinLabel = isFreePublicPlan ? '免費加入' : `加入 ${publicPlan.price}/月`
  const galleryImages = [state.group.coverImageUrl?.trim() || fallbackCoverImage, ...fallbackGalleryImages]
  const visibleLinks = state.externalLinks.filter((link) => !['Support', 'Rules'].includes(link.label) && (state.role !== 'visitor' || link.visibility === 'public'))
  const inviteName = (state.profileName.trim() || state.group.slug).toLowerCase().replace(/\s+/g, '-')
  const inviteLink = `${typeof window === 'undefined' ? 'https://memberhub.example' : window.location.origin}/?invite=${encodeURIComponent(inviteName)}`
  const addInviteRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = inviteEmail.trim()
    if (!next) return
    updateState({ inviteRecords: [next, ...state.inviteRecords] })
    setInviteEmail('')
  }
  const copyInviteLink = () => {
    void navigator.clipboard?.writeText(inviteLink)
    setCopyMessage('Invite link copied.')
  }

  return (
    <section className="public-about">
      <div className="about-cover-shell">
        <div className="about-cover stock-cover" role="img" aria-label="社群封面圖" style={stockCoverStyle(galleryImages[galleryIndex])} />
        <div className="public-gallery-controls">
          <button type="button" aria-label="上一張社群輪播圖" onClick={() => setGalleryIndex((current) => (current + galleryImages.length - 1) % galleryImages.length)}>
            <ChevronRight className="flip-icon" size={15} aria-hidden="true" />
          </button>
          <span className="mono">{galleryIndex + 1}/{galleryImages.length}</span>
          <button type="button" aria-label="下一張社群輪播圖" onClick={() => setGalleryIndex((current) => (current + 1) % galleryImages.length)}>
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="public-intro-grid">
        <article className="about-panel">
          <SectionHeading eyebrow="About" title={state.group.tagline}>
            {state.group.description}
          </SectionHeading>
          <AdminFrontActions
            state={state}
            onOpenAdmin={onOpenAdmin}
            actions={[
              { label: 'Edit about', tab: 'general' },
              { label: 'Edit pricing', tab: 'pricing' },
              { label: 'Edit rules', tab: 'community' },
            ]}
          />

          <div className="public-meta-grid" aria-label="社群公開資訊">
            <div><span>模式</span><strong>公開預覽</strong><small>加入後解鎖私密會員區</small></div>
            <div><span>會員數</span><strong>{state.members.length}</strong><small>{state.group.onlineLabel}</small></div>
            <div><span>訂閱金額</span><strong>{publicPlan.price}</strong><small>{publicPlan.cadence}</small></div>
            <div><span>作者</span><strong>{state.group.creatorName}</strong><small>{state.group.slug}.community</small></div>
          </div>
        </article>

        <aside className="group-card public-group-card">
          <div className="public-group-copy">
            <strong>{state.group.creatorName}</strong>
            <small className="mono">{state.group.slug}.community</small>
          </div>
          <p>{state.group.description}</p>
          <div className="group-stats">
            <Metric label="Members" value={`${state.members.length}`} />
            <Metric label="Online" value={state.group.onlineLabel.replace(' online', '')} />
          </div>
          {visibleLinks.length > 0 && (
            <div className="public-link-list">
              {visibleLinks.map((link) => (
                <a key={link.id} href={link.url} target={link.url.startsWith('http') ? '_blank' : undefined} rel={link.url.startsWith('http') ? 'noreferrer' : undefined}>
                  <ExternalLink size={14} aria-hidden="true" />
                  {link.label}
                </a>
              ))}
            </div>
          )}
          <div className="button-stack">
            {state.role === 'visitor' ? (
              <Button className="primary-button public-join-button" type="button" onClick={() => onSelectPlan(publicPlan)}><PublicJoinIcon data-icon="inline-start" />{publicJoinLabel}</Button>
            ) : (
              <Button className="primary-button public-join-button" type="button" onClick={() => setSettingsOpen((current) => !current)}><Settings2 data-icon="inline-start" />SETTING</Button>
            )}
          </div>
        </aside>
      </div>

      {state.role !== 'visitor' && settingsOpen && (
        <article className="about-settings-panel">
          <SectionHeading eyebrow="Settings" title="社群設定">
            管理你的專屬邀請連結、邀請紀錄與社群狀態。
          </SectionHeading>
          <div className="settings-form">
            <label>Invite link<Input aria-label="Invite link" value={inviteLink} readOnly /></label>
            <div className="button-stack">
              <Button variant="outline" className="secondary-button" type="button" onClick={copyInviteLink}><Link2 data-icon="inline-start" />Copy link</Button>
              <Button variant="outline" className="secondary-button danger-button" type="button" onClick={onLeaveGroup}><LogOut data-icon="inline-start" />退出社群</Button>
            </div>
            {copyMessage && <p className="form-helper">{copyMessage}</p>}
            {state.role === 'admin' && (
              <>
                <form className="form-row" onSubmit={addInviteRecord}>
                  <Input aria-label="Invite email" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="invitee@example.com" />
                  <Button className="primary-button" type="submit">Add invite record</Button>
                </form>
                <div className="compact-list">
                  {state.inviteRecords.length > 0
                    ? state.inviteRecords.map((record) => <p key={record}><strong>{record}</strong><span>recorded</span></p>)
                    : <p><strong>No invite records</strong><span>admin only</span></p>}
                </div>
              </>
            )}
          </div>
        </article>
      )}

      <article className="about-rules-panel">
        <SectionHeading eyebrow="Rules" title="社群規範">
          加入前請先確認這些協作規則，讓討論、回饋和合作都維持清楚。
        </SectionHeading>
        <div className="rule-grid">
          {state.rules.map((rule, index) => (
            <div className="rule-row about-rule-row" key={rule}>
              <strong>{index + 1}.</strong>
              <p>{rule}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}

function CommunityView({
  state,
  searchQuery,
  onAddPost,
  onLikePost,
  onLikeComment,
  onAddComment,
  onTogglePostPinned,
  onClearPostComments,
  onDeletePost,
  onJoin,
  onOpenAdmin,
}: {
  state: AppState
  searchQuery: string
  onAddPost: (body: string, categoryId: string) => void
  onLikePost: (postId: string) => void
  onLikeComment: (commentId: string) => void
  onAddComment: (postId: string, comment: string, parentCommentId?: string) => void
  onTogglePostPinned: (postId: string) => void
  onClearPostComments: (postId: string) => void
  onDeletePost: (postId: string) => void
  onJoin: () => void
  onOpenAdmin: (tab: AdminTab) => void
}) {
  const [draft, setDraft] = useState('')
  const [categoryId, setCategoryId] = useState(state.categories[0]?.id ?? '')
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [postConfirm, setPostConfirm] = useState<{ action: 'clear' | 'delete'; postId: string } | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [replyTarget, setReplyTarget] = useState<{ id: string; authorName: string } | null>(null)
  const visiblePosts = (activeCategory === 'all' ? state.posts : state.posts.filter((post) => post.categoryId === activeCategory))
    .filter((post) => matchesQuery(searchQuery, post.authorName, post.body, post.createdAt, state.categories.find((item) => item.id === post.categoryId)?.name))
  const selectedPost = state.posts.find((post) => post.id === selectedPostId) ?? null
  const selectedPostLiked = selectedPost ? state.likedPostIds.includes(selectedPost.id) : false
  const activeLevel = levelForPoints(state.currentMemberPoints, state.levelThresholds)
  const canPostByLevel = state.role === 'admin' || activeLevel >= state.accessSettings.postingLevel
  const canPost = state.role !== 'visitor' && canPostByLevel
  const writableCategories = state.role === 'admin' ? state.categories : state.categories.filter((category) => category.permission === 'members')
  const nextEvent = state.events[0]
  const isAdmin = state.role === 'admin'
  const closePostModal = () => {
    setSelectedPostId(null)
    setCommentDraft('')
    setReplyTarget(null)
  }
  const mentionMembers = state.members.filter((member) => member.status !== 'removed' && member.status !== 'banned')
  const mentionMatch = commentDraft.match(/(^|\s)[@＠]([^\s@＠]*)$/)
  const mentionQuery = mentionMatch?.[2].toLowerCase()
  const mentionOptions = mentionQuery === undefined
    ? []
    : mentionMembers.filter((member) => member.name.toLowerCase().includes(mentionQuery) || member.email.toLowerCase().includes(mentionQuery)).slice(0, 8)
  const insertMention = (name: string) => {
    setCommentDraft((current) => current.replace(/(^|\s)[@＠]([^\s@＠]*)$/, `$1${mentionLabel(name)} `))
  }
  const startReply = (comment: CommunityComment) => {
    setReplyTarget({ id: comment.id, authorName: comment.authorName })
    setCommentDraft((current) => current.trim() ? current : `${mentionLabel(comment.authorName)} `)
  }
  const confirmPostAction = () => {
    if (!postConfirm) return
    if (postConfirm.action === 'clear') onClearPostComments(postConfirm.postId)
    if (postConfirm.action === 'delete') {
      if (selectedPostId === postConfirm.postId) closePostModal()
      onDeletePost(postConfirm.postId)
    }
    setPostConfirm(null)
  }

  useEscapeKey(Boolean(selectedPost), closePostModal)
  useEscapeKey(Boolean(postConfirm), () => setPostConfirm(null))

  useEffect(() => {
    if (writableCategories.some((category) => category.id === categoryId)) return
    setCategoryId(writableCategories[0]?.id ?? '')
  }, [categoryId, writableCategories])

  return (
    <>
      <section className="hub-bento-grid aside-left">
        <GroupAside state={state} activePoints={state.currentMemberPoints} activeLevel={levelForPoints(state.currentMemberPoints, state.levelThresholds)} />
        <div className="feed-column">
          <SectionHeading eyebrow="Community" title="討論、公告與會員回饋">
            用分類整理討論，讓會員把問題、成果和回饋集中在一個安靜的工作流裡。
          </SectionHeading>
          <AdminFrontActions
            state={state}
            onOpenAdmin={onOpenAdmin}
            actions={[
              { label: 'Edit categories', tab: 'community' },
              { label: 'Edit access', tab: 'access' },
            ]}
          />
          {canPost ? (
            <form
              className="composer composer-card"
              onSubmit={(event) => {
                event.preventDefault()
                if (!draft.trim()) return
                onAddPost(draft.trim(), categoryId)
                setDraft('')
              }}
            >
              <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Share a win, question, or working note..." aria-label="Create community post" />
              <div className="form-row">
                <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} aria-label="Post category">
                  {writableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                <Button className="primary-button" type="submit" disabled={!draft.trim()}><Plus data-icon="inline-start" />Post</Button>
              </div>
            </form>
          ) : (
            <article className="locked-panel">
              <Lock size={18} />
              <div>
                <strong>Join to post and comment</strong>
                <p>{state.role === 'visitor' ? '訪客可以先看公開結構；免費加入後才能發文、留言與累積 points。' : `目前需要 Level ${state.accessSettings.postingLevel} 才能發文。`}</p>
              </div>
              <Button className="primary-button" type="button" onClick={onJoin}>免費加入</Button>
            </article>
          )}

          {nextEvent && (
            <a className="event-callout" href="#calendar" onClick={(event) => { event.preventDefault(); }}>
              <CalendarDays size={16} />
              <strong>{nextEvent.title}</strong>
              <span>is happening {nextEvent.date} · {nextEvent.time}</span>
            </a>
          )}

          <div className="category-tabs hub-chip-row" aria-label="Community categories">
            <button type="button" className={activeCategory === 'all' ? 'active' : ''} onClick={() => setActiveCategory('all')}>All</button>
            {state.categories.map((category) => (
              <button key={category.id} type="button" className={activeCategory === category.id ? 'active' : ''} onClick={() => setActiveCategory(category.id)}>
                {category.name}
              </button>
            ))}
          </div>

          <div className="post-list" aria-label="Community feed">
            {visiblePosts.length === 0 && <p className="empty-note">找不到符合搜尋條件的貼文。</p>}
            {visiblePosts.map((post) => {
              const category = state.categories.find((item) => item.id === post.categoryId)
              const postLiked = state.likedPostIds.includes(post.id)
              const commentsTotal = commentCount(post.comments)
              return (
                <article key={post.id} className="post-card">
                  <button className="post-open-button" type="button" onClick={() => setSelectedPostId(post.id)} aria-label={`Open post by ${post.authorName}`}>
                    <div className="post-card-header">
                      <div className="avatar">{post.authorName.slice(0, 1)}</div>
                      <div className="post-author-block">
                        <strong>{post.authorName}</strong>
                        <span className="mono">{post.createdAt}</span>
                      </div>
                      {post.pinned && <Badge variant="outline" className="status-badge">Pinned</Badge>}
                    </div>
                    <p className="post-preview-text">{post.body}</p>
                  </button>
                  <div className="post-actions">
                    <Badge variant="outline" className="status-badge">{category?.name ?? 'General'}</Badge>
                    <button
                      className={`post-like-button${postLiked ? ' liked' : ''}`}
                      type="button"
                      onClick={() => onLikePost(post.id)}
                      disabled={state.role === 'visitor' || postLiked}
                      aria-label={`${postLiked ? 'Liked' : 'Like'} post, ${post.likes} likes`}
                    >
                      <Heart size={16} aria-hidden="true" />
                      <span>{post.likes}</span>
                    </button>
                    <button className="post-comment-button" type="button" onClick={() => setSelectedPostId(post.id)} aria-label={`${commentsTotal} comments`} title={`${commentsTotal} comments`}>
                      <MessageSquareText size={16} aria-hidden="true" />
                      <span>{commentsTotal}</span>
                    </button>
                    {isAdmin && (
                      <span className="post-admin-actions" aria-label="Post admin actions">
                        <Button variant="outline" className="post-icon-button" type="button" onClick={() => onTogglePostPinned(post.id)} aria-label={post.pinned ? 'Unpin' : 'Pin'} title={post.pinned ? 'Unpin' : 'Pin'}>
                          {post.pinned ? <PinOff size={16} aria-hidden="true" /> : <Pin size={16} aria-hidden="true" />}
                        </Button>
                        <Button variant="outline" className="post-icon-button" type="button" onClick={() => setPostConfirm({ action: 'clear', postId: post.id })} aria-label="Clear comments" title="Clear comments">
                          <MessageSquareX size={16} aria-hidden="true" />
                        </Button>
                        <Button variant="outline" className="post-icon-button danger-button" type="button" onClick={() => setPostConfirm({ action: 'delete', postId: post.id })} aria-label="Delete post" title="Delete post">
                          <Trash2 size={16} aria-hidden="true" />
                        </Button>
                      </span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {selectedPost && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePostModal()
          }}
        >
          <article className="post-modal" role="dialog" aria-modal="true" aria-label="貼文完整內容">
            <button className="modal-close" type="button" onClick={closePostModal} aria-label="關閉貼文">×</button>
            <div className="post-card-header">
              <div className="avatar">{selectedPost.authorName.slice(0, 1)}</div>
              <div className="post-author-block">
                <strong>{selectedPost.authorName}</strong>
                <span className="mono">{selectedPost.createdAt}</span>
              </div>
            </div>
            <p className="post-modal-body">{selectedPost.body}</p>
            <div className="post-actions post-modal-actions">
              <button
                className={`post-like-button${selectedPostLiked ? ' liked' : ''}`}
                type="button"
                onClick={() => onLikePost(selectedPost.id)}
                disabled={state.role === 'visitor' || selectedPostLiked}
                aria-label={`${selectedPostLiked ? 'Liked' : 'Like'} post, ${selectedPost.likes} likes`}
              >
                <Heart size={16} aria-hidden="true" />
                <span>{selectedPost.likes}</span>
              </button>
              <span className="post-comment-button" aria-label={`${commentCount(selectedPost.comments)} comments`} title={`${commentCount(selectedPost.comments)} comments`}>
                <MessageSquareText size={16} aria-hidden="true" />
                <span>{commentCount(selectedPost.comments)}</span>
              </span>
              {isAdmin && (
                <span className="post-admin-actions" aria-label="Post admin actions">
                  <Button variant="outline" className="post-icon-button" type="button" onClick={() => onTogglePostPinned(selectedPost.id)} aria-label={selectedPost.pinned ? 'Unpin' : 'Pin'} title={selectedPost.pinned ? 'Unpin' : 'Pin'}>
                    {selectedPost.pinned ? <PinOff size={16} aria-hidden="true" /> : <Pin size={16} aria-hidden="true" />}
                  </Button>
                  <Button variant="outline" className="post-icon-button" type="button" onClick={() => setPostConfirm({ action: 'clear', postId: selectedPost.id })} aria-label="Clear comments" title="Clear comments">
                    <MessageSquareX size={16} aria-hidden="true" />
                  </Button>
                  <Button variant="outline" className="post-icon-button danger-button" type="button" onClick={() => setPostConfirm({ action: 'delete', postId: selectedPost.id })} aria-label="Delete post" title="Delete post">
                    <Trash2 size={16} aria-hidden="true" />
                  </Button>
                </span>
              )}
            </div>
            <div className="comment-list" aria-label="Comments">
              {selectedPost.comments.map((comment) => {
                const renderComment = (item: CommunityComment, depth = 0): React.ReactNode => {
                  const liked = state.likedCommentIds.includes(item.id)
                  return (
                    <div className={`comment-item${depth ? ' comment-reply' : ''}`} key={item.id}>
                      <div className="comment-body">
                        <div className="comment-head">
                          <strong>{item.authorName}</strong>
                          <span className="mono">{item.createdAt}</span>
                        </div>
                        <p>{renderMentionText(item.body)}</p>
                        <div className="comment-actions">
                          <button
                            className={`comment-like-button${liked ? ' liked' : ''}`}
                            type="button"
                            onClick={() => onLikeComment(item.id)}
                            disabled={state.role === 'visitor' || liked}
                            aria-label={`${liked ? 'Liked' : 'Like'} comment, ${item.likes} likes`}
                            title={`${item.likes} likes`}
                          >
                            <Heart size={15} aria-hidden="true" />
                            <span>{item.likes}</span>
                          </button>
                          {canPost && (
                            <button className="comment-reply-button" type="button" onClick={() => startReply(item)} aria-label="Reply" title="Reply">
                              <MessageCircle size={15} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>
                      {item.replies.length > 0 && <div className="comment-replies">{item.replies.map((reply) => renderComment(reply, depth + 1))}</div>}
                    </div>
                  )
                }
                return renderComment(comment)
              })}
            </div>
            {canPost && (
              <form className="comment-form" onSubmit={(event) => {
                event.preventDefault()
                const nextComment = commentDraft.trim()
                if (!nextComment) return
                onAddComment(selectedPost.id, nextComment, replyTarget?.id)
                setCommentDraft('')
                setReplyTarget(null)
              }}>
                {replyTarget && (
                  <div className="reply-context">
                    <span>Replying to {replyTarget.authorName}</span>
                    <button type="button" onClick={() => { setReplyTarget(null); setCommentDraft('') }}>Cancel</button>
                  </div>
                )}
                <div className="comment-form-row">
                  <div className="comment-input-wrap">
                    <Input aria-label="Add comment" value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder={replyTarget ? `Reply to ${replyTarget.authorName}...` : 'Write a comment...'} />
                    {mentionOptions.length > 0 && (
                      <div className="mention-menu" aria-label="Mention suggestions">
                        {mentionOptions.map((member) => (
                          <button key={member.id} type="button" onClick={() => insertMention(member.name)}>
                            <strong>{member.name}</strong>
                            <span>{member.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button className="primary-button" type="submit" disabled={!commentDraft.trim()}>{replyTarget ? 'Reply' : 'Comment'}</Button>
                </div>
              </form>
            )}
          </article>
        </div>
      )}
      {postConfirm && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPostConfirm(null)
          }}
        >
          <div className="settings-modal" role="dialog" aria-modal="true" aria-label={postConfirm.action === 'clear' ? '確認清除留言' : '確認刪除貼文'}>
            <button className="modal-close" type="button" onClick={() => setPostConfirm(null)} aria-label="關閉確認視窗">×</button>
            <SectionHeading eyebrow="Confirm" title={postConfirm.action === 'clear' ? '確認清除留言' : '確認刪除貼文'}>
              {postConfirm.action === 'clear' ? '這會移除這篇貼文目前所有留言。' : '這會移除這篇貼文，且無法在本機預覽中還原。'}
            </SectionHeading>
            <div className="button-stack">
              <Button variant="outline" className="secondary-button" type="button" onClick={() => setPostConfirm(null)}>Cancel</Button>
              <Button variant="outline" className="secondary-button danger-button" type="button" onClick={confirmPostAction}>{postConfirm.action === 'clear' ? 'Clear comments' : 'Delete post'}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function GroupAside({ state, activePoints, activeLevel }: { state: AppState; activePoints: number; activeLevel: number }) {
  const ranked = [
    ...(state.role !== 'visitor' ? [{ id: 'current', name: 'You', role: 'member' as const, points: activePoints, level: activeLevel }] : []),
    ...state.members.filter((member) => member.status !== 'removed' && member.status !== 'banned' && !['owner', 'billing', 'admin'].includes(member.role)),
  ].sort((a, b) => b.points - a.points).slice(0, 3)

  return (
    <aside className="side-stack hub-rail">
      <article className="group-card hub-group-card">
        <div className="cover-box stock-cover" style={stockCoverStyle(state.group.coverImageUrl?.trim() || fallbackCoverImage)} />
        <strong>{state.group.name}</strong>
        <small className="mono">{state.group.slug}.community</small>
        <p>{state.group.description}</p>
        <div className="group-stats">
          <Metric label="Members" value={`${state.members.length}`} />
          <Metric label="Online" value={state.group.onlineLabel.replace(' online', '')} />
          <Metric label="Admins" value="1" />
        </div>
      </article>
      <article className="span-2">
        <SectionHeading eyebrow="Leaderboard" title="Leaderboard (30-day)" />
        <div className="mini-rank-list">
          {ranked.map((member, index) => (
            <div key={member.id}>
              <span className="rank-medal">{index + 1}</span>
              <strong>{member.name}</strong>
              <span className="mono">{member.points}</span>
            </div>
          ))}
        </div>
      </article>
    </aside>
  )
}

function ClassroomView({
  state,
  activeLevel,
  searchQuery,
  onTogglePage,
  onJoin,
  onOpenAdmin,
}: {
  state: AppState
  activeLevel: number
  searchQuery: string
  onTogglePage: (pageId: string) => void
  onJoin: () => void
  onOpenAdmin: (tab: AdminTab) => void
}) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [lockedCourse, setLockedCourse] = useState<ClassroomCourse | null>(null)
  const selectedCourse = state.courses.find((course) => course.id === selectedCourseId)
  const selectedPage = selectedCourse?.pages.find((page) => page.id === selectedPageId) ?? selectedCourse?.pages[0]
  const visibleCourses = state.courses.filter((course) => matchesQuery(searchQuery, course.title, course.description, accessLabel(course.accessMode), course.pages.map((page) => page.title).join(' ')))
  const isCourseLocked = (course: ClassroomCourse) => {
    if (state.role === 'admin') return false
    return state.role === 'visitor' || (course.accessMode === 'level-unlock' && activeLevel < (course.requiredLevel ?? 1)) || course.accessMode === 'private'
  }
  const lockReason = (course: ClassroomCourse) => {
    if (state.role === 'visitor') return '你還不是社群會員，加入後才能查看 Classroom 內容。'
    if (course.accessMode === 'level-unlock') return `這堂課需要 Level ${course.requiredLevel ?? 1}，你目前是 Level ${activeLevel}。`
    if (course.accessMode === 'private') return '這是私人或 Beta 課程，需要管理員手動授權後才能查看。'
    return '這堂課目前尚未開放。'
  }
  const openCourse = (course: ClassroomCourse) => {
    if (isCourseLocked(course)) {
      setLockedCourse(course)
      return
    }
    setSelectedCourseId(course.id)
    setSelectedPageId(course.pages[0]?.id ?? null)
  }
  useEscapeKey(Boolean(lockedCourse), () => setLockedCourse(null))

  if (selectedCourse && selectedPage) {
    const completedCount = selectedCourse.pages.filter((page) => state.completedPageIds.includes(page.id)).length
    const progress = selectedCourse.pages.length ? Math.round((completedCount / selectedCourse.pages.length) * 100) : 0
    const selectedComplete = state.completedPageIds.includes(selectedPage.id)

    return (
      <section>
        <div className="course-detail-actions">
          <Button className="ghost-button" type="button" onClick={() => setSelectedCourseId(null)}>Back to Classroom</Button>
        </div>
        <div className="course-detail-layout">
          <aside className="course-outline">
            <div className="course-progress-head">
              <strong>{selectedCourse.title}</strong>
              <small className="mono">{progress}%</small>
            </div>
            <div className="progress-track" aria-label="Course progress"><span style={{ width: `${progress}%` }} /></div>
            <div className="lesson-list">
              {selectedCourse.pages.map((page) => {
                const complete = state.completedPageIds.includes(page.id)
                return (
                  <button key={page.id} type="button" className={`${complete ? 'complete ' : ''}${selectedPage.id === page.id ? 'active' : ''}`} onClick={() => setSelectedPageId(page.id)}>
                    <span>{complete ? <CheckCircle2 size={16} /> : <FileText size={16} />}</span>
                    <span>
                      <strong>{page.title}</strong>
                      <small>{page.minutes}m</small>
                    </span>
                  </button>
                )
              })}
            </div>
          </aside>

          <div className="course-reader-stack">
            <article className="course-reader">
              <div className="course-reader-head">
                <h2>{selectedPage.title}</h2>
                <button className={`course-complete-toggle${selectedComplete ? ' complete' : ''}`} type="button" onClick={() => onTogglePage(selectedPage.id)} aria-label={selectedComplete ? '標記未完成' : '標記完成'}>
                  <CheckCircle2 size={20} />
                </button>
              </div>
              <div className="course-body rich-text-output-block" dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(selectedPage.body) }} />
            </article>
            {selectedPage.resources.length > 0 && (
              <section className="course-attachments" aria-label="Lesson attachments">
                <strong>Attachments</strong>
                <div className="course-resource-list">
                  {selectedPage.resources.map((resource) => (
                    <a key={resource} href={attachmentDownloadHref(resource)} download={attachmentDownloadName(resource)}>
                      <CheckCircle2 size={15} aria-hidden="true" />
                      <span>{resource}</span>
                      <Download size={15} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section>
        <SectionHeading eyebrow="Classroom" title="課程、頁面、資源與逐字稿">
          Classroom 用來組織 guides、instructions、courses、resources 和 templates。這裡只模擬權限與完成狀態。
        </SectionHeading>
        <AdminFrontActions
          state={state}
          onOpenAdmin={onOpenAdmin}
          actions={[{ label: 'Manage classroom', tab: 'classroom' }]}
        />
        <div className="course-grid">
          {visibleCourses.length === 0 && <p className="empty-note">找不到符合搜尋條件的課程。</p>}
          {visibleCourses.map((course, index) => {
            const locked = isCourseLocked(course)
            return (
              <article
                key={course.id}
                className={`course-card clickable${course.published ? '' : ' draft'}${locked ? ' locked' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => openCourse(course)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return
                  event.preventDefault()
                  openCourse(course)
                }}
              >
                <div className={`course-cover tone-${(index % 4) + 1} stock-cover`} style={stockCoverStyle(courseCoverImages[index % courseCoverImages.length])} />
                <div className="course-head">
                  <div>
                    <Badge variant="outline" className="status-badge">{accessLabel(course.accessMode)}</Badge>
                    {!course.published && <Badge variant="outline" className="status-badge">Draft</Badge>}
                    {course.requiredLevel && <Badge variant="outline" className="status-badge">Level {course.requiredLevel}</Badge>}
                  </div>
                  {locked && <Lock size={18} />}
                </div>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                {course.price && <strong className="mono">{course.price}</strong>}
                {course.unlockAfterDays && <small className="mono">Unlock after {course.unlockAfterDays} days</small>}
              </article>
            )
          })}
        </div>
      </section>

      {lockedCourse && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLockedCourse(null)
          }}
        >
          <article className="course-lock-modal" role="dialog" aria-modal="true" aria-label="課程無法查看原因">
            <button className="modal-close" type="button" onClick={() => setLockedCourse(null)} aria-label="關閉課程鎖定說明">×</button>
            <SectionHeading eyebrow="Locked" title={`目前無法查看 ${lockedCourse.title}`}>
              {lockReason(lockedCourse)}
            </SectionHeading>
            <div className="button-row">
              {state.role === 'visitor' && <Button className="primary-button" type="button" onClick={onJoin}>免費加入</Button>}
              <Button variant="outline" className="secondary-button" type="button" onClick={() => setLockedCourse(null)}>知道了</Button>
            </div>
          </article>
        </div>
      )}
    </>
  )
}

function CalendarView({ state, activeLevel, searchQuery, onAddEvent, onOpenAdmin }: { state: AppState; activeLevel: number; searchQuery: string; onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void; onOpenAdmin: (tab: AdminTab) => void }) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [calendarProviderEvent, setCalendarProviderEvent] = useState<CalendarEvent | null>(null)
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [draft, setDraft] = useState<Omit<CalendarEvent, 'id'>>({
    title: '',
    date: '2026-07-10',
    time: '20:00',
    duration: '60m',
    timezone: 'Asia/Taipei',
    location: 'MemberHub Call',
    recurrence: 'none',
    accessMode: 'all',
    description: '',
  })
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const calendarYear = calendarMonth.getFullYear()
  const calendarMonthIndex = calendarMonth.getMonth()
  const calendarMonthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(calendarMonth)
  const calendarMonthPrefix = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}`
  const daysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate()
  const leadingDays = (new Date(calendarYear, calendarMonthIndex, 1).getDay() + 6) % 7
  const calendarCellCount = Math.ceil((leadingDays + daysInMonth) / 7) * 7
  const calendarCells = Array.from({ length: calendarCellCount }, (_, index) => {
    const day = index - leadingDays + 1
    return day > 0 && day <= daysInMonth ? day : null
  })
  const today = new Date()
  const visibleEvents = state.events.filter((event) => matchesQuery(searchQuery, event.title, event.description, event.date, event.time, event.location, event.timezone))
  const closeEventModal = () => {
    setSelectedEvent(null)
    setCalendarProviderEvent(null)
  }
  const goToCurrentMonth = () => setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1))
  const changeMonth = (offset: number) => setCalendarMonth((date) => new Date(date.getFullYear(), date.getMonth() + offset, 1))
  const eventLocked = (event: CalendarEvent) => state.role === 'visitor' || (event.accessMode === 'level' && activeLevel < (event.requiredLevel ?? 1))
  const eventLockReason = (event: CalendarEvent) => state.role === 'visitor'
    ? '加入社群後才能新增活動到行事曆。'
    : `這個活動需要 Level ${event.requiredLevel ?? 1}，你目前是 Level ${activeLevel}。`
  useEscapeKey(addEventOpen, () => setAddEventOpen(false))
  useEscapeKey(Boolean(selectedEvent), closeEventModal)
  useEscapeKey(Boolean(calendarProviderEvent), () => setCalendarProviderEvent(null))

  return (
    <>
      <section className="page-grid">
        <article className="span-3">
          <div className="section-heading-row">
            <SectionHeading eyebrow="Calendar" title="活動、直播與回放排程">
              管理 live、office hour、workshop 和 recurring events。第一版只做本機 demo。
            </SectionHeading>
            {state.role === 'admin' && (
              <Button className="primary-button" type="button" onClick={() => setAddEventOpen(true)}>
                <Plus data-icon="inline-start" size={18} aria-hidden="true" />
                Add event
              </Button>
            )}
          </div>
          <AdminFrontActions
            state={state}
            onOpenAdmin={onOpenAdmin}
            actions={[{ label: 'Manage events', tab: 'calendar' }]}
          />
          <div className="calendar-board">
            <div className="calendar-head">
              <div className="calendar-month-controls">
                <Button variant="outline" className="icon-button ghost-button" type="button" onClick={() => changeMonth(-1)} aria-label="Previous month">
                  <ChevronRight className="flip-icon" size={16} aria-hidden="true" />
                </Button>
                <Button variant="outline" className="ghost-button" type="button" onClick={goToCurrentMonth}>Today</Button>
                <Button variant="outline" className="icon-button ghost-button" type="button" onClick={() => changeMonth(1)} aria-label="Next month">
                  <ChevronRight size={16} aria-hidden="true" />
                </Button>
              </div>
              <div>
                <strong>{calendarMonthLabel}</strong>
                <small>Asia/Taipei</small>
              </div>
            </div>
            <div className="calendar-weekdays">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <strong key={day}>{day}</strong>)}
            </div>
            <div className="calendar-grid">
              {calendarCells.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="calendar-empty-cell" aria-hidden="true" />
                const dayEvents = visibleEvents.filter((event) => event.date === `${calendarMonthPrefix}-${String(day).padStart(2, '0')}`)
                const isToday = calendarYear === today.getFullYear() && calendarMonthIndex === today.getMonth() && day === today.getDate()
                return (
                  <div key={day} className={isToday ? 'today' : ''}>
                    <span>{day}</span>
                    {dayEvents.map((event) => (
                      <button key={event.id} className="calendar-event-button" type="button" onClick={() => setSelectedEvent(event)}>
                        {event.time} · {event.title}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="event-list">
            {visibleEvents.length === 0 && <p className="empty-note">找不到符合搜尋條件的活動。</p>}
            {visibleEvents.map((event) => (
              <article key={event.id} className="event-card">
                <div className="date-box">
                  <strong>{event.date.slice(5)}</strong>
                  <small>{event.time}</small>
                </div>
                <div className="event-card-main">
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                  <div className="event-meta">
                    <span className="mono">{event.duration}</span>
                    <span className="mono">{event.timezone}</span>
                    <Badge variant="outline" className="status-badge">{event.location}</Badge>
                    <Badge variant="outline" className="status-badge">{event.recurrence}</Badge>
                    <Badge variant="outline" className="status-badge">{eventAccessLabel(event, state)}</Badge>
                  </div>
                </div>
                <div className="event-card-actions">
                  <EventCalendarAction event={event} onOpen={setCalendarProviderEvent} />
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      {addEventOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAddEventOpen(false)
          }}
        >
          <div className="event-modal" role="dialog" aria-modal="true" aria-label="新增活動">
            <button className="modal-close" type="button" onClick={() => setAddEventOpen(false)} aria-label="關閉新增活動">×</button>
            <SectionHeading eyebrow="Add event" title="新增活動">
              設定活動時間、地點與可見權限。
            </SectionHeading>
            <EventForm state={state} draft={draft} setDraft={setDraft} onAddEvent={onAddEvent} onDone={() => setAddEventOpen(false)} />
          </div>
        </div>
      )}

      {selectedEvent && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEventModal()
          }}
        >
          <div className="event-modal" role="dialog" aria-modal="true" aria-label="活動詳細資訊">
            <button className="modal-close" type="button" onClick={closeEventModal} aria-label="關閉活動詳細資訊">×</button>
            <article className="event-detail-card">
              <SectionHeading eyebrow="Event detail" title={selectedEvent.title}>
                {selectedEvent.description}
              </SectionHeading>
              <div className="event-detail-meta">
                <div><span>Date</span><strong>{selectedEvent.date}</strong></div>
                <div><span>Time</span><strong>{selectedEvent.time}</strong></div>
                <div><span>Duration</span><strong>{selectedEvent.duration}</strong></div>
                <div><span>Timezone</span><strong>{selectedEvent.timezone}</strong></div>
                <div><span>Access</span><strong>{eventAccessLabel(selectedEvent, state)}</strong></div>
              </div>
              <div className="event-meta">
                <Badge variant="outline" className="status-badge">{selectedEvent.location}</Badge>
                <Badge variant="outline" className="status-badge">{selectedEvent.recurrence}</Badge>
                <Badge variant="outline" className="status-badge">{eventAccessLabel(selectedEvent, state)}</Badge>
              </div>
              <div className="add-calendar-menu">
                {isEventExpired(selectedEvent) ? (
                  <button className="event-calendar-disabled" type="button" disabled>Event ended</button>
                ) : eventLocked(selectedEvent) ? (
                  <article className="locked-panel inline-locked-panel"><Lock size={18} /><p>{eventLockReason(selectedEvent)}</p></article>
                ) : (
                  <>
                    <button className="add-calendar-button" type="button" onClick={() => setCalendarProviderEvent(selectedEvent)}>
                      <CalendarDays size={18} aria-hidden="true" />
                      <span>Add to calendar</span>
                    </button>
                  </>
                )}
              </div>
            </article>
          </div>
        </div>
      )}
      {calendarProviderEvent && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCalendarProviderEvent(null)
          }}
        >
          <div className="settings-modal calendar-provider-modal" role="dialog" aria-modal="true" aria-label="選擇行事曆">
            <button className="modal-close" type="button" onClick={() => setCalendarProviderEvent(null)} aria-label="關閉行事曆選擇">×</button>
            <SectionHeading eyebrow="Add to calendar" title={calendarProviderEvent.title}>
              選擇要新增到哪個行事曆服務。
            </SectionHeading>
            <CalendarProviderLinks event={calendarProviderEvent} onSelect={() => setCalendarProviderEvent(null)} />
          </div>
        </div>
      )}
    </>
  )
}

function EventForm({
  state,
  draft,
  setDraft,
  onAddEvent,
  onDone,
}: {
  state: AppState
  draft: Omit<CalendarEvent, 'id'>
  setDraft: (draft: Omit<CalendarEvent, 'id'>) => void
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void
  onDone?: () => void
}) {
  return (
    <form
      className="settings-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (!draft.title.trim()) return
        onAddEvent(draft)
        setDraft({ ...draft, title: '', description: '' })
        onDone?.()
      }}
    >
      <label>Title<Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
      <div className="two-col">
        <label>Date<Input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label>
        <label>Time<Input type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} /></label>
      </div>
      <div className="two-col">
        <label>Duration<Input value={draft.duration} onChange={(event) => setDraft({ ...draft, duration: event.target.value })} /></label>
        <label>Timezone<Input value={draft.timezone} onChange={(event) => setDraft({ ...draft, timezone: event.target.value })} /></label>
      </div>
      <label>Location<select value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value as CalendarEvent['location'] })}>
        <option>MemberHub Call</option>
        <option>Zoom</option>
        <option>Meet</option>
        <option>Address</option>
      </select></label>
      <label>Recurrence<select value={draft.recurrence} onChange={(event) => setDraft({ ...draft, recurrence: event.target.value as CalendarEvent['recurrence'] })}>
        <option value="none">none</option>
        <option value="weekly">weekly</option>
        <option value="monthly">monthly</option>
      </select></label>
      <label>Access<select aria-label="Event access" value={draft.accessMode ?? 'all'} onChange={(event) => setDraft({ ...draft, accessMode: event.target.value as CalendarEvent['accessMode'] })}>
        <option value="all">All members</option>
        <option value="level">Members on/above level</option>
        <option value="plan">Members on/above plan</option>
        <option value="course">Members in course</option>
      </select></label>
      {draft.accessMode === 'level' && (
        <label>Required level<Input aria-label="Required level" type="number" min={1} max={9} value={draft.requiredLevel ?? 2} onChange={(event) => setDraft({ ...draft, requiredLevel: Number(event.target.value) })} /></label>
      )}
      {draft.accessMode === 'plan' && (
        <label>Required plan<select aria-label="Required plan" value={draft.requiredPlanId ?? state.plans[0]?.id} onChange={(event) => setDraft({ ...draft, requiredPlanId: event.target.value as Plan['id'] })}>
          {state.plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
        </select></label>
      )}
      {draft.accessMode === 'course' && (
        <label>Required course<select aria-label="Required course" value={draft.courseId ?? state.courses[0]?.id} onChange={(event) => setDraft({ ...draft, courseId: event.target.value })}>
          {state.courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
        </select></label>
      )}
      <label>Description<Textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
      <Button className="primary-button" type="submit">Save event</Button>
    </form>
  )
}

function MembersView({ state, activePoints, activeLevel, searchQuery, onOpenAdmin }: { state: AppState; activePoints: number; activeLevel: number; searchQuery: string; onOpenAdmin: (tab: AdminTab) => void }) {
  const [filter, setFilter] = useState<'members' | 'admins' | 'online'>('members')
  const currentMember: Member & { avatarUrl?: string } = {
    id: 'current',
    name: state.profileName.trim() || 'You',
    email: state.profileEmail.trim() || 'you@example.test',
    role: state.role === 'admin' ? 'admin' : 'member',
    planId: state.selectedPlanId,
    level: activeLevel,
    points: activePoints,
    joinedAt: 'Today',
    posts: state.posts.filter((post) => post.authorId === 'current').length,
    comments: 0,
    avatarUrl: state.profileAvatarUrl,
  }
  const activeSavedMembers = state.members.filter((member) => member.status !== 'removed' && member.status !== 'banned')
  const members: Array<Member & { avatarUrl?: string }> = state.role === 'visitor' ? activeSavedMembers : [currentMember, ...activeSavedMembers]
  const admins = members.filter((member) => member.role === 'owner' || member.role === 'admin')
  const onlineCount = Number.parseInt(state.group.onlineLabel, 10) || 0
  const onlineMembers = members.slice(0, onlineCount)
  const onlineMemberIds = new Set(onlineMembers.map((member) => member.id))
  const visibleMembers = (filter === 'admins' ? admins : filter === 'online' ? onlineMembers : members)
    .filter((member) => matchesQuery(searchQuery, member.name, member.email, member.role, planLabel(member.planId), member.status))
  return (
    <section className="hub-bento-grid aside-left">
      <GroupAside state={state} activePoints={activePoints} activeLevel={activeLevel} />
      <div className="feed-column">
        <AdminFrontActions
          state={state}
          onOpenAdmin={onOpenAdmin}
          actions={[
            { label: 'Manage members', tab: 'members' },
            { label: 'Edit roles', tab: 'members' },
          ]}
        />
        <div className="member-filter-row">
          <button className={filter === 'members' ? 'active' : ''} type="button" onClick={() => setFilter('members')}>Members {members.length}</button>
          <button className={filter === 'admins' ? 'active' : ''} type="button" onClick={() => setFilter('admins')}>Admins {admins.length}</button>
          <button className={filter === 'online' ? 'active' : ''} type="button" onClick={() => setFilter('online')}>Online {onlineMembers.length}</button>
          <Button className="primary-button" type="button"><UserPlus data-icon="inline-start" />Invite</Button>
        </div>
        <div className="member-list">
          {visibleMembers.length === 0 && <p className="empty-note">找不到符合搜尋條件的會員。</p>}
          {visibleMembers.map((member) => (
            <article key={member.id} className="member-card member-row">
              <ProfileAvatar name={member.name} url={member.avatarUrl} />
              <div>
                <h3>{member.name}</h3>
                <small>{member.email}</small>
                <p>{member.posts} posts · {member.comments} comments · {planLabel(member.planId)}</p>
                <div className="member-meta">
                  {onlineMemberIds.has(member.id) && <><span className="online-dot" /> <span>Online now</span></>}
                  <span className="mono">Joined {member.joinedAt}</span>
                  <Badge variant="outline" className="status-badge">Level {levelForPoints(member.points, state.levelThresholds)}</Badge>
                  <span className="mono">{member.points} pts</span>
                </div>
              </div>
              <Button variant="outline" className="secondary-button" type="button" disabled={member.chatBlocked || activeLevel < state.accessSettings.chatLevel}>Chat</Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function LeaderboardView({ state, activePoints, activeLevel, onOpenAdmin }: { state: AppState; activePoints: number; activeLevel: number; onOpenAdmin: (tab: AdminTab) => void }) {
  const ranked = [
    ...(state.role !== 'visitor' ? [{ id: 'current', name: state.profileName.trim() || 'You', role: 'member' as const, points: activePoints, level: activeLevel, avatarUrl: state.profileAvatarUrl }] : []),
    ...state.members.filter((member) => member.status !== 'removed' && member.status !== 'banned' && !['owner', 'billing', 'admin'].includes(member.role)),
  ].sort((a, b) => b.points - a.points)
  const nextPoints = nextLevelPoints(activePoints, state.levelThresholds)
  const progress = nextPoints == null ? 100 : Math.min(100, (activePoints / nextPoints) * 100)

  return (
    <section className="page-grid">
      <article className="span-3">
        <SectionHeading eyebrow="Leaderboard" title="Points, levels, and unlocks">
          分數來源以貼文/留言被讚為核心。管理者、billing manager 與 owner 不列入排行榜。
        </SectionHeading>
        <AdminFrontActions
          state={state}
          onOpenAdmin={onOpenAdmin}
          actions={[
            { label: 'Edit roles', tab: 'members' },
            { label: 'Edit access', tab: 'access' },
          ]}
        />
        <div className="leaderboard-hero">
          <div className="profile-level">
            <ProfileAvatar name={state.profileName} url={state.profileAvatarUrl} className="level-avatar" />
            <h3>{state.profileName.trim() || 'You'}</h3>
            <p>Level {activeLevel}</p>
            <small className="mono">{activePoints} pts · {nextPoints ? `${Math.max(0, nextPoints - activePoints)} points to level up` : 'Top level reached'}</small>
          </div>
          <div className="level-thresholds">
            {state.levelThresholds.map((threshold, index) => {
              const level = index + 1
              return (
                <div key={threshold} className={activePoints >= threshold ? 'unlocked' : ''}>
                  <span className="rank-medal">{level}</span>
                  <strong>Level {level}</strong>
                  <small>{index === 0 ? '0 points' : `${threshold} points`}</small>
                  <ul className="level-benefit-list">
                    {benefitsForLevel(state, level).map((benefit) => <li key={benefit}>{benefit}</li>)}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
        <small className="mono">Last updated: Jun 24th 2026 02:30am</small>
        <div className="leaderboard-grid">
          {['Leaderboard (7-day)', 'Leaderboard (30-day)', 'Leaderboard (all-time)'].map((title) => (
            <article key={title}>
              <h3>{title}</h3>
              <div className="leaderboard-list">
                {ranked.slice(0, 5).map((member, index) => (
                  <div key={`${title}-${member.id}`}>
                    <span className="rank-medal">{index + 1}</span>
                    <ProfileAvatar name={member.name} url={'avatarUrl' in member ? member.avatarUrl : undefined} className="leaderboard-avatar" />
                    <strong>{member.id === 'current' ? 'Current member' : member.name}</strong>
                    <span className="mono">{index === 0 && title.includes('all-time') ? member.points.toLocaleString() : `+${Math.max(1, Math.round(member.points / 10))}`}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  )
}

function AccountView({
  state,
  updateState,
  currentPlan,
  activeLevel,
  activePoints,
}: {
  state: AppState
  updateState: (patch: Partial<AppState>, notice?: string) => void
  currentPlan: Plan
  activeLevel: number
  activePoints: number
}) {
  const [avatarMessage, setAvatarMessage] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const paidPlans = state.plans.filter((plan) => plan.id !== 'free')
  const changePlan = paidPlans.find((plan) => plan.id !== currentPlan.id) ?? (currentPlan.id === 'free' ? paidPlans[0] : undefined)
  const billingMethod = currentPlan.id === 'free' ? '無扣款' : '外部付款服務'
  const billingCycle = currentPlan.id === 'free' ? '不扣款' : currentPlan.id === 'monthly' ? '每月循環扣款' : currentPlan.cadence
  const updateNotifications = (patch: Partial<AppState['notificationSettings']>) => updateState({
    notificationSettings: { ...state.notificationSettings, ...patch },
  })
  const updateEmail = (value: string) => updateState({
    profileEmail: value,
    ...(state.role === 'admin' ? { adminEmail: value.trim().toLowerCase() } : {}),
  })
  const changePassword = (event: FormEvent) => {
    event.preventDefault()
    setPasswordMessage('')
    if (newPassword.length < 8) {
      setPasswordMessage('新密碼至少需要 8 位數。')
      return
    }
    if (state.role === 'admin') {
      if (currentPassword !== state.adminPassword) {
        setPasswordMessage('目前密碼不正確。')
        return
      }
      updateState({ adminPassword: newPassword }, '管理員密碼已更新。')
      setCurrentPassword('')
      setNewPassword('')
      setPasswordMessage('管理員密碼已更新。')
      return
    }
    setPasswordMessage('本機 demo 不保存會員密碼；正式站請串接你選擇的 Auth provider 變更密碼流程。')
  }
  const uploadAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAvatarMessage('請上傳圖片檔。')
      return
    }
    if (file.size > 1_500_000) {
      setAvatarMessage('圖片請小於 1.5MB，避免本地預覽資料過大。')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      updateState({ profileAvatarUrl: reader.result })
      setAvatarMessage('頭貼已更新。')
    }
    reader.onerror = () => setAvatarMessage('頭貼讀取失敗，請換一張圖片。')
    reader.readAsDataURL(file)
  }

  return (
    <section className="page-grid">
      <article className="span-2 account-profile-card">
        <SectionHeading eyebrow="Account" title="Account settings">
          管理頭貼、顯示名稱、登入信箱與通知偏好。
        </SectionHeading>
        <div className="account-settings-grid">
          <div className="avatar-upload-stack">
            <label className="avatar-upload-control">
              <ProfileAvatar name={state.profileName} url={state.profileAvatarUrl} className="account-avatar-preview" />
              <Input aria-label="Avatar upload" type="file" accept="image/*" onChange={uploadAvatar} />
              <span className="avatar-upload-overlay" aria-hidden="true">
                <Upload size={22} />
              </span>
            </label>
            {avatarMessage && <p className="form-helper">{avatarMessage}</p>}
          </div>
          <div className="settings-form">
            <div className="two-col account-identity-row">
              <label>Display name<Input aria-label="Display name" value={state.profileName} onChange={(event) => updateState({ profileName: event.target.value })} /></label>
              <label>Account email<Input aria-label="Account email" type="email" value={state.profileEmail} onChange={(event) => updateEmail(event.target.value)} /></label>
            </div>
            <div className="account-notification-panel">
              <strong>Notifications</strong>
              <label className="switch-row">
                <input type="checkbox" checked={state.notificationSettings.emailEnabled} onChange={(event) => updateNotifications({ emailEnabled: event.target.checked })} />
                <span>Receive email reminders</span>
              </label>
              <label>Notification scope<select aria-label="Notification scope" value={state.notificationSettings.scope} onChange={(event) => updateNotifications({ scope: event.target.value as AppState['notificationSettings']['scope'] })}>
                <option value="all">全接收</option>
                <option value="selected">只接收指定類型</option>
              </select></label>
              {state.notificationSettings.scope === 'selected' && (
                <div className="notification-category-list">
                  <label className="switch-row">
                    <input type="checkbox" checked={state.notificationSettings.adminPosts} onChange={(event) => updateNotifications({ adminPosts: event.target.checked })} />
                    <span>管理員發文</span>
                  </label>
                  <label className="switch-row">
                    <input type="checkbox" checked={state.notificationSettings.courses} onChange={(event) => updateNotifications({ courses: event.target.checked })} />
                    <span>發課程</span>
                  </label>
                  <label className="switch-row">
                    <input type="checkbox" checked={state.notificationSettings.events} onChange={(event) => updateNotifications({ events: event.target.checked })} />
                    <span>發活動</span>
                  </label>
                </div>
              )}
              <p className="form-helper">通知偏好會先存成本地設定；正式寄信需要 fork 後串接 Email worker。</p>
            </div>
            <form className="password-change-panel" onSubmit={changePassword}>
              <strong>Password</strong>
              <div className="two-col">
                <label>Current password<Input aria-label="Current password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
                <label>New password<Input aria-label="New password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} /></label>
              </div>
              <Button variant="outline" className="secondary-button" type="submit">Change password</Button>
              {passwordMessage && <p className="form-helper">{passwordMessage}</p>}
            </form>
          </div>
        </div>
      </article>
      <article className="account-plan-card">
        <div className="account-score-card">
          <SectionHeading eyebrow="Progress" title="Level & points" />
          <div className="account-score-grid">
            <Metric label="Level" value={`${activeLevel}`} />
            <Metric label="Points" value={`${activePoints}`} />
          </div>
          <p className="form-helper">Role: {roleLabel(state.role)}</p>
        </div>
        {state.role !== 'admin' && (
          <>
            <SectionHeading eyebrow="Plan" title="Subscription plan" />
            <p className="plan-summary">
              目前方案是 <strong>{currentPlan.name}</strong>，費用 <span className="mono">{currentPlan.price}</span> / {currentPlan.cadence}；扣款方式為 {billingMethod}，續訂狀態為 {billingCycle}。
            </p>
            <p className="form-helper">方案按鈕目前只更新本機預覽；正式扣款與退訂需串接你選擇的付款服務。</p>
            <div className="subscription-action-row">
              {changePlan && (
                <Button className="primary-button" type="button" onClick={() => updateState({ selectedPlanId: changePlan.id }, `方案已切換為 ${changePlan.name}。`)}>Change plan</Button>
              )}
              {currentPlan.id !== 'free' && (
                <Button variant="outline" className="secondary-button danger-button" type="button" onClick={() => updateState({ selectedPlanId: 'free' }, '訂閱已在本機預覽取消。')}>Cancel subscription</Button>
              )}
            </div>
          </>
        )}
      </article>
    </section>
  )
}

function LoginView({
  onCredentialsLogin,
  onForgotPassword,
  onJoin,
  onVerifyEmail,
  onSuccess,
}: {
  onCredentialsLogin: (email: string, password: string, role: Role) => Promise<AuthResult>
  onForgotPassword: (email: string) => Promise<AuthResult>
  onJoin: () => void
  onVerifyEmail: (email: string, otp: string, role: Role) => Promise<AuthResult>
  onSuccess: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [pending, setPending] = useState<{ email: string; role: Role } | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const run = async (action: () => Promise<AuthResult>) => {
    setError('')
    setMessage('')
    const result = await action()
    if (result.requiresVerification && result.email && result.role) {
      setPending({ email: result.email, role: result.role })
      setError(result.error ?? '')
      return
    }
    if (!result.ok) {
      setError(result.error ?? '登入失敗，請稍後再試。')
      return
    }
    onSuccess()
  }
  const requestPasswordReset = async () => {
    setError('')
    setMessage('')
    const result = await onForgotPassword(email)
    if (!result.ok) {
      setError(result.error ?? '無法送出密碼重設。')
      return
    }
    setMessage(result.message ?? '已送出密碼重設。')
  }

  return (
    <section className="login-stack">
      <article className="login-card">
        <SectionHeading eyebrow="Account" title="登入社群">
          本機 demo 可使用預設管理員帳號登入。
        </SectionHeading>
        <form className="settings-form" onSubmit={(event) => { event.preventDefault(); void run(() => onCredentialsLogin(email, password, 'member')) }}>
          <label>Email<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>
          <button className="link-button" type="button" onClick={() => void requestPasswordReset()}>忘記密碼？</button>
          <div className="button-stack">
            <Button className="primary-button" type="submit">登入</Button>
            <Button variant="outline" className="secondary-button" type="button" onClick={onJoin}>免費加入</Button>
          </div>
        </form>
      </article>

      {pending && (
        <article className="span-2">
          <SectionHeading eyebrow="Email verification" title="輸入 6 位驗證碼" />
          <form className="form-row" onSubmit={(event) => { event.preventDefault(); void run(() => onVerifyEmail(pending.email, otp, pending.role)) }}>
            <Input value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="123456" />
            <Button className="primary-button" type="submit">Verify</Button>
          </form>
        </article>
      )}
      {message && <p className="form-helper">{message}</p>}
      {error && <p className="form-error">{error}</p>}
    </section>
  )
}

function AdminView({
  state,
  updateState,
  onAddEvent,
  tab,
  setTab,
}: {
  state: AppState
  updateState: (patch: Partial<AppState>) => void
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void
  tab: AdminTab
  setTab: (tab: AdminTab) => void
}) {
  return (
    <section className="admin-view">
      <SectionHeading eyebrow="Admin" title="社群設定中心">
        Dashboard、Community、Classroom、Calendar、Members、Pricing、Plugins 集中管理。
      </SectionHeading>
      <Badge variant="outline" className="status-badge admin-ready-badge">社群管理後台已開啟</Badge>
      <nav className="admin-tabs" aria-label="Admin tabs">
        {adminTabs.map((item) => {
          const Icon = item.icon
          return <button key={item.id} type="button" className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><Icon size={16} />{item.label}</button>
        })}
      </nav>
      {tab === 'dashboard' && <AdminDashboard state={state} />}
      {tab === 'general' && <AdminGeneral state={state} updateState={updateState} />}
      {tab === 'access' && <AdminAccess state={state} updateState={updateState} />}
      {tab === 'community' && <AdminCommunity state={state} updateState={updateState} />}
      {tab === 'classroom' && <AdminClassroom state={state} updateState={updateState} />}
      {tab === 'calendar' && <AdminCalendar state={state} updateState={updateState} onAddEvent={onAddEvent} />}
      {tab === 'members' && <AdminMembers state={state} updateState={updateState} />}
      {tab === 'pricing' && <AdminPricing state={state} />}
      {tab === 'plugins' && <AdminPlugins state={state} updateState={updateState} />}
    </section>
  )
}

function AdminGeneral({ state, updateState }: { state: AppState; updateState: (patch: Partial<AppState>, notice?: string) => void }) {
  const [linkDraft, setLinkDraft] = useState<{ label: string; url: string; visibility: 'public' | 'members' }>({ label: '', url: '', visibility: 'public' })
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [deleteLinkId, setDeleteLinkId] = useState<string | null>(null)
  const [coverMessage, setCoverMessage] = useState('')
  const updateGroup = (patch: Partial<AppState['group']>) => updateState({ group: { ...state.group, ...patch } })
  const updateLink = (id: string, patch: Partial<AppState['externalLinks'][number]>) => {
    updateState({ externalLinks: state.externalLinks.map((link) => link.id === id ? { ...link, ...patch } : link) })
  }
  const addLink = (event: FormEvent) => {
    event.preventDefault()
    const label = linkDraft.label.trim()
    const url = linkDraft.url.trim()
    if (!label || !url || state.externalLinks.length >= 3) return
    updateState({ externalLinks: [...state.externalLinks, { id: `link-${Date.now()}`, label, url, visibility: linkDraft.visibility }] })
    setLinkDraft({ label: '', url: '', visibility: 'public' })
    setLinkDialogOpen(false)
  }
  const uploadCover = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setCoverMessage('請上傳圖片檔。')
      return
    }
    if (file.size > 2_500_000) {
      setCoverMessage('封面圖片請小於 2.5MB。')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      updateGroup({ coverImageUrl: reader.result })
      setCoverMessage('封面已更新。')
    }
    reader.onerror = () => setCoverMessage('封面讀取失敗，請換一張圖片。')
    reader.readAsDataURL(file)
  }
  const deleteLink = () => {
    if (!deleteLinkId) return
    updateState({ externalLinks: state.externalLinks.filter((item) => item.id !== deleteLinkId) }, '外部連結已刪除。')
    setDeleteLinkId(null)
  }
  useEscapeKey(linkDialogOpen, () => setLinkDialogOpen(false))
  useEscapeKey(Boolean(deleteLinkId), () => setDeleteLinkId(null))
  return (
    <div className="admin-grid">
      <article className="span-2">
        <SectionHeading eyebrow="General" title="社群基本設定">
          管理社群名稱、URL、icon、cover photo 和 About 文案。
        </SectionHeading>
        <div className="settings-form">
          <div className="two-col">
            <label>Group name<Input aria-label="Group name" value={state.group.name} onChange={(event) => updateGroup({ name: event.target.value })} /></label>
            <label>Group slug<Input aria-label="Group slug" value={state.group.slug} onChange={(event) => updateGroup({ slug: event.target.value })} /></label>
          </div>
          <label>Creator name<Input aria-label="Creator name" value={state.group.creatorName} onChange={(event) => updateGroup({ creatorName: event.target.value })} /></label>
          <label>Tagline<Input aria-label="Group tagline" value={state.group.tagline} onChange={(event) => updateGroup({ tagline: event.target.value })} /></label>
          <label>Description<Textarea aria-label="Group description" value={state.group.description} onChange={(event) => updateGroup({ description: event.target.value })} /></label>
          <label>Cover image upload<Input aria-label="Cover image upload" type="file" accept="image/*" onChange={uploadCover} /></label>
          {coverMessage && <p className="form-helper">{coverMessage}</p>}
          <label>Logo image URL<Input aria-label="Logo image URL" value={state.group.logoImageUrl ?? ''} onChange={(event) => updateGroup({ logoImageUrl: event.target.value })} /></label>
          <label>Online label<Input aria-label="Online label" value={state.group.onlineLabel} onChange={(event) => updateGroup({ onlineLabel: event.target.value })} /></label>
        </div>
      </article>
      <article>
        <SectionHeading eyebrow="Preview" title="About card" />
        <div className="admin-preview-card">
          <div className="cover-box stock-cover" style={stockCoverStyle(state.group.coverImageUrl?.trim() || fallbackCoverImage)} />
          <strong>{state.group.name}</strong>
          <small className="mono">{state.group.slug}.community</small>
          <p>{state.group.description}</p>
        </div>
      </article>
      <article className="span-3">
        <div className="section-heading-row">
          <SectionHeading eyebrow="Links" title="社群資訊卡連結">
            在社群資訊卡加入最多 3 個外部連結。
          </SectionHeading>
          <Button className="primary-button" type="button" onClick={() => setLinkDialogOpen(true)} disabled={state.externalLinks.length >= 3}>Add</Button>
        </div>
        <div className="link-editor-list">
          {state.externalLinks.map((link, index) => (
            <div key={link.id} className="link-editor-row">
              <label>Label<Input aria-label={`External link ${index + 1} label`} value={link.label} onChange={(event) => updateLink(link.id, { label: event.target.value })} /></label>
              <label>URL<Input aria-label={`External link ${index + 1} URL`} value={link.url} onChange={(event) => updateLink(link.id, { url: event.target.value })} /></label>
              <label>Visibility<select aria-label={`External link ${index + 1} visibility`} value={link.visibility} onChange={(event) => updateLink(link.id, { visibility: event.target.value as typeof link.visibility })}>
                <option value="public">Public</option>
                <option value="members">Members</option>
              </select></label>
              <Button variant="outline" className="secondary-button danger-button" type="button" onClick={() => setDeleteLinkId(link.id)}>Delete</Button>
            </div>
          ))}
        </div>
        {linkDialogOpen && (
          <div
            className="modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setLinkDialogOpen(false)
            }}
          >
            <div className="settings-modal" role="dialog" aria-modal="true" aria-label="新增社群資訊卡連結">
              <button className="modal-close" type="button" onClick={() => setLinkDialogOpen(false)} aria-label="關閉新增連結">×</button>
              <SectionHeading eyebrow="Add link" title="新增社群資訊卡連結">
                設定連結名稱、網址與可見權限。
              </SectionHeading>
              <form className="settings-form" onSubmit={addLink}>
                <label>Label<Input aria-label="Link label" value={linkDraft.label} onChange={(event) => setLinkDraft({ ...linkDraft, label: event.target.value })} placeholder="Label" required /></label>
                <label>URL<Input aria-label="Link URL" value={linkDraft.url} onChange={(event) => setLinkDraft({ ...linkDraft, url: event.target.value })} placeholder="https://..." required /></label>
                <label>Visibility<select aria-label="Link visibility" value={linkDraft.visibility} onChange={(event) => setLinkDraft({ ...linkDraft, visibility: event.target.value as typeof linkDraft.visibility })}>
                  <option value="public">Public</option>
                  <option value="members">Members</option>
                </select></label>
                <div className="button-stack">
                  <Button variant="outline" className="secondary-button" type="button" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
                  <Button className="primary-button" type="submit">Add</Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {deleteLinkId && (
          <div
            className="modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setDeleteLinkId(null)
            }}
          >
            <div className="settings-modal" role="dialog" aria-modal="true" aria-label="確認刪除社群連結">
              <button className="modal-close" type="button" onClick={() => setDeleteLinkId(null)} aria-label="關閉刪除連結確認">×</button>
              <SectionHeading eyebrow="Delete link" title="確認刪除社群連結">
                這會從 About 資訊卡移除這個連結。
              </SectionHeading>
              <div className="button-stack">
                <Button variant="outline" className="secondary-button" type="button" onClick={() => setDeleteLinkId(null)}>Cancel</Button>
                <Button variant="outline" className="secondary-button danger-button" type="button" onClick={deleteLink}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </article>
    </div>
  )
}

function AdminAccess({ state, updateState }: { state: AppState; updateState: (patch: Partial<AppState>) => void }) {
  const [questionDialog, setQuestionDialog] = useState<{ mode: 'add' } | { mode: 'edit'; index: number } | null>(null)
  const [questionDraft, setQuestionDraft] = useState('')
  const [deleteQuestionIndex, setDeleteQuestionIndex] = useState<number | null>(null)
  const updateAccessPlugin = (id: 'instant-approval' | 'unlock-posting' | 'unlock-chat', enabled: boolean, patch: Partial<AppState['accessSettings']>) => {
    updateState({
      accessSettings: { ...state.accessSettings, ...patch },
      plugins: state.plugins.map((plugin) => plugin.id === id ? { ...plugin, enabled } : plugin),
    })
  }
  const updateLevelThreshold = (index: number, value: number) => {
    updateState({ levelThresholds: state.levelThresholds.map((threshold, currentIndex) => currentIndex === index ? Math.max(index === 0 ? 0 : 1, value) : threshold) })
  }
  const updatePointRule = (id: PointRuleId, patch: Partial<AppState['pointRules'][number]>) => {
    updateState({ pointRules: state.pointRules.map((rule) => rule.id === id ? { ...rule, ...patch } : rule) })
  }
  const updateLevelBenefit = (level: number, value: string) => {
    updateState({
      levelBenefits: state.levelBenefits.map((item) => item.level === level
        ? { ...item, benefits: value.split('\n').map((benefit) => benefit.trim()).filter(Boolean) }
        : item),
    })
  }
  const updateCourseLevelGate = (courseId: string, level: number, checked: boolean) => {
    updateState({
      courses: state.courses.map((course) => course.id === courseId
        ? { ...course, accessMode: checked ? 'level-unlock' : 'open', requiredLevel: checked ? level : undefined }
        : course),
    })
  }
  const updateEventLevelGate = (eventId: string, level: number, checked: boolean) => {
    updateState({
      events: state.events.map((event) => event.id === eventId
        ? { ...event, accessMode: checked ? 'level' : 'all', requiredLevel: checked ? level : undefined }
        : event),
    })
  }
  const updateApplication = (application: MembershipApplication, status: MembershipApplication['status']) => {
    const applications = state.membershipApplications.map((item) => item.id === application.id ? { ...item, status } : item)
    if (status !== 'approved') {
      updateState({ membershipApplications: applications })
      return
    }
    const member: Member = {
      id: `member-${Date.now()}`,
      name: application.email.split('@')[0],
      email: application.email,
      role: 'member',
      planId: application.planId,
      level: 1,
      points: 0,
      joinedAt: 'Today',
      posts: 0,
      comments: 0,
      status: 'active',
    }
    updateState({ membershipApplications: applications, members: [member, ...state.members] })
  }
  const openQuestionDialog = (dialog: { mode: 'add' } | { mode: 'edit'; index: number }) => {
    setQuestionDraft(dialog.mode === 'edit' ? state.membershipQuestions[dialog.index] ?? '' : '')
    setQuestionDialog(dialog)
  }
  const saveQuestion = (event: FormEvent) => {
    event.preventDefault()
    const question = questionDraft.trim()
    if (!questionDialog || !question) return
    if (questionDialog.mode === 'add') {
      if (state.membershipQuestions.length >= 3) return
      updateState({ membershipQuestions: [...state.membershipQuestions, question] })
    } else {
      updateState({ membershipQuestions: state.membershipQuestions.map((item, index) => index === questionDialog.index ? question : item) })
    }
    setQuestionDialog(null)
    setQuestionDraft('')
  }
  const deleteQuestion = () => {
    if (deleteQuestionIndex === null) return
    updateState({ membershipQuestions: state.membershipQuestions.filter((_, index) => index !== deleteQuestionIndex) })
    setDeleteQuestionIndex(null)
  }
  const [reviewOpen, setReviewOpen] = useState(false)
  const [questionsOpen, setQuestionsOpen] = useState(false)
  const [levelsOpen, setLevelsOpen] = useState(false)
  const pendingApplications = state.membershipApplications.filter((application) => application.status === 'pending')
  const gatedCourses = state.courses.filter((course) => course.accessMode === 'level-unlock')
  const gatedEvents = state.events.filter((event) => event.accessMode === 'level')
  const levels = state.levelThresholds.map((threshold, index) => ({ level: index + 1, threshold }))
  const levelGateRows: Array<{ id: string; label: string; ariaLabel: string; checked: (level: number) => boolean; toggle: (level: number, checked: boolean) => void }> = [
    ...state.courses.map((course) => ({
      id: `course-${course.id}`,
      label: `Course: ${course.title}`,
      ariaLabel: `unlock course ${course.title}`,
      checked: (level: number) => course.accessMode === 'level-unlock' && (course.requiredLevel ?? 1) === level,
      toggle: (level: number, checked: boolean) => updateCourseLevelGate(course.id, level, checked),
    })),
    ...state.events.map((event) => ({
      id: `event-${event.id}`,
      label: `Event: ${event.title}`,
      ariaLabel: `unlock event ${event.title}`,
      checked: (level: number) => event.accessMode === 'level' && (event.requiredLevel ?? 1) === level,
      toggle: (level: number, checked: boolean) => updateEventLevelGate(event.id, level, checked),
    })),
  ]
  useEscapeKey(reviewOpen, () => setReviewOpen(false))
  useEscapeKey(questionsOpen, () => setQuestionsOpen(false))
  useEscapeKey(levelsOpen, () => setLevelsOpen(false))
  useEscapeKey(Boolean(questionDialog), () => setQuestionDialog(null))
  useEscapeKey(deleteQuestionIndex !== null, () => setDeleteQuestionIndex(null))
  return (
    <div className="admin-grid admin-access-grid">
      <article className="span-3 access-overview-card">
        <SectionHeading eyebrow="Access setup" title="權限設定流程">
          先設定加入方式與審核問題，再設定 Level 門檻與福利；長列表統一進彈窗處理。
        </SectionHeading>
        <div className="access-step-grid" aria-label="Access setup order">
          <p><strong>1</strong><span>加入方式</span><small>{state.accessSettings.instantMembershipApproval ? '免費會員直接通過' : '免費會員送審核'}</small></p>
          <p><strong>2</strong><span>審核問題</span><small>{state.membershipQuestions.length}/3 questions</small></p>
          <p><strong>3</strong><span>申請審核</span><small>{pendingApplications.length} pending</small></p>
          <p><strong>4</strong><span>等級權限</span><small>{gatedCourses.length + gatedEvents.length + 2} linked gates</small></p>
        </div>
      </article>

      <article className="access-equal-card">
        <SectionHeading eyebrow="Join access" title="加入規則">
          免費社群可選擇直接通過或管理員審核；付費加入仍直接通過。
        </SectionHeading>
        <div className="settings-form compact-access-form">
          <label className="switch-row">
            <input type="checkbox" checked={state.accessSettings.instantMembershipApproval} onChange={(event) => updateAccessPlugin('instant-approval', event.target.checked, { instantMembershipApproval: event.target.checked })} />
            <span>Instant membership approval</span>
          </label>
        </div>
      </article>

      <article className="access-equal-card">
        <SectionHeading eyebrow="Membership questions" title="Questions before joining">
          加入前最多 3 題，問題編輯集中在彈窗內。
        </SectionHeading>
        <div className="access-card-actions">
          <strong>{state.membershipQuestions.length}/3</strong>
          <Button variant="outline" className="secondary-button" type="button" onClick={() => setQuestionsOpen(true)}>Manage questions</Button>
        </div>
      </article>

      <article className="access-equal-card">
        <SectionHeading eyebrow="Join review" title="Review queue">
          申請列表可能變長，集中到彈窗中審核。
        </SectionHeading>
        <div className="access-card-actions">
          <strong>{pendingApplications.length}</strong>
          <Button variant="outline" className="secondary-button" type="button" onClick={() => setReviewOpen(true)}>Review applications</Button>
        </div>
      </article>

      <article className="span-2">
        <SectionHeading eyebrow="Leaderboard" title="Level thresholds and gates">
          設定 points 門檻與主要 Level 權限；更多福利與課程/活動連動放在彈窗。
        </SectionHeading>
        <div className="level-threshold-settings">
          {state.levelThresholds.map((threshold, index) => (
            <label key={`level-${index + 1}`}>Level {index + 1}
              <Input
                aria-label={`Level ${index + 1} points`}
                type="number"
                min={index === 0 ? 0 : 1}
                value={threshold}
                readOnly={index === 0}
                onChange={(event) => updateLevelThreshold(index, Number(event.target.value))}
              />
            </label>
          ))}
        </div>
        <div className="settings-form access-gate-form">
          <label>Unlock posting at Level<Input aria-label="Unlock posting at Level" type="number" min={1} max={9} value={state.accessSettings.postingLevel} onChange={(event) => updateAccessPlugin('unlock-posting', Number(event.target.value) > 1, { postingLevel: Number(event.target.value) })} /></label>
          <label>Unlock chat at Level<Input aria-label="Unlock chat at Level" type="number" min={1} max={9} value={state.accessSettings.chatLevel} onChange={(event) => updateAccessPlugin('unlock-chat', Number(event.target.value) > 1, { chatLevel: Number(event.target.value) })} /></label>
        </div>
        <Button variant="outline" className="secondary-button" type="button" onClick={() => setLevelsOpen(true)}>Manage level benefits and gates</Button>
      </article>

      <article>
        <SectionHeading eyebrow="Points" title="Point rules">
          控制會員互動後增加多少 points。
        </SectionHeading>
        <div className="point-rule-list">
          {state.pointRules.map((rule) => (
            <label key={rule.id}>
              <input type="checkbox" checked={rule.enabled} onChange={(event) => updatePointRule(rule.id, { enabled: event.target.checked })} />
              <span>{rule.label}</span>
              <Input aria-label={`${rule.label} points`} type="number" min={0} value={rule.points} onChange={(event) => updatePointRule(rule.id, { points: Number(event.target.value) })} />
            </label>
          ))}
        </div>
      </article>
      {reviewOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReviewOpen(false) }}>
          <div className="settings-modal wide-modal" role="dialog" aria-modal="true" aria-label="加入申請審核">
            <button className="modal-close" type="button" onClick={() => setReviewOpen(false)} aria-label="關閉加入申請審核">×</button>
            <SectionHeading eyebrow="Join review" title="加入申請審核">
              免費會員需要管理員核准；付費會員可先確認回答，再接上外部付款流程。
            </SectionHeading>
            <div className="application-list modal-list">
              {state.membershipApplications.length === 0 && <p className="empty-note">目前沒有待審核申請。</p>}
              {state.membershipApplications.map((application) => (
                <div key={application.id} className="application-item">
                  <div className="application-header">
                    <strong>{application.email}</strong>
                    <small>{planLabel(application.planId)} · {application.createdAt} · {applicationStatusLabel(application.status)}</small>
                  </div>
                  <div className="application-answers">
                    {Object.entries(application.answers).map(([question, answer]) => (
                      <p key={question}><span>{question}</span><strong>{answer}</strong></p>
                    ))}
                  </div>
                  {application.status === 'pending' && (
                    <div className="button-stack">
                      <Button className="primary-button" type="button" onClick={() => updateApplication(application, 'approved')}>核准</Button>
                      <Button variant="outline" className="secondary-button" type="button" onClick={() => updateApplication(application, 'rejected')}>拒絕</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {questionsOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setQuestionsOpen(false) }}>
          <div className="settings-modal" role="dialog" aria-modal="true" aria-label="管理審核問題">
            <button className="modal-close" type="button" onClick={() => setQuestionsOpen(false)} aria-label="關閉審核問題管理">×</button>
            <div className="section-heading-row">
              <SectionHeading eyebrow="Membership Questions" title="Questions before joining" />
              <Button className="primary-button" type="button" onClick={() => openQuestionDialog({ mode: 'add' })} disabled={state.membershipQuestions.length >= 3}>Add</Button>
            </div>
            <div className="compact-list membership-question-list">
              {state.membershipQuestions.map((item, index) => (
                <p key={`${item}-${index}`}>
                  <strong>{item}</strong>
                  <span className="question-actions">
                    <Button variant="outline" className="icon-button ghost-button" type="button" onClick={() => openQuestionDialog({ mode: 'edit', index })} aria-label={`Edit question ${index + 1}`}><Pencil size={16} aria-hidden="true" /></Button>
                    <Button variant="outline" className="icon-button ghost-button danger-button" type="button" onClick={() => setDeleteQuestionIndex(index)} aria-label={`Delete question ${index + 1}`}><Trash2 size={16} aria-hidden="true" /></Button>
                  </span>
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
      {levelsOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLevelsOpen(false) }}>
          <div className="settings-modal wide-modal" role="dialog" aria-modal="true" aria-label="Level benefits and gates">
            <button className="modal-close" type="button" onClick={() => setLevelsOpen(false)} aria-label="關閉等級福利設定">×</button>
            <SectionHeading eyebrow="Leaderboard" title="Level benefits and gates">
              設定每個等級顯示的福利；發文與私訊門檻在外層欄位設定。
            </SectionHeading>
            <div className="level-benefit-editor">
              {levels.map(({ level, threshold }) => (
                <div key={`level-benefit-${level}`} className="level-benefit-card">
                  <div className="level-benefit-head">
                    <strong>Level {level}</strong>
                    <small className="mono">{threshold} pts</small>
                  </div>
                  <label>Benefits<Textarea aria-label={`Level ${level} benefits`} value={benefitsForLevel(state, level).join('\n')} onChange={(event) => updateLevelBenefit(level, event.target.value)} /></label>
                </div>
              ))}
            </div>
            <p className="level-gate-note">
              下方項目會連動 Classroom 課程與 Calendar 活動；在那邊新增課程或活動後，這裡就能調整等級限制。你也可以在課程或活動新增/編輯時設定，兩邊會同步。
            </p>
            <div className="level-gate-matrix" aria-label="Level linked permissions">
              <div className="level-gate-row level-gate-header" aria-hidden="true">
                <span>Item</span>
                <div className="level-gate-levels">
                  {levels.map(({ level }) => <span key={`gate-head-${level}`}>Level {level}</span>)}
                </div>
              </div>
              {levelGateRows.map((row) => (
                <div key={row.id} className="level-gate-row">
                  <strong>{row.label}</strong>
                  <div className="level-gate-levels">
                    {levels.map(({ level }) => (
                      <label key={`${row.id}-${level}`} className="level-gate-check">
                        <input type="checkbox" aria-label={`Level ${level} ${row.ariaLabel}`} checked={row.checked(level)} onChange={(event) => row.toggle(level, event.target.checked)} />
                        <span>Level {level}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {questionDialog && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setQuestionDialog(null)
          }}
        >
          <div className="settings-modal" role="dialog" aria-modal="true" aria-label={questionDialog.mode === 'add' ? '新增審核問題' : '編輯審核問題'}>
            <button className="modal-close" type="button" onClick={() => setQuestionDialog(null)} aria-label="關閉審核問題設定">×</button>
            <SectionHeading eyebrow={questionDialog.mode === 'add' ? 'Add question' : 'Edit question'} title={questionDialog.mode === 'add' ? '新增審核問題' : '編輯審核問題'} />
            <form className="settings-form" onSubmit={saveQuestion}>
              <label>Question<Textarea aria-label="Membership question" value={questionDraft} onChange={(event) => setQuestionDraft(event.target.value)} required /></label>
              <div className="button-stack">
                <Button variant="outline" className="secondary-button" type="button" onClick={() => setQuestionDialog(null)}>Cancel</Button>
                <Button className="primary-button" type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteQuestionIndex !== null && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDeleteQuestionIndex(null)
          }}
        >
          <div className="settings-modal" role="dialog" aria-modal="true" aria-label="確認刪除審核問題">
            <button className="modal-close" type="button" onClick={() => setDeleteQuestionIndex(null)} aria-label="關閉刪除確認">×</button>
            <SectionHeading eyebrow="Delete question" title="確認刪除審核問題">
              這會從加入申請表單移除這個問題。
            </SectionHeading>
            <div className="button-stack">
              <Button variant="outline" className="secondary-button" type="button" onClick={() => setDeleteQuestionIndex(null)}>Cancel</Button>
              <Button variant="outline" className="secondary-button danger-button" type="button" onClick={deleteQuestion}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminDashboard({ state }: { state: AppState }) {
  const openPlugins = state.plugins.filter((plugin) => plugin.enabled).length
  return (
    <div className="dashboard-grid">
      <Metric label="Members" value={`${state.members.length}`} />
      <Metric label="Posts" value={`${state.posts.length}`} />
      <Metric label="Courses" value={`${state.courses.length}`} />
      <Metric label="Events" value={`${state.events.length}`} />
      <Metric label="Plugins" value={`${openPlugins}/${state.plugins.length}`} />
    </div>
  )
}

function AdminCommunity({ state, updateState }: { state: AppState; updateState: (patch: Partial<AppState>, notice?: string) => void }) {
  const [categoryName, setCategoryName] = useState('')
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null)
  const [ruleDialog, setRuleDialog] = useState<{ mode: 'add' } | { mode: 'edit'; index: number } | null>(null)
  const [ruleDraft, setRuleDraft] = useState('')
  const [deleteRuleIndex, setDeleteRuleIndex] = useState<number | null>(null)
  const updateCategory = (id: string, patch: Partial<CommunityCategory>) => updateState({ categories: state.categories.map((category) => category.id === id ? { ...category, ...patch } : category) })
  const saveCategory = (event: FormEvent) => {
    event.preventDefault()
    const name = categoryName.trim()
    if (!name) return
    const next: CommunityCategory = { id: `cat-${Date.now()}`, name, permission: 'members', sort: 'default' }
    updateState({ categories: [...state.categories, next] })
    setCategoryName('')
    setCategoryDialogOpen(false)
  }
  const openRuleDialog = (dialog: { mode: 'add' } | { mode: 'edit'; index: number }) => {
    setRuleDraft(dialog.mode === 'edit' ? state.rules[dialog.index] ?? '' : '')
    setRuleDialog(dialog)
  }
  const saveRule = (event: FormEvent) => {
    event.preventDefault()
    const rule = ruleDraft.trim()
    if (!ruleDialog || !rule) return
    updateState({
      rules: ruleDialog.mode === 'add'
        ? [...state.rules, rule]
        : state.rules.map((item, index) => index === ruleDialog.index ? rule : item),
    })
    setRuleDialog(null)
    setRuleDraft('')
  }
  const deleteRule = () => {
    if (deleteRuleIndex === null) return
    updateState({ rules: state.rules.filter((_, index) => index !== deleteRuleIndex) })
    setDeleteRuleIndex(null)
  }
  const deleteCategory = () => {
    if (!deleteCategoryId) return
    updateState({ categories: state.categories.filter((item) => item.id !== deleteCategoryId) }, '社群分類已刪除。')
    setDeleteCategoryId(null)
  }
  useEscapeKey(categoryDialogOpen, () => setCategoryDialogOpen(false))
  useEscapeKey(Boolean(ruleDialog), () => setRuleDialog(null))
  useEscapeKey(deleteRuleIndex !== null, () => setDeleteRuleIndex(null))
  useEscapeKey(Boolean(deleteCategoryId), () => setDeleteCategoryId(null))
  return (
    <div className="admin-grid">
      <article className="span-2">
        <div className="section-heading-row">
          <SectionHeading eyebrow="Categories" title="Community categories" />
          <Button className="primary-button" type="button" onClick={() => { setCategoryName(''); setCategoryDialogOpen(true) }}>Add</Button>
        </div>
        <div className="category-editor-list">
          {state.categories.map((category) => (
            <div key={category.id} className="category-editor-row">
              <strong>{category.name}</strong>
              <label>Permission<select aria-label={`${category.name} permission`} value={category.permission} onChange={(event) => updateCategory(category.id, { permission: event.target.value as CommunityCategory['permission'] })}>
                <option value="members">Members can post</option>
                <option value="admins">Admin-only posts</option>
              </select></label>
              <label>Sort<select aria-label={`${category.name} sort`} value={category.sort} onChange={(event) => updateCategory(category.id, { sort: event.target.value as CommunityCategory['sort'] })}>
                <option value="default">Default</option>
                <option value="new">New</option>
                <option value="top-week">Top week</option>
                <option value="top-month">Top month</option>
              </select></label>
              <Button variant="outline" className="secondary-button danger-button" type="button" onClick={() => setDeleteCategoryId(category.id)}>Delete</Button>
            </div>
          ))}
        </div>
      </article>
      <article>
        <div className="section-heading-row">
          <SectionHeading eyebrow="Rules" title="Group rules" />
          <Button className="primary-button" type="button" onClick={() => openRuleDialog({ mode: 'add' })}>Add</Button>
        </div>
        <div className="compact-list rule-list">
          {state.rules.map((item, index) => (
            <p key={`${item}-${index}`}>
              <strong>{item}</strong>
              <span className="question-actions">
                <Button variant="outline" className="icon-button ghost-button" type="button" onClick={() => openRuleDialog({ mode: 'edit', index })} aria-label={`Edit rule ${index + 1}`}><Pencil size={16} aria-hidden="true" /></Button>
                <Button variant="outline" className="icon-button ghost-button danger-button" type="button" onClick={() => setDeleteRuleIndex(index)} aria-label={`Delete rule ${index + 1}`}><Trash2 size={16} aria-hidden="true" /></Button>
              </span>
            </p>
          ))}
        </div>
      </article>
      {categoryDialogOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCategoryDialogOpen(false)
          }}
        >
          <div className="settings-modal" role="dialog" aria-modal="true" aria-label="新增社群分類">
            <button className="modal-close" type="button" onClick={() => setCategoryDialogOpen(false)} aria-label="關閉新增分類">×</button>
            <SectionHeading eyebrow="Add category" title="新增社群分類" />
            <form className="settings-form" onSubmit={saveCategory}>
              <label>Category name<Input aria-label="Category name" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required /></label>
              <div className="button-stack">
                <Button variant="outline" className="secondary-button" type="button" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
                <Button className="primary-button" type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteCategoryId && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDeleteCategoryId(null)
          }}
        >
          <div className="settings-modal" role="dialog" aria-modal="true" aria-label="確認刪除社群分類">
            <button className="modal-close" type="button" onClick={() => setDeleteCategoryId(null)} aria-label="關閉刪除分類確認">×</button>
            <SectionHeading eyebrow="Delete category" title="確認刪除社群分類">
              刪除分類後，既有貼文仍會保留，但分類選項會移除。
            </SectionHeading>
            <div className="button-stack">
              <Button variant="outline" className="secondary-button" type="button" onClick={() => setDeleteCategoryId(null)}>Cancel</Button>
              <Button variant="outline" className="secondary-button danger-button" type="button" onClick={deleteCategory}>Delete</Button>
            </div>
          </div>
        </div>
      )}
      {ruleDialog && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setRuleDialog(null)
          }}
        >
          <div className="settings-modal" role="dialog" aria-modal="true" aria-label={ruleDialog.mode === 'add' ? '新增社群規範' : '編輯社群規範'}>
            <button className="modal-close" type="button" onClick={() => setRuleDialog(null)} aria-label="關閉社群規範設定">×</button>
            <SectionHeading eyebrow={ruleDialog.mode === 'add' ? 'Add rule' : 'Edit rule'} title={ruleDialog.mode === 'add' ? '新增社群規範' : '編輯社群規範'} />
            <form className="settings-form" onSubmit={saveRule}>
              <label>Rule<Textarea aria-label="Group rule" value={ruleDraft} onChange={(event) => setRuleDraft(event.target.value)} required /></label>
              <div className="button-stack">
                <Button variant="outline" className="secondary-button" type="button" onClick={() => setRuleDialog(null)}>Cancel</Button>
                <Button className="primary-button" type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteRuleIndex !== null && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDeleteRuleIndex(null)
          }}
        >
          <div className="settings-modal" role="dialog" aria-modal="true" aria-label="確認刪除社群規範">
            <button className="modal-close" type="button" onClick={() => setDeleteRuleIndex(null)} aria-label="關閉刪除社群規範確認">×</button>
            <SectionHeading eyebrow="Delete rule" title="確認刪除社群規範">
              這會從 About 頁面的社群規範中移除這條內容。
            </SectionHeading>
            <div className="button-stack">
              <Button variant="outline" className="secondary-button" type="button" onClick={() => setDeleteRuleIndex(null)}>Cancel</Button>
              <Button variant="outline" className="secondary-button danger-button" type="button" onClick={deleteRule}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminClassroom({ state, updateState }: { state: AppState; updateState: (patch: Partial<AppState>, notice?: string) => void }) {
  const [view, setView] = useState<'list' | 'edit' | 'lesson'>('list')
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null)
  const [deletePageTarget, setDeletePageTarget] = useState<{ courseId: string; pageId: string } | null>(null)
  const [attachmentMessage, setAttachmentMessage] = useState('')
  const editingCourse = state.courses.find((course) => course.id === editingCourseId)
  const editingPage = editingCourse?.pages.find((page) => page.id === editingPageId)
  const deleteCourseTarget = state.courses.find((course) => course.id === deleteCourseId)
  const deletePageCourse = state.courses.find((course) => course.id === deletePageTarget?.courseId)
  const deletePageItem = deletePageCourse?.pages.find((page) => page.id === deletePageTarget?.pageId)
  const updateCourse = (id: string, patch: Partial<ClassroomCourse>) => {
    updateState({ courses: state.courses.map((course) => course.id === id ? { ...course, ...patch } : course) })
  }
  const updateCoursePage = (courseId: string, pageId: string, patch: Partial<ClassroomCourse['pages'][number]>) => {
    updateState({
      courses: state.courses.map((course) => course.id === courseId ? {
        ...course,
        pages: course.pages.map((page) => page.id === pageId ? { ...page, ...patch } : page),
      } : course),
    })
  }
  const addCoursePage = (courseId: string) => {
    const pageId = `page-${Date.now()}`
    updateState({
      courses: state.courses.map((course) => course.id === courseId ? {
        ...course,
        pages: [...course.pages, { id: pageId, title: 'New lesson', minutes: 10, body: 'Write lesson content here.', resources: [] }],
      } : course),
    })
    setEditingPageId(pageId)
    setView('lesson')
  }
  const deleteCoursePage = (courseId: string, pageId: string) => {
    updateState({
      courses: state.courses.map((course) => course.id === courseId ? {
        ...course,
        pages: course.pages.length > 1 ? course.pages.filter((page) => page.id !== pageId) : course.pages,
      } : course),
    })
  }
  const deleteCourse = () => {
    if (!deleteCourseId) return
    updateState({ courses: state.courses.filter((course) => course.id !== deleteCourseId) }, '課程已刪除。')
    if (editingCourseId === deleteCourseId) {
      setEditingCourseId(null)
      setEditingPageId(null)
      setView('list')
    }
    setDeleteCourseId(null)
  }
  const confirmDeletePage = () => {
    if (!deletePageTarget) return
    deleteCoursePage(deletePageTarget.courseId, deletePageTarget.pageId)
    if (editingPageId === deletePageTarget.pageId) {
      setEditingPageId(null)
      setView('edit')
    }
    setDeletePageTarget(null)
  }
  const appendCoursePageFiles = (courseId: string, page: ClassroomCourse['pages'][number], files: FileList | null) => {
    if (!files?.length) return
    updateCoursePage(courseId, page.id, { resources: [...page.resources, ...Array.from(files).map((file) => file.name)] })
    setAttachmentMessage('附件已加入本機預覽清單；目前只保留檔名，正式檔案需 fork 後串接 Storage。')
  }
  const startCreateCourse = () => {
    const courseId = `course-${Date.now()}`
    const pageId = `page-${Date.now()}`
    const next: ClassroomCourse = {
      id: courseId,
      title: 'Untitled course',
      description: 'New classroom course created from the admin demo.',
      accessMode: 'open',
      published: false,
      pages: [{ id: pageId, title: 'Start here', minutes: 10, body: 'Add your first lesson page.', resources: [] }],
    }
    updateState({ courses: [next, ...state.courses] })
    setEditingCourseId(courseId)
    setEditingPageId(null)
    setView('edit')
  }
  useEscapeKey(Boolean(deleteCourseId), () => setDeleteCourseId(null))
  useEscapeKey(Boolean(deletePageTarget), () => setDeletePageTarget(null))

  if (view === 'lesson' && editingCourse && editingPage) {
    return (
      <div className="admin-grid">
        <article className="span-3">
          <div className="admin-page-actions">
            <Button variant="outline" className="secondary-button" type="button" onClick={() => setView('edit')}>Back to Course content</Button>
          </div>
          <SectionHeading eyebrow="Lesson editor" title={editingPage.title}>
            左側撰寫內容，右側管理單元設定與附件。
          </SectionHeading>
          <div className="lesson-editor-page">
            <div className="lesson-content-editor">
              <DeferredRichTextEditor
                value={editingPage.body}
                onChange={(body) => updateCoursePage(editingCourse.id, editingPage.id, { body })}
                ariaLabel="Lesson body"
                placeholder="撰寫文字、清單、引用，或用工具列加入圖片、影片與嵌入內容…"
              />
            </div>
            <aside className="lesson-settings-sidebar" aria-label="Lesson settings">
              <SectionHeading eyebrow="Settings" title="Lesson settings" />
              <label>Lesson title<Input aria-label="Lesson title" value={editingPage.title} onChange={(event) => updateCoursePage(editingCourse.id, editingPage.id, { title: event.target.value })} /></label>
              <label>Minutes<Input aria-label="Lesson minutes" type="number" min={1} value={editingPage.minutes} onChange={(event) => updateCoursePage(editingCourse.id, editingPage.id, { minutes: Number(event.target.value) })} /></label>
              <label>Transcript<Textarea aria-label="Lesson transcript" value={editingPage.transcript ?? ''} onChange={(event) => updateCoursePage(editingCourse.id, editingPage.id, { transcript: event.target.value })} /></label>
              <label>Attachments and resources<Textarea aria-label="Lesson resources" value={editingPage.resources.join('\n')} onChange={(event) => updateCoursePage(editingCourse.id, editingPage.id, { resources: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })} /></label>
              <label>Upload attachments<Input aria-label="Lesson attachments" type="file" multiple onChange={(event) => appendCoursePageFiles(editingCourse.id, editingPage, event.target.files)} /></label>
              {attachmentMessage && <p className="form-helper">{attachmentMessage}</p>}
            </aside>
          </div>
        </article>
        {deletePageTarget && deletePageItem && (
          <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeletePageTarget(null) }}>
            <div className="settings-modal" role="dialog" aria-modal="true" aria-label="確認刪除課程單元">
              <button className="modal-close" type="button" onClick={() => setDeletePageTarget(null)} aria-label="關閉刪除單元確認">×</button>
              <SectionHeading eyebrow="Delete lesson" title="確認刪除課程單元">
                這會移除「{deletePageItem.title}」。
              </SectionHeading>
              <div className="button-stack">
                <Button variant="outline" className="secondary-button" type="button" onClick={() => setDeletePageTarget(null)}>Cancel</Button>
                <Button variant="outline" className="secondary-button danger-button" type="button" onClick={confirmDeletePage}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (view === 'edit' && editingCourse) {
    return (
      <div className="admin-grid">
        <article className="span-3">
          <div className="admin-page-actions">
            <Button variant="outline" className="secondary-button" type="button" onClick={() => setView('list')}>Back to courses</Button>
          </div>
          <SectionHeading eyebrow="Course settings" title="Course content">
            編輯課程基本資料，並把每個單元當成獨立項目管理。
          </SectionHeading>
          <div className="settings-form">
            <label>Course title<Input aria-label="Edit course title" value={editingCourse.title} onChange={(event) => updateCourse(editingCourse.id, { title: event.target.value })} /></label>
            <label>Description<Textarea aria-label="Edit course description" value={editingCourse.description} onChange={(event) => updateCourse(editingCourse.id, { description: event.target.value })} /></label>
            <label>Access<select aria-label="Edit course access" value={editingCourse.accessMode} onChange={(event) => updateCourse(editingCourse.id, { accessMode: event.target.value as CourseAccessMode })}>
              <option value="open">Open</option>
              <option value="level-unlock">Level unlock</option>
              <option value="buy-now">Buy now</option>
              <option value="time-unlock">Time unlock</option>
              <option value="private">Private</option>
            </select></label>
            {editingCourse.accessMode === 'level-unlock' && <label>Level<Input aria-label="Edit course level" type="number" min={1} max={9} value={editingCourse.requiredLevel ?? 3} onChange={(event) => updateCourse(editingCourse.id, { requiredLevel: Number(event.target.value) })} /></label>}
            {editingCourse.accessMode === 'buy-now' && <label>Price<Input aria-label="Edit course price" value={editingCourse.price ?? ''} onChange={(event) => updateCourse(editingCourse.id, { price: event.target.value })} /></label>}
            {editingCourse.accessMode === 'time-unlock' && <label>Days<Input aria-label="Edit course unlock days" type="number" min={1} value={editingCourse.unlockAfterDays ?? 7} onChange={(event) => updateCourse(editingCourse.id, { unlockAfterDays: Number(event.target.value) })} /></label>}
            <label className="switch-row">
              <input type="checkbox" checked={editingCourse.published} onChange={(event) => updateCourse(editingCourse.id, { published: event.target.checked })} />
              <span>Published</span>
            </label>
            <div className="section-heading-row">
              <SectionHeading eyebrow="Course content" title="Lessons">
                每個單元都是一個項目，進入 Edit 後撰寫內容與上傳附件。
              </SectionHeading>
              <Button className="primary-button" type="button" onClick={() => addCoursePage(editingCourse.id)}><Plus data-icon="inline-start" />Add lesson</Button>
            </div>
            <div className="lesson-editor-list">
              {editingCourse.pages.map((page, index) => (
                <div key={page.id} className="lesson-item-row">
                  <div className="lesson-item-summary">
                    <strong>Lesson {index + 1}</strong>
                    <small>{page.title} · {page.minutes}m · {page.resources.length} attachments</small>
                  </div>
                  <div className="lesson-item-actions">
                    <Button variant="outline" className="secondary-button" type="button" onClick={() => { setEditingPageId(page.id); setView('lesson') }}><Pencil data-icon="inline-start" size={16} />Edit</Button>
                    <Button variant="outline" className="secondary-button danger-button" type="button" onClick={() => setDeletePageTarget({ courseId: editingCourse.id, pageId: page.id })} disabled={editingCourse.pages.length <= 1}><Trash2 data-icon="inline-start" size={16} />Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
        {deletePageTarget && deletePageItem && (
          <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeletePageTarget(null) }}>
            <div className="settings-modal" role="dialog" aria-modal="true" aria-label="確認刪除課程單元">
              <button className="modal-close" type="button" onClick={() => setDeletePageTarget(null)} aria-label="關閉刪除單元確認">×</button>
              <SectionHeading eyebrow="Delete lesson" title="確認刪除課程單元">
                這會移除「{deletePageItem.title}」。
              </SectionHeading>
              <div className="button-stack">
                <Button variant="outline" className="secondary-button" type="button" onClick={() => setDeletePageTarget(null)}>Cancel</Button>
                <Button variant="outline" className="secondary-button danger-button" type="button" onClick={confirmDeletePage}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="admin-grid">
      <article className="span-3">
        <div className="section-heading-row">
          <SectionHeading eyebrow="Courses" title="Courses" />
          <Button className="primary-button" type="button" onClick={startCreateCourse}><Plus data-icon="inline-start" />Add classroom course</Button>
        </div>
        <div className="course-access-editor">
          {state.courses.map((course) => (
            <div key={course.id} className="course-access-row course-summary-row">
              <div className="course-summary">
                <strong>{course.title}</strong>
                <small>{accessLabel(course.accessMode)} · {course.published ? 'Published' : 'Draft'}</small>
              </div>
              <div className="button-stack">
                <Button variant="outline" className="secondary-button" type="button" onClick={() => { setEditingCourseId(course.id); setView('edit') }}>Edit</Button>
                <Button variant="outline" className="secondary-button danger-button" type="button" onClick={() => setDeleteCourseId(course.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </article>
      {deleteCourseTarget && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteCourseId(null) }}>
          <div className="settings-modal" role="dialog" aria-modal="true" aria-label="確認刪除課程">
            <button className="modal-close" type="button" onClick={() => setDeleteCourseId(null)} aria-label="關閉刪除課程確認">×</button>
            <SectionHeading eyebrow="Delete course" title="確認刪除課程">
              這會移除「{deleteCourseTarget.title}」與其中所有 Lessons。
            </SectionHeading>
            <div className="button-stack">
              <Button variant="outline" className="secondary-button" type="button" onClick={() => setDeleteCourseId(null)}>Cancel</Button>
              <Button variant="outline" className="secondary-button danger-button" type="button" onClick={deleteCourse}>Delete</Button>
            </div>
          </div>
        </div>
      )}
      {deletePageTarget && deletePageItem && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeletePageTarget(null) }}>
          <div className="settings-modal" role="dialog" aria-modal="true" aria-label="確認刪除課程單元">
            <button className="modal-close" type="button" onClick={() => setDeletePageTarget(null)} aria-label="關閉刪除單元確認">×</button>
            <SectionHeading eyebrow="Delete lesson" title="確認刪除課程單元">
              這會移除「{deletePageItem.title}」。
            </SectionHeading>
            <div className="button-stack">
              <Button variant="outline" className="secondary-button" type="button" onClick={() => setDeletePageTarget(null)}>Cancel</Button>
              <Button variant="outline" className="secondary-button danger-button" type="button" onClick={confirmDeletePage}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminCalendar({ state, updateState, onAddEvent }: { state: AppState; updateState: (patch: Partial<AppState>) => void; onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void }) {
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [editEventId, setEditEventId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Omit<CalendarEvent, 'id'> | null>(null)
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Omit<CalendarEvent, 'id'>>({
    title: '',
    date: '2026-07-10',
    time: '20:00',
    duration: '60m',
    timezone: 'Asia/Taipei',
    location: 'MemberHub Call',
    recurrence: 'weekly',
    accessMode: 'all',
    description: 'Admin-created event.',
  })
  const updateEvent = (id: string, patch: Partial<CalendarEvent>) => {
    updateState({ events: state.events.map((event) => event.id === id ? { ...event, ...patch } : event) })
  }
  const openEditEvent = (event: CalendarEvent) => {
    const { id: _id, ...nextDraft } = event
    setEditDraft(nextDraft)
    setEditEventId(event.id)
  }
  const deleteEvent = () => {
    if (!deleteEventId) return
    updateState({ events: state.events.filter((event) => event.id !== deleteEventId) })
    setDeleteEventId(null)
  }
  const deleteTarget = state.events.find((event) => event.id === deleteEventId)
  useEscapeKey(addEventOpen, () => setAddEventOpen(false))
  useEscapeKey(Boolean(editEventId), () => {
    setEditEventId(null)
    setEditDraft(null)
  })
  useEscapeKey(Boolean(deleteEventId), () => setDeleteEventId(null))
  return (
    <div className="admin-grid">
      <article className="span-3">
        <div className="section-heading-row">
          <SectionHeading eyebrow="Events" title="Event access" />
          <Button className="primary-button" type="button" onClick={() => setAddEventOpen(true)}><Plus data-icon="inline-start" />Add event</Button>
        </div>
        <div className="event-access-list">
          {state.events.map((event) => (
            <div key={event.id} className="event-access-row">
              <div className="event-access-summary">
                <strong>{event.title}</strong>
                <small>{event.date} · {event.time} · {eventAccessLabel(event, state)}</small>
              </div>
              <label>Access<select aria-label={`${event.title} access`} value={event.accessMode ?? 'all'} onChange={(change) => updateEvent(event.id, { accessMode: change.target.value as CalendarEvent['accessMode'] })}>
                <option value="all">All members</option>
                <option value="level">Level</option>
                <option value="plan">Plan</option>
                <option value="course">Course</option>
              </select></label>
              {event.accessMode === 'level' && (
                <label>Level<Input aria-label={`${event.title} level`} type="number" min={1} max={9} value={event.requiredLevel ?? 2} onChange={(change) => updateEvent(event.id, { requiredLevel: Number(change.target.value) })} /></label>
              )}
              <div className="event-access-actions">
                <Button variant="outline" className="secondary-button" type="button" onClick={() => openEditEvent(event)}><Pencil data-icon="inline-start" size={16} />Edit</Button>
                <Button variant="outline" className="secondary-button danger-button" type="button" onClick={() => setDeleteEventId(event.id)}><Trash2 data-icon="inline-start" size={16} />Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </article>
      {addEventOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAddEventOpen(false)
          }}
        >
          <div className="event-modal" role="dialog" aria-modal="true" aria-label="新增活動">
            <button className="modal-close" type="button" onClick={() => setAddEventOpen(false)} aria-label="關閉新增活動">×</button>
            <SectionHeading eyebrow="Add event" title="新增活動">
              設定活動時間、地點與可見權限。
            </SectionHeading>
            <EventForm state={state} draft={draft} setDraft={setDraft} onAddEvent={onAddEvent} onDone={() => setAddEventOpen(false)} />
          </div>
        </div>
      )}
      {editEventId && editDraft && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditEventId(null)
          }}
        >
          <div className="event-modal" role="dialog" aria-modal="true" aria-label="編輯活動">
            <button className="modal-close" type="button" onClick={() => setEditEventId(null)} aria-label="關閉編輯活動">×</button>
            <SectionHeading eyebrow="Edit event" title="編輯活動">
              修改活動內容、時間、地點與可見權限。
            </SectionHeading>
            <EventForm state={state} draft={editDraft} setDraft={setEditDraft} onAddEvent={(event) => updateEvent(editEventId, event)} onDone={() => { setEditEventId(null); setEditDraft(null) }} />
          </div>
        </div>
      )}
      {deleteTarget && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDeleteEventId(null)
          }}
        >
          <div className="settings-modal" role="dialog" aria-modal="true" aria-label="確認刪除活動">
            <button className="modal-close" type="button" onClick={() => setDeleteEventId(null)} aria-label="關閉刪除活動確認">×</button>
            <SectionHeading eyebrow="Delete event" title="確認刪除活動">
              這會移除「{deleteTarget.title}」活動。
            </SectionHeading>
            <div className="button-stack">
              <Button variant="outline" className="secondary-button" type="button" onClick={() => setDeleteEventId(null)}>Cancel</Button>
              <Button variant="outline" className="secondary-button danger-button" type="button" onClick={deleteEvent}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminMembers({ state, updateState }: { state: AppState; updateState: (patch: Partial<AppState>, notice?: string) => void }) {
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [importMessage, setImportMessage] = useState('')
  const [memberConfirm, setMemberConfirm] = useState<{ action: 'remove' | 'ban'; memberId: string } | null>(null)
  const [memberDraft, setMemberDraft] = useState<{ name: string; email: string; role: Member['role']; planId: Plan['id'] }>({ name: '', email: '', role: 'member', planId: 'free' })
  const importInputRef = useRef<HTMLInputElement>(null)
  const selectedMember = state.members.find((member) => member.id === selectedMemberId)
  const editingMember = state.members.find((member) => member.id === editingMemberId)
  const confirmMember = memberConfirm ? state.members.find((member) => member.id === memberConfirm.memberId) : undefined
  const selectedApplication = selectedMember ? state.membershipApplications.find((application) => application.email.toLowerCase() === selectedMember.email.toLowerCase()) : undefined
  const updateMember = (id: string, patch: Partial<Member>, notice?: string) => updateState({ members: state.members.map((member) => member.id === id ? { ...member, ...patch } : member) }, notice)
  const toggleCourseAccess = (member: Member, courseId: string, checked: boolean) => {
    const courseIds = new Set(member.courseAccessIds ?? [])
    if (checked) courseIds.add(courseId)
    else courseIds.delete(courseId)
    updateMember(member.id, { courseAccessIds: Array.from(courseIds) })
  }
  const grantedCourseNames = (member: Member) => member.courseAccessIds?.map((id) => state.courses.find((course) => course.id === id)?.title ?? id).join(', ')
  const addMember = (event: FormEvent) => {
    event.preventDefault()
    const name = memberDraft.name.trim()
    const email = memberDraft.email.trim()
    if (!name || !email) return
    updateState({
      members: [{
        id: `member-${Date.now()}`,
        name,
        email,
        role: memberDraft.role,
        planId: memberDraft.planId,
        level: 1,
        points: 0,
        joinedAt: 'Today',
        posts: 0,
        comments: 0,
        status: 'active',
      }, ...state.members],
    }, '會員已新增。')
    setMemberDraft({ name: '', email: '', role: 'member', planId: 'free' })
    setAddMemberOpen(false)
  }
  const parseCsvLine = (line: string) => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''))
  const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const rows = text.split(/\r?\n/).map((row) => row.trim()).filter(Boolean)
    if (rows.length === 0) {
      setImportMessage('CSV 沒有可匯入的資料。')
      return
    }
    const first = parseCsvLine(rows[0]).map((cell) => cell.toLowerCase())
    const hasHeader = first.includes('email') || first.includes('name')
    const headers = hasHeader ? first : ['email', 'name', 'role', 'plan']
    const dataRows = hasHeader ? rows.slice(1) : rows
    const existingEmails = new Set(state.members.map((member) => member.email.toLowerCase()))
    const roles: Member['role'][] = ['owner', 'billing', 'admin', 'moderator', 'member']
    const planIds = new Set(state.plans.map((plan) => plan.id))
    const nextMembers = dataRows.flatMap((row, index) => {
      const cells = parseCsvLine(row)
      const record = Object.fromEntries(headers.map((header, headerIndex) => [header, cells[headerIndex] ?? '']))
      const email = String(record.email ?? cells[0] ?? '').trim().toLowerCase()
      if (!email.includes('@') || existingEmails.has(email)) return []
      existingEmails.add(email)
      const role = roles.includes(record.role as Member['role']) ? record.role as Member['role'] : 'member'
      const planId = planIds.has(record.plan as Plan['id']) ? record.plan as Plan['id'] : 'free'
      return [{
        id: `member-import-${Date.now()}-${index}`,
        name: String(record.name || email.split('@')[0]),
        email,
        role,
        planId,
        level: 1,
        points: 0,
        joinedAt: 'Imported',
        posts: 0,
        comments: 0,
        status: 'active' as const,
      }]
    })
    if (nextMembers.length === 0) {
      setImportMessage('沒有新增會員；可能是格式不符或 Email 已存在。')
      event.target.value = ''
      return
    }
    updateState({ members: [...nextMembers, ...state.members] }, `已匯入 ${nextMembers.length} 位會員。`)
    setImportMessage(`已匯入 ${nextMembers.length} 位會員。CSV 欄位可用 email,name,role,plan。`)
    event.target.value = ''
  }
  const runMemberConfirm = () => {
    if (!memberConfirm || !confirmMember) return
    if (memberConfirm.action === 'remove') updateMember(confirmMember.id, { status: 'removed' }, '會員已移除。')
    if (memberConfirm.action === 'ban') updateMember(confirmMember.id, { status: 'banned', chatBlocked: true }, '會員已封鎖。')
    setMemberConfirm(null)
  }
  useEscapeKey(addMemberOpen, () => setAddMemberOpen(false))
  useEscapeKey(Boolean(editingMember), () => setEditingMemberId(null))
  useEscapeKey(Boolean(selectedMember), () => setSelectedMemberId(null))
  useEscapeKey(Boolean(memberConfirm), () => setMemberConfirm(null))

  return (
    <div className="admin-grid">
      <article className="span-3">
        <div className="section-heading-row">
          <SectionHeading eyebrow="Members" title="Member operations" />
          <div className="button-stack">
            <input ref={importInputRef} className="sr-only-file" type="file" accept=".csv,text/csv" onChange={(event) => { void importCsv(event) }} aria-label="匯入 CSV 名單" />
            <Button variant="outline" className="secondary-button" type="button" onClick={() => importInputRef.current?.click()}><ClipboardCheck data-icon="inline-start" />匯入 .CSV 名單</Button>
            <Button className="primary-button" type="button" onClick={() => setAddMemberOpen(true)}><UserPlus data-icon="inline-start" />Add</Button>
          </div>
        </div>
        {importMessage && <p className="form-helper">{importMessage}</p>}
        <div className="member-admin-list">
          {state.members.map((member) => (
            <div
              key={member.id}
              className="member-admin-row"
            >
              <button
                className="member-record-button"
                type="button"
                onClick={() => setSelectedMemberId(member.id)}
                aria-label={`查看 ${member.name} 入社群問題記錄`}
              >
                <strong>{member.name}</strong>
                <small>{member.role} · {planLabel(member.planId)} · Level {levelForPoints(member.points, state.levelThresholds)} · {member.status ?? 'active'}</small>
                {(member.courseAccessIds?.length ?? 0) > 0 && <small>Granted: {grantedCourseNames(member)}</small>}
              </button>
              <Button variant="outline" className="secondary-button" type="button" onClick={() => setEditingMemberId(member.id)}><Pencil data-icon="inline-start" size={16} />Edit</Button>
            </div>
          ))}
        </div>
      </article>
      {addMemberOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAddMemberOpen(false)
          }}
        >
          <div className="settings-modal" role="dialog" aria-modal="true" aria-label="新增會員">
            <button className="modal-close" type="button" onClick={() => setAddMemberOpen(false)} aria-label="關閉新增會員">×</button>
            <SectionHeading eyebrow="Add member" title="新增會員">
              手動加入一位會員到社群名單。
            </SectionHeading>
            <form className="settings-form" onSubmit={addMember}>
              <label>Display name<Input aria-label="Member name" value={memberDraft.name} onChange={(event) => setMemberDraft({ ...memberDraft, name: event.target.value })} required /></label>
              <label>Email<Input aria-label="Member email" type="email" value={memberDraft.email} onChange={(event) => setMemberDraft({ ...memberDraft, email: event.target.value })} required /></label>
              <label>Role<select aria-label="Member role" value={memberDraft.role} onChange={(event) => setMemberDraft({ ...memberDraft, role: event.target.value as Member['role'] })}>
                <option value="owner">Owner</option>
                <option value="billing">Billing manager</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="member">Member</option>
              </select></label>
              <label>Plan<select aria-label="Member plan" value={memberDraft.planId} onChange={(event) => setMemberDraft({ ...memberDraft, planId: event.target.value as Plan['id'] })}>
                {state.plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
              </select></label>
              <div className="button-stack">
                <Button variant="outline" className="secondary-button" type="button" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
                <Button className="primary-button" type="submit">Add member</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editingMember && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditingMemberId(null)
          }}
        >
          <div className="settings-modal" role="dialog" aria-modal="true" aria-label="編輯會員">
            <button className="modal-close" type="button" onClick={() => setEditingMemberId(null)} aria-label="關閉編輯會員">×</button>
            <SectionHeading eyebrow="Member settings" title={editingMember.name}>
              {editingMember.email}
            </SectionHeading>
            <div className="settings-form">
              <p className="integration-note">角色、方案與課程授權目前會更新本機預覽；正式站需與 Auth/RLS 和後端權限同步。</p>
              <label>Role<select aria-label={`${editingMember.name} role`} value={editingMember.role} onChange={(event) => updateMember(editingMember.id, { role: event.target.value as Member['role'] })}>
                <option value="owner">Owner</option>
                <option value="billing">Billing manager</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="member">Member</option>
              </select></label>
              <label>Plan<select aria-label={`${editingMember.name} plan`} value={editingMember.planId} onChange={(event) => updateMember(editingMember.id, { planId: event.target.value as Plan['id'] })}>
                {state.plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
              </select></label>
              <label>Status<select aria-label={`${editingMember.name} status`} value={editingMember.status ?? 'active'} onChange={(event) => updateMember(editingMember.id, { status: event.target.value as Member['status'] })}>
                <option value="active">Active</option>
                <option value="removed">Removed</option>
                <option value="banned">Banned</option>
              </select></label>
              <div className="two-col">
                <label>Points<Input aria-label={`${editingMember.name} points`} type="number" min={0} value={editingMember.points} onChange={(event) => {
                  const points = Number(event.target.value)
                  updateMember(editingMember.id, { points, level: levelForPoints(points, state.levelThresholds) })
                }} /></label>
                <label>Level<Input aria-label={`${editingMember.name} computed level`} value={`Level ${levelForPoints(editingMember.points, state.levelThresholds)}`} readOnly /></label>
              </div>
              <label className="switch-row"><input type="checkbox" checked={Boolean(editingMember.chatBlocked)} onChange={(event) => updateMember(editingMember.id, { chatBlocked: event.target.checked })} />Block chat</label>
              <div className="course-permission-list" aria-label="Course permissions">
                {state.courses.map((course) => (
                  <label key={course.id}>
                    <input
                      type="checkbox"
                      aria-label={`${editingMember.name} ${course.title} access`}
                      checked={Boolean(editingMember.courseAccessIds?.includes(course.id))}
                      onChange={(event) => toggleCourseAccess(editingMember, course.id, event.target.checked)}
                    />
                    <span>{course.title}</span>
                  </label>
                ))}
              </div>
              <div className="member-editor-actions">
                <Button variant="outline" className="secondary-button" type="button" onClick={() => setMemberConfirm({ action: 'remove', memberId: editingMember.id })}>Remove</Button>
                <Button variant="outline" className="secondary-button danger-button" type="button" onClick={() => setMemberConfirm({ action: 'ban', memberId: editingMember.id })}>Ban</Button>
                <Button className="primary-button" type="button" onClick={() => setEditingMemberId(null)}>Done</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedMember && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedMemberId(null)
          }}
        >
          <div className="settings-modal" role="dialog" aria-modal="true" aria-label="會員入社群問題記錄">
            <button className="modal-close" type="button" onClick={() => setSelectedMemberId(null)} aria-label="關閉會員記錄">×</button>
            <SectionHeading eyebrow="Member record" title={selectedMember.name}>
              {selectedMember.email}
            </SectionHeading>
            <div className="compact-list">
              <p><strong>Role</strong><span>{selectedMember.role}</span></p>
              <p><strong>Plan</strong><span>{planLabel(selectedMember.planId)}</span></p>
              <p><strong>Join status</strong><span>{selectedApplication ? applicationStatusLabel(selectedApplication.status) : '無申請記錄'}</span></p>
            </div>
            <div className="application-answers member-question-record">
              {selectedApplication ? Object.entries(selectedApplication.answers).map(([question, answer]) => (
                <p key={question}><span>{question}</span><strong>{answer}</strong></p>
              )) : <p className="empty-note">這位會員沒有入社群問題記錄。</p>}
            </div>
          </div>
        </div>
      )}
      {memberConfirm && confirmMember && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMemberConfirm(null)
          }}
        >
          <div className="settings-modal" role="dialog" aria-modal="true" aria-label="確認會員操作">
            <button className="modal-close" type="button" onClick={() => setMemberConfirm(null)} aria-label="關閉會員操作確認">×</button>
            <SectionHeading eyebrow="Confirm member action" title={`確認${memberConfirm.action === 'remove' ? '移除' : '封鎖'} ${confirmMember.name}`}>
              這會更新會員狀態與可用權限。
            </SectionHeading>
            <div className="button-stack">
              <Button variant="outline" className="secondary-button" type="button" onClick={() => setMemberConfirm(null)}>Cancel</Button>
              <Button variant="outline" className="secondary-button danger-button" type="button" onClick={runMemberConfirm}>Confirm</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminPricing({ state }: { state: AppState }) {
  return (
    <div className="admin-grid">
      <article className="span-3">
        <SectionHeading eyebrow="Pricing" title="方案設定">
          目前只顯示本機預覽方案；正式收款可在 fork 後接上你選擇的付款服務。
        </SectionHeading>
        <div className="compact-list">
          {state.plans.map((plan) => (
            <p key={plan.id}>
              <strong>{plan.name}</strong>
              <span>{plan.price} / {plan.cadence}</span>
            </p>
          ))}
        </div>
      </article>
    </div>
  )
}

function AdminPlugins({ state, updateState }: { state: AppState; updateState: (patch: Partial<AppState>) => void }) {
  return (
    <div className="admin-grid">
      <article className="span-3">
        <SectionHeading eyebrow="Plugins" title="功能旗標">
          這裡的開關目前會控制本機預覽狀態；外部服務需要 fork 後另外串接。
        </SectionHeading>
      </article>
      <div className="plugin-grid span-3">
        {state.plugins.map((plugin) => (
          <article key={plugin.id} className="plugin-card">
            <div>
              <h3>{plugin.name}</h3>
              <p>{plugin.description}</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={plugin.enabled}
                onChange={(event) => updateState({ plugins: state.plugins.map((item) => (item.id === plugin.id ? { ...item, enabled: event.target.checked } : item)) })}
              />
              <span>{plugin.enabled ? 'Enabled' : 'Disabled'}</span>
            </label>
          </article>
        ))}
      </div>
    </div>
  )
}

export default App
