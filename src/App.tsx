import { useEffect, useMemo, useState } from 'react'
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
import { createCheckoutSessionPreview, paymentEventToCallbackPayload, portalyIntegrationNotes } from './lib/portaly'
import { createPaymentEvent, loadState, presetLabel, resetState, roleLabel, saveState } from './lib/store'
import type { AppState, ContentItem, Member, ModerationItem, NewsletterIssue, Plan, PresetId, ReferralCampaign, Role, ViewId } from './types'
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

function isPresetId(value: string): value is PresetId {
  return validPresetIds.has(value as PresetId)
}

function isViewId(value: string): value is ViewId {
  return validViewIds.has(value as ViewId)
}

function getInitialRoute() {
  if (typeof window === 'undefined') return { presetId: undefined, view: undefined }
  const params = new URLSearchParams(window.location.search)
  const caseParam = params.get('case') ?? params.get('preset')
  const viewParam = params.get('view')

  return {
    presetId: caseParam && isPresetId(caseParam) ? caseParam : undefined,
    view: viewParam && isViewId(viewParam) ? viewParam : undefined,
  }
}

function App() {
  const initialRoute = useMemo(() => getInitialRoute(), [])
  const [state, setState] = useState<AppState>(() => {
    const storedState = loadState()
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

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('case', state.presetId)
    params.set('view', view)
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
  }, [state.presetId, view])

  const preset = useMemo(() => getPreset(state.presetId), [state.presetId])
  const runtimePreset = useMemo(
    () => ({
      ...preset,
      content: [...state.localContentItems, ...preset.content],
      newsletter: [...state.localNewsletterIssues, ...preset.newsletter],
      referrals: [...state.localReferralCampaigns, ...preset.referrals],
      members: [...state.localMembers, ...preset.members],
      moderation: [...state.localModeration, ...preset.moderation],
    }),
    [preset, state.localContentItems, state.localMembers, state.localModeration, state.localNewsletterIssues, state.localReferralCampaigns],
  )
  const selectedPlan = runtimePreset.plans.find((plan) => plan.id === state.selectedPlanId) ?? runtimePreset.plans[0]
  const currentMember = runtimePreset.members[0]
  const activeLevel = state.role === 'visitor' ? 0 : currentMember.level
  const hasPaidAccess = state.role === 'admin' || state.selectedPlanId !== 'free'

  const updateState = (patch: Partial<AppState>) => setState((prev) => ({ ...prev, ...patch }))

  const handlePresetChange = (presetId: PresetId) => {
    const nextPreset = getPreset(presetId)
    updateState({
      presetId,
      selectedPlanId: 'free',
      completedLessons: [],
      checkedInChallenges: [],
      paymentEvents: [],
      localContentItems: [],
      localNewsletterIssues: [],
      localReferralCampaigns: [],
      localMembers: [],
      localModeration: [],
    })
    document.documentElement.style.setProperty('--brand-primary', nextPreset.brand.primary)
    document.documentElement.style.setProperty('--brand-accent', nextPreset.brand.accent)
  }

  const handleRoleChange = (role: Role) => {
    updateState({ role, selectedPlanId: role === 'visitor' ? 'free' : state.selectedPlanId })
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
    updateState({
      role,
      selectedPlanId: role === 'admin' ? 'monthly' : state.selectedPlanId,
    })
    setView(role === 'admin' ? 'admin' : 'member')
  }

  const handleLogout = () => {
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
      email: `member${serial}@example.com`,
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

  return (
    <main className="app-shell" style={{ ['--brand-primary' as string]: runtimePreset.brand.primary, ['--brand-accent' as string]: runtimePreset.brand.accent }}>
      <aside className="sidebar">
        <button className="brand-button" onClick={() => setView('home')} aria-label="Open home">
          <span className="brand-mark">M</span>
          <span>
            <strong>MemberHub</strong>
            <small>{runtimePreset.name}</small>
          </span>
        </button>

        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

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
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">私有化會員平台</p>
            <h1>{runtimePreset.brand.productName}</h1>
          </div>
          <div className="topbar-actions">
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
            {state.role === 'visitor' ? (
              <Button className="primary-button" onClick={() => setView('login')}><LogIn data-icon="inline-start" />登入</Button>
            ) : (
              <Button variant="outline" className="ghost-button" onClick={handleLogout}>登出</Button>
            )}
          </div>
        </header>

        {view === 'home' && (
          <HomeView
            preset={runtimePreset}
            role={state.role}
            selectedPlan={selectedPlan}
            onOpenBlog={() => setView('blog')}
            onOpenJoin={() => setView('join')}
          />
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
            onCheckout={handleCheckout}
          />
        )}
        {view === 'content' && (
          <ContentView
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
        {view === 'login' && <LoginView preset={runtimePreset} onLogin={handleLogin} />}
        {view === 'member' && <MemberView preset={runtimePreset} state={state} selectedPlan={selectedPlan} />}
        {view === 'admin' && <AdminView preset={runtimePreset} state={state} />}
        {view === 'setup' && <SetupView presetId={state.presetId} />}
      </section>
    </main>
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
            <MetricTile label="MRR" value={preset.metrics.mrr} icon={BarChart3} />
            <MetricTile label="會員" value={String(preset.metrics.activeMembers)} icon={UsersRound} />
            <MetricTile label="轉換率" value={preset.metrics.conversion} icon={ChevronRight} />
            <MetricTile label="目前方案" value={selectedPlan.name} icon={ShieldCheck} />
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <span className="eyebrow">Before joining</span>
          <h3>加入前可以先看見的內容與社群節奏</h3>
        </div>
        <div className="plan-grid">
          <article className="plan-card">
            <span className="plan-name">公開內容</span>
            <strong>{publicContent.length}</strong>
            <small>可直接閱讀</small>
            <p>{publicContent.map((item) => item.title.replace(/^公開文章：/, '')).join('、')}</p>
            <Button variant="outline" onClick={onOpenBlog}>閱讀公開文章</Button>
          </article>
          <article className="plan-card highlighted">
            <span className="plan-name">會員內容</span>
            <strong>{paidContent.length}</strong>
            <small>加入後解鎖</small>
            <p>{paidContent.map((item) => item.category).join('、')}，適合想持續深入學習或追蹤的人。</p>
            <Button onClick={onOpenJoin}>查看會員方案</Button>
          </article>
          <article className="plan-card">
            <span className="plan-name">課程與社群</span>
            <strong>{firstCourse?.progress ?? 0}%</strong>
            <small>持續更新</small>
            <p>{firstCourse?.description ?? preset.audience}</p>
            <Button variant="outline" onClick={onOpenJoin}>加入後開始使用</Button>
          </article>
        </div>
      </section>
    </div>
  )
}

function BlogView({
  preset,
  hasPaidAccess,
  onJoin,
}: {
  preset: ReturnType<typeof getPreset>
  hasPaidAccess: boolean
  onJoin: () => void
}) {
  const publicPosts = preset.content.filter((item) => !item.isPaid)
  const memberPosts = preset.content.filter((item) => item.isPaid)
  const featurePost = publicPosts[0] ?? preset.content[0]

  return (
    <section className="section-block">
      <div className="section-heading horizontal">
        <div>
          <span className="eyebrow">{preset.id === 'superstake' ? 'Publication' : 'Public community page'}</span>
          <h3>{preset.id === 'superstake' ? 'SuperStake 公開部落格' : 'Skills School 社群預覽頁'}</h3>
        </div>
        <Button className="primary-button" onClick={onJoin}><CircleDollarSign data-icon="inline-start" />加入會員</Button>
      </div>

      <article className="hero-product blog-feature">
        <Badge variant="outline" className="pill">{featurePost.category}</Badge>
        <h4>{featurePost.title}</h4>
        <p>{featurePost.excerpt}</p>
        <small>{featurePost.minutes} min read · {preset.brand.creatorName}</small>
      </article>

      <div className="content-list blog-list">
        {publicPosts.map((item) => (
          <article key={item.id} className="content-row">
            <div>
              <Badge variant="outline" className="pill">{item.type}</Badge>
              <h4>{item.title}</h4>
              <p>{item.excerpt}</p>
              <small>{item.category} · {item.minutes} min · {item.source}</small>
            </div>
            <span className="access-ok"><CheckCircle2 size={16} />可閱讀</span>
          </article>
        ))}
        {memberPosts.slice(0, 3).map((item) => (
          <article key={item.id} className="content-row">
            <div>
              <Badge variant="outline" className="pill">會員限定</Badge>
              <h4>{item.title}</h4>
              <p>{item.excerpt}</p>
              <small>{item.category} · {item.minutes} min</small>
            </div>
            {hasPaidAccess ? <span className="access-ok"><CheckCircle2 size={16} />可閱讀</span> : <Button className="lock-button" onClick={onJoin}><Lock data-icon="inline-start" />加入後閱讀</Button>}
          </article>
        ))}
      </div>
    </section>
  )
}

function JoinView({
  preset,
  onCheckout,
}: {
  preset: ReturnType<typeof getPreset>
  onCheckout: (plan: Plan) => void
}) {
  const memberPlan = preset.plans.find((plan) => plan.highlighted) ?? preset.plans[1]

  return (
    <section className="section-block">
      <div className="section-heading horizontal">
        <div>
          <span className="eyebrow">{preset.id === 'skills-school' ? 'Join the community' : 'Subscribe'}</span>
          <h3>{preset.id === 'skills-school' ? '加入 Skills School，開始課程、社群與每週實作' : '訂閱 SuperStake，閱讀完整研究與會員專欄'}</h3>
        </div>
        <Button className="primary-button" onClick={() => onCheckout(memberPlan)}><CircleDollarSign data-icon="inline-start" />選擇 {memberPlan.name}</Button>
      </div>
      <div className="plan-grid">
        {preset.plans.map((plan) => (
          <article key={plan.id} className={plan.highlighted ? 'plan-card highlighted' : 'plan-card'}>
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
              {plan.price === 'NT$0' ? '加入免費方案' : '選擇此方案'}
            </Button>
          </article>
        ))}
      </div>
      <div className="self-service-grid join-proof">
        <article>
          <h4>{preset.id === 'skills-school' ? '加入後會看到什麼' : '訂閱後會收到什麼'}</h4>
          <ul className="check-list">
            <li><CheckCircle2 size={16} />完整內容庫與會員限定文章</li>
            <li><CheckCircle2 size={16} />課程、資源、直播或問答回放</li>
            <li><CheckCircle2 size={16} />會員社群、討論與活動通知</li>
          </ul>
        </article>
        <article>
          <h4>適合的人</h4>
          <p>{preset.audience}</p>
        </article>
      </div>
    </section>
  )
}

function ContentView({
  items,
  query,
  onQuery,
  hasPaidAccess,
  canCreateContent,
  onCreateContent,
  onCheckout,
}: {
  items: ContentItem[]
  query: string
  onQuery: (value: string) => void
  hasPaidAccess: boolean
  canCreateContent: boolean
  onCreateContent: (item: Omit<ContentItem, 'id' | 'source' | 'minutes'>) => void
  onCheckout: () => void
}) {
  const [draft, setDraft] = useState({
    title: '',
    type: 'article' as ContentItem['type'],
    category: '公開內容',
    excerpt: '',
    body: '',
    isPaid: false,
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
    })
    setDraft({
      title: '',
      type: 'article',
      category: '公開內容',
      excerpt: '',
      body: '',
      isPaid: false,
    })
  }

  return (
    <section className="section-block">
      <div className="section-heading horizontal">
        <div>
          <span className="eyebrow">Public blog + member library</span>
          <h3>公開文章、會員內容與付費牆</h3>
        </div>
        <label className="search-box">
          <Search size={18} />
          <Input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="搜尋內容、分類、類型" />
        </label>
      </div>

      {canCreateContent && (
        <article className="editor-panel" aria-label="Content editor">
          <div className="editor-head">
            <div>
              <span className="eyebrow">Post editor</span>
              <h4>發文編輯器</h4>
            </div>
            <StatusPill tone={draft.isPaid ? 'blue' : 'green'}>{draft.isPaid ? 'paid' : 'free'}</StatusPill>
          </div>
          <div className="editor-grid">
            <label>
              標題
              <Input value={draft.title} onChange={(event) => updateDraft({ title: event.target.value })} placeholder="輸入文章標題" />
            </label>
            <label>
              分類
              <Input value={draft.category} onChange={(event) => updateDraft({ category: event.target.value })} placeholder="公開內容 / 會員課 / 公告" />
            </label>
            <label>
              類型
              <select className="editor-select" value={draft.type} onChange={(event) => updateDraft({ type: event.target.value as ContentItem['type'] })}>
                <option value="article">article</option>
                <option value="video">video</option>
                <option value="podcast">podcast</option>
                <option value="resource">resource</option>
                <option value="newsletter">newsletter</option>
              </select>
            </label>
            <label className="editor-toggle">
              <input type="checkbox" checked={draft.isPaid} onChange={(event) => updateDraft({ isPaid: event.target.checked })} />
              會員限定 / 付費牆
            </label>
          </div>
          <label className="editor-field">
            摘要
            <Input value={draft.excerpt} onChange={(event) => updateDraft({ excerpt: event.target.value })} placeholder="列表與分享時顯示的短摘要" />
          </label>
          <label className="editor-field">
            內文
            <Textarea value={draft.body} onChange={(event) => updateDraft({ body: event.target.value })} placeholder="撰寫文章、課程公告或 newsletter 內容..." />
          </label>
          <div className="editor-actions">
            <small>{draft.body.length} chars · 預估 {Math.max(3, Math.ceil(draft.body.length / 220))} min</small>
            <Button className="primary-button" type="button" disabled={!canPublish} onClick={handlePublish}><FileText data-icon="inline-start" />發布到內容庫</Button>
          </div>
        </article>
      )}

      <div className="content-list">
        {items.map((item) => {
          const locked = item.isPaid && !hasPaidAccess
          return (
            <article key={item.id} className="content-row">
              <div>
              <Badge variant="outline" className="pill">{item.type}</Badge>
                <h4>{item.title}</h4>
                <p>{item.excerpt}</p>
                <small>{item.category} · {item.minutes} min · {item.source}</small>
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
  return (
    <section className="section-block">
      <div className="section-heading horizontal">
        <div>
          <span className="eyebrow">Newsletter + growth</span>
          <h3>Email/LINE 通訊、付費轉換與推薦贈閱</h3>
        </div>
        <div className="button-row compact">
          <Button variant="outline" className="secondary-button" onClick={onAddIssue}><Mail data-icon="inline-start" />新增 issue</Button>
          <Button className="primary-button" onClick={onCreateReferral}><Gift data-icon="inline-start" />建立贈閱碼</Button>
        </div>
      </div>

      <div className="newsletter-grid">
        <article className="newsletter-panel span-2">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">Broadcasts</span>
              <h4>發送排程與內容存檔</h4>
            </div>
            <Megaphone size={18} />
          </div>
          <div className="admin-content-stack">
            {preset.newsletter.map((issue) => (
              <div key={issue.id} className="newsletter-row">
                <span>
                  <Badge variant="outline" className="pill">{issue.segment} · {issue.status}</Badge>
                  <strong>{issue.subject}</strong>
                  <small>{issue.sendAt} · open {issue.openRate} · click {issue.clickRate}</small>
                </span>
                <StatusPill tone={issue.paidConversions > 0 ? 'green' : 'yellow'}>{`${issue.paidConversions} paid`}</StatusPill>
              </div>
            ))}
          </div>
        </article>

        <article className="newsletter-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">Notification adapter</span>
              <h4>Email / LINE / 站內通知</h4>
            </div>
            <Bell size={18} />
          </div>
          <div className="admin-content-stack">
            {preset.notifications.map((notification) => (
              <div key={notification.id} className="admin-content-item">
                <Badge variant="outline" className="pill">{notification.channel}</Badge>
                <strong>{notification.trigger}</strong>
                <small>{notification.audience} · {notification.status}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="newsletter-panel span-2">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">Referral engine</span>
              <h4>推薦碼、贈閱與來源歸因</h4>
            </div>
            <Hash size={18} />
          </div>
          <div className="referral-grid">
            {preset.referrals.map((campaign) => (
              <div key={campaign.id} className="referral-card">
                <Badge variant="outline" className="pill">{campaign.code}</Badge>
                <strong>{campaign.label}</strong>
                <small>{campaign.source} · {campaign.reward}</small>
                <div className="referral-metrics">
                  <span>{campaign.freeTrials} trials</span>
                  <span>{campaign.paidConversions} paid</span>
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

function LoginView({ preset, onLogin }: { preset: ReturnType<typeof getPreset>; onLogin: (role?: Role) => void }) {
  const [email, setEmail] = useState('member@example.com')

  return (
    <section className="auth-layout">
      <article className="auth-card">
        <span className="eyebrow">Sign in</span>
        <h3>登入 {preset.brand.productName}</h3>
        <p>使用會員身份進入內容區，或用管理員身份查看營運後台。正式部署時可接 InsForge Google OAuth、Magic Link 或 email/password。</p>
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault()
            onLogin('member')
          }}
        >
          <label>
            Email
            <span className="auth-input">
              <Mail size={18} />
              <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
            </span>
          </label>
          <Button className="primary-button" type="submit"><LogIn data-icon="inline-start" />以會員身份登入</Button>
        </form>
        <div className="button-row">
          <Button variant="outline" className="secondary-button" onClick={() => onLogin('member')}>以 Google 帳號登入</Button>
          <Button variant="outline" className="ghost-button" onClick={() => onLogin('admin')}>管理員登入</Button>
        </div>
      </article>
      <article className="auth-notes">
        <h4>正式登入設定</h4>
        <ul className="check-list">
          <li><CheckCircle2 size={16} />InsForge Auth：Google OAuth 或 email magic link</li>
          <li><CheckCircle2 size={16} />登入後建立 `profiles` 與 `memberships`</li>
          <li><CheckCircle2 size={16} />RLS 依會員方案保護內容、課程與社群</li>
          <li><CheckCircle2 size={16} />透過 Portaly Vibe MCP 檢查會員設定與產品狀態</li>
        </ul>
      </article>
    </section>
  )
}

function CoursesView({
  preset,
  level,
  completedLessons,
  onToggleLesson,
}: {
  preset: ReturnType<typeof getPreset>
  level: number
  completedLessons: string[]
  onToggleLesson: (lessonId: string) => void
}) {
  return (
    <section className="section-block">
      <div className="section-heading">
        <span className="eyebrow">Classroom</span>
        <h3>課程、進度與等級解鎖</h3>
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
                    <button className="lesson-row" disabled={locked} onClick={() => onToggleLesson(lesson.id)}>
                      {locked ? <Lock size={16} /> : <CheckCircle2 size={16} />}
                      <span>{lesson.title}</span>
                      <small>{locked ? `Level ${lesson.lockedLevel}` : `${lesson.minutes} min`}</small>
                    </button>
                    <div className="lesson-meta">
                      {lesson.transcript && <span><FileText size={14} />逐字稿可搜尋</span>}
                      {lesson.pinnedThreadId && <span><MessageSquareText size={14} />已連到課程討論</span>}
                    </div>
                    {lesson.resources && lesson.resources.length > 0 && (
                      <div className="resource-list">
                        {lesson.resources.map((resource) => (
                          <Badge key={resource.id} variant="outline" className="pill">{resource.kind} · {resource.access}</Badge>
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
        <span className="eyebrow">Community</span>
        <h3>分類、權限、公告、留言與反應</h3>
      </div>
      <div className="thread-list">
        {preset.threads.map((thread) => {
          const hidden = thread.adminOnly && role === 'visitor'
          return (
            <article key={thread.id} className={hidden ? 'thread-row locked' : 'thread-row'}>
              <div>
                <Badge variant="outline" className="pill">{thread.category}{thread.pinned ? ' · 置頂' : ''}</Badge>
                <h4>{hidden ? '會員限定討論串' : thread.title}</h4>
                <small>by {thread.author} · {thread.replies} replies · {thread.reactions} reactions · start: {thread.canStart ?? 'all'}{thread.reportCount ? ` · ${thread.reportCount} report` : ''}</small>
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
          <span className="eyebrow">Member directory</span>
          <h3>會員目錄、角色、個人頁與活躍度</h3>
        </div>
        <div className="button-row compact">
          <Button variant="outline" className="secondary-button" onClick={onInviteMember}><UserRound data-icon="inline-start" />邀請會員</Button>
          <Button variant="outline" className="ghost-button" onClick={onOpenMembershipQuestions}><ClipboardCheck data-icon="inline-start" />入會問題</Button>
        </div>
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
                  <StatusPill tone={member.risk === 'high' ? 'red' : member.risk === 'medium' ? 'yellow' : 'green'}>{member.risk}</StatusPill>
                </div>
                <p>{member.bio}</p>
                <small>{canSeeEmail ? `${member.email} · ` : ''}{member.groupRole} · {plan?.name ?? member.planId} · joined {member.joinedAt}</small>
                <div className="member-stats">
                  <span>Level {member.level}</span>
                  <span>{member.points} pts</span>
                  <span>{member.contributions.posts} posts</span>
                  <span>{member.contributions.comments} comments</span>
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
  const searchTerm = query.trim().toLowerCase()
  const results = useMemo(() => {
    const rows: Array<{ id: string; type: string; title: string; meta: string; text: string }> = []
    preset.content.forEach((item) => rows.push({ id: item.id, type: item.type, title: item.title, meta: `${item.category} · ${item.source}`, text: `${item.title} ${item.category} ${item.excerpt} ${item.body}` }))
    preset.newsletter.forEach((issue) => rows.push({ id: issue.id, type: 'newsletter', title: issue.subject, meta: `${issue.segment} · ${issue.status}`, text: `${issue.subject} ${issue.segment} ${issue.status}` }))
    preset.courses.forEach((course) => {
      rows.push({ id: course.id, type: 'course', title: course.title, meta: `${course.progress}% complete`, text: `${course.title} ${course.description}` })
      course.lessons.forEach((lesson) => rows.push({ id: lesson.id, type: 'lesson', title: lesson.title, meta: `${course.title} · ${lesson.minutes} min`, text: `${lesson.title} ${lesson.transcript ?? ''} ${(lesson.resources ?? []).map((resource) => resource.title).join(' ')}` }))
    })
    preset.threads.forEach((thread) => rows.push({ id: thread.id, type: 'thread', title: thread.title, meta: `${thread.category} · ${thread.replies} replies`, text: `${thread.title} ${thread.category} ${thread.author}` }))
    preset.members.forEach((member) => rows.push({ id: member.id, type: 'member', title: member.name, meta: `${member.groupRole} · level ${member.level}`, text: `${member.name} ${member.bio} ${member.source} ${member.groupRole}` }))
    preset.events.forEach((event) => rows.push({ id: event.id, type: 'event', title: event.title, meta: `${event.kind} · ${event.date}`, text: `${event.title} ${event.description} ${event.audience}` }))

    if (!searchTerm) return rows
    return rows.filter((row) => row.text.toLowerCase().includes(searchTerm))
  }, [preset, searchTerm])

  return (
    <section className="section-block">
      <div className="section-heading horizontal">
        <div>
          <span className="eyebrow">Global search</span>
          <h3>搜尋文章、課程、逐字稿、討論、活動與會員</h3>
        </div>
        <label className="search-box">
          <Search size={18} />
          <Input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="輸入關鍵字，例如 逐字稿、直播、Yuna" />
        </label>
      </div>
      <div className="search-results">
        {results.map((result) => (
          <article key={`${result.type}-${result.id}`} className="search-result">
            <Badge variant="outline" className="pill">{result.type}</Badge>
            <span>
              <strong>{result.title}</strong>
              <small>{result.meta}</small>
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}

function ChallengesView({
  preset,
  checkedInChallenges,
  onCheckIn,
}: {
  preset: ReturnType<typeof getPreset>
  checkedInChallenges: string[]
  onCheckIn: (challengeId: string) => void
}) {
  return (
    <section className="section-block">
      <div className="section-heading">
        <span className="eyebrow">Gamification</span>
        <h3>打卡挑戰、積分、等級與排行榜</h3>
      </div>
      <div className="challenge-grid">
        {preset.challenges.map((challenge) => {
          const done = checkedInChallenges.includes(challenge.id)
          return (
            <article key={challenge.id} className="challenge-card">
              <Flame size={22} />
              <h4>{challenge.title}</h4>
              <p>{challenge.cadence} · {challenge.participants} participants</p>
              <strong>{challenge.streak} streak · +{challenge.points} pts</strong>
              <button disabled={done} onClick={() => onCheckIn(challenge.id)}>{done ? '今日已打卡' : '完成打卡'}</button>
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
              <small>Level {member.level} · {member.points} pts</small>
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
        <span className="eyebrow">Calendar</span>
        <h3>Webinar、Live、Office hour 與回放</h3>
      </div>
      <div className="event-grid">
        {preset.events.map((event) => (
          <article key={event.id} className="event-card">
            <Badge variant="outline" className="pill">{event.kind} · {event.status}</Badge>
            <h4>{event.title}</h4>
            <p>{event.description}</p>
            <small>{event.date} · audience: {event.audience} · replay: {event.replayAccess}</small>
          </article>
        ))}
      </div>
    </section>
  )
}

function MemberView({ preset, state, selectedPlan }: { preset: ReturnType<typeof getPreset>; state: AppState; selectedPlan: Plan }) {
  const lastEvent = state.paymentEvents[0]
  return (
    <section className="section-block">
      <div className="section-heading">
        <span className="eyebrow">Member self-service</span>
        <h3>會員方案、收據/發票狀態與付款自助</h3>
      </div>
      <div className="member-grid">
        <MetricTile label="目前方案" value={selectedPlan.name} icon={ShieldCheck} />
        <MetricTile label="會員狀態" value={state.role === 'visitor' ? '訪客' : 'active'} icon={UserRound} />
        <MetricTile label="收據/發票" value={lastEvent?.invoiceStatus ?? 'not_required'} icon={CircleDollarSign} />
        <MetricTile label="Portaly Portal" value="ready" icon={ChevronRight} />
      </div>
      <div className="self-service-grid">
        <article>
          <h4>付款與訂閱自助</h4>
          <ul className="check-list">
            <li><CircleDollarSign size={16} />更新付款方式、取消訂閱、恢復訂閱由 Portaly Portal 處理</li>
            <li><FileText size={16} />收據 / 發票狀態同步到 `payment_events.invoice_status`</li>
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
      <pre className="code-block">{JSON.stringify(lastEvent ? paymentEventToCallbackPayload(lastEvent) : { status: 'no_payment_yet' }, null, 2)}</pre>
    </section>
  )
}

function AdminView({ preset, state }: { preset: ReturnType<typeof getPreset>; state: AppState }) {
  const paidMembers = preset.members.filter((member) => member.status === 'active').length
  const paidContent = preset.content.filter((item) => item.isPaid).length
  const totalLessons = preset.courses.reduce((count, course) => count + course.lessons.length, 0)
  const adminQueue = [
    { label: '內容草稿待審', value: `${paidContent + 2}`, tone: 'yellow' },
    { label: '社群檢舉待處理', value: `${preset.moderation.filter((item) => item.status !== 'resolved').length}`, tone: 'red' },
    { label: '付款狀態待確認', value: `${state.paymentEvents.length}`, tone: 'blue' },
    { label: 'Newsletter 排程', value: `${preset.newsletter.filter((issue) => issue.status === 'scheduled').length}`, tone: 'green' },
  ]

  return (
    <div className="admin-workspace">
      <section className="section-block admin-hero">
        <div className="section-heading">
          <span className="eyebrow">Admin workspace</span>
          <h3>{preset.brand.productName} 營運後台</h3>
          <p>這裡集中管理會員、內容、課程、社群、活動、金流、發票與產品設定狀態，適合每天檢查營運進度。</p>
        </div>
        <div className="admin-grid">
          <MetricTile label="MRR" value={preset.metrics.mrr} icon={BarChart3} />
          <MetricTile label="Active members" value={String(preset.metrics.activeMembers)} icon={UsersRound} />
          <MetricTile label="Paid members" value={String(paidMembers)} icon={ShieldCheck} />
          <MetricTile label="Top source" value={preset.metrics.topSource} icon={Globe2} />
        </div>
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-panel span-2">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">Members</span>
              <h4>會員與訂閱狀態</h4>
            </div>
            <Button variant="outline" className="ghost-button"><SlidersHorizontal data-icon="inline-start" />篩選</Button>
          </div>
          <div className="admin-table">
            <div className="admin-table-head">
              <span>會員</span>
              <span>方案</span>
              <span>狀態</span>
              <span>來源</span>
              <span>等級</span>
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
                  <span><StatusPill tone={member.status === 'active' ? 'green' : 'yellow'}>{member.status}</StatusPill></span>
                  <span>{member.source}</span>
                  <span>Level {member.level} · {member.groupRole} · {member.points} pts</span>
                </div>
              )
            })}
          </div>
        </article>

        <article className="admin-panel span-2">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">Newsletter ops</span>
              <h4>發信、分眾與付費轉換</h4>
            </div>
            <Megaphone size={18} />
          </div>
          <div className="admin-content-stack">
            {preset.newsletter.map((issue) => (
              <div key={issue.id} className="admin-content-item horizontal">
                <span>
                  <Badge variant="outline" className="pill">{issue.segment} · {issue.status}</Badge>
                  <strong>{issue.subject}</strong>
                  <small>{issue.sendAt} · open {issue.openRate} · click {issue.clickRate}</small>
                </span>
                <StatusPill tone={issue.paidConversions > 0 ? 'green' : 'yellow'}>{`${issue.paidConversions} paid`}</StatusPill>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">Queue</span>
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
              <span className="eyebrow">Moderation</span>
              <h4>入會審核、檢舉與 AutoMod</h4>
            </div>
            <ShieldCheck size={18} />
          </div>
          <div className="admin-content-stack">
            {preset.moderation.map((item) => (
              <div key={item.id} className="admin-content-item">
                <Badge variant="outline" className="pill">{item.kind} · {item.status}</Badge>
                <strong>{item.title}</strong>
                <small>{item.subject} · priority {item.priority}</small>
                <small>{item.action}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">Growth</span>
              <h4>推薦、贈閱與來源成長</h4>
            </div>
            <Gift size={18} />
          </div>
          <div className="admin-content-stack">
            {preset.referrals.map((campaign) => (
              <div key={campaign.id} className="admin-content-item">
                <Badge variant="outline" className="pill">{campaign.code}</Badge>
                <strong>{campaign.label}</strong>
                <small>{campaign.freeTrials} trials · {campaign.paidConversions} paid · {campaign.revenueLabel}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">Content ops</span>
              <h4>內容與付費牆</h4>
            </div>
            <BookOpen size={18} />
          </div>
          <div className="admin-content-stack">
            {preset.content.map((item) => (
              <div key={item.id} className="admin-content-item">
                <Badge variant="outline" className="pill">{item.type}</Badge>
                <strong>{item.title}</strong>
                <small>{item.category} · {item.isPaid ? 'paid' : 'free'} · {item.minutes} min</small>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">Classroom</span>
              <h4>課程與進度</h4>
            </div>
            <PlayCircle size={18} />
          </div>
          {preset.courses.map((course) => (
            <div key={course.id} className="admin-course-summary">
              <div>
                <strong>{course.title}</strong>
                <small>{course.lessons.length} lessons · {totalLessons} total lesson records</small>
              </div>
              <div className="progress-track"><span style={{ width: `${course.progress}%` }} /></div>
            </div>
          ))}
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">Community</span>
              <h4>社群審核與互動</h4>
            </div>
            <MessageSquareText size={18} />
          </div>
          <div className="admin-content-stack">
            {preset.threads.map((thread) => (
              <div key={thread.id} className="admin-content-item">
                <Badge variant="outline" className="pill">{thread.category}</Badge>
                <strong>{thread.title}</strong>
                <small>{thread.replies} replies · {thread.reactions} reactions{thread.adminOnly ? ' · members only' : ''}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">Calendar</span>
              <h4>活動、直播與回放</h4>
            </div>
            <CalendarDays size={18} />
          </div>
          <div className="admin-content-stack">
            {preset.events.map((event) => (
              <div key={event.id} className="admin-content-item">
                <Badge variant="outline" className="pill">{event.kind}</Badge>
                <strong>{event.title}</strong>
                <small>{event.date} · {event.status}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="eyebrow">Payment</span>
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
              <span className="eyebrow">Integrations</span>
              <h4>InsForge / Portaly Vibe 設定狀態</h4>
            </div>
            <ShieldCheck size={18} />
          </div>
          <div className="integration-grid">
            <IntegrationItem label="InsForge Auth" value="Google OAuth ready" />
            <IntegrationItem label="Database + RLS" value="Migration included" />
            <IntegrationItem label="Storage" value="Course resources / replay files" />
            <IntegrationItem label="Portaly Vibe MCP" value="Project-scoped MCP config included" />
            <IntegrationItem label="Payments" value="Optional after core setup" />
            <IntegrationItem label="Invoice task" value="payment_events.invoice_status" />
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

function SetupView({ presetId }: { presetId: PresetId }) {
  return (
    <section className="section-block">
      <div className="section-heading">
        <span className="eyebrow">Setup guide</span>
        <h3>把這個服務改成你的品牌</h3>
      </div>
      <div className="setup-grid">
        <article>
          <h4>先改這些檔案</h4>
          <ul className="check-list">
            <li><Settings2 size={16} />`src/data/presets.ts`：文案、方案、課程、社群、活動</li>
            <li><Settings2 size={16} />`.env.local`：InsForge 和 Portaly Vibe MCP token</li>
            <li><Settings2 size={16} />`migrations/*.sql`：正式部署前套用資料表</li>
            <li><Settings2 size={16} />金流 functions：需要收款時再啟用</li>
          </ul>
        </article>
        <article>
          <h4>目前版本</h4>
          <pre className="code-block">{JSON.stringify({ presetId, nextStep: 'adjust brand, plans, content, courses, and community settings' }, null, 2)}</pre>
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
