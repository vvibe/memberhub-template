export type PresetId = 'skills-school' | 'signal-brief'
export type Role = 'visitor' | 'member' | 'admin'
export type ViewId = 'home' | 'blog' | 'join' | 'content' | 'newsletter' | 'courses' | 'community' | 'members' | 'search' | 'challenges' | 'events' | 'login' | 'member' | 'admin' | 'setup'
export type PlanId = 'free' | 'monthly' | 'lifetime'

export type Plan = {
  id: PlanId
  name: string
  price: string
  cadence: string
  description: string
  features: string[]
  highlighted?: boolean
  unlockLevel?: number
}

export type ContentItem = {
  id: string
  title: string
  type: 'article' | 'video' | 'podcast' | 'resource' | 'newsletter'
  category: string
  excerpt: string
  body: string
  isPaid: boolean
  minutes: number
  source: string
}

export type NewsletterIssue = {
  id: string
  subject: string
  segment: 'all' | 'free' | 'paid' | 'founding'
  status: 'draft' | 'scheduled' | 'sent'
  sendAt: string
  openRate: string
  clickRate: string
  paidConversions: number
}

export type Lesson = {
  id: string
  title: string
  minutes: number
  complete: boolean
  lockedLevel?: number
  transcript?: string
  resources?: CourseResource[]
  pinnedThreadId?: string
}

export type CourseResource = {
  id: string
  title: string
  kind: 'file' | 'link' | 'transcript' | 'template'
  access: 'free' | 'member' | 'level-gated'
}

export type Course = {
  id: string
  title: string
  description: string
  progress: number
  lessons: Lesson[]
}

export type Thread = {
  id: string
  category: string
  title: string
  author: string
  replies: number
  reactions: number
  pinned?: boolean
  adminOnly?: boolean
  canStart?: 'all' | 'paid' | 'admin'
  reportCount?: number
}

export type Challenge = {
  id: string
  title: string
  cadence: string
  streak: number
  participants: number
  points: number
}

export type EventItem = {
  id: string
  title: string
  kind: 'live' | 'webinar' | 'office-hour'
  date: string
  status: 'upcoming' | 'replay'
  description: string
  audience: 'everyone' | 'subscribers' | 'paid'
  replayAccess: 'free' | 'paid'
}

export type Member = {
  id: string
  name: string
  email: string
  role: Role
  groupRole: 'owner' | 'billing' | 'admin' | 'moderator' | 'member'
  planId: PlanId
  status: 'active' | 'free' | 'paused'
  level: number
  points: number
  source: string
  bio: string
  joinedAt: string
  contributions: {
    posts: number
    comments: number
    likesReceived: number
  }
  risk: 'low' | 'medium' | 'high'
}

export type ReferralCampaign = {
  id: string
  code: string
  label: string
  source: string
  reward: string
  freeTrials: number
  paidConversions: number
  revenueLabel: string
}

export type ModerationItem = {
  id: string
  kind: 'membership-question' | 'reported-post' | 'automod-risk' | 'billing-dispute'
  title: string
  subject: string
  status: 'open' | 'reviewing' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  action: string
}

export type NotificationItem = {
  id: string
  channel: 'email' | 'line' | 'in-app'
  trigger: 'new-post' | 'live-start' | 'course-reminder' | 'payment-failed' | 'welcome'
  audience: 'all' | 'free' | 'paid' | 'at-risk'
  status: 'ready' | 'scheduled' | 'sent'
}

export type VerticalPreset = {
  id: PresetId
  name: string
  tagline: string
  audience: string
  brand: {
    productName: string
    creatorName: string
    primary: string
    accent: string
  }
  copy: {
    heroTitle: string
    heroBody: string
    ctaPrimary: string
    ctaSecondary: string
  }
  plans: Plan[]
  content: ContentItem[]
  newsletter: NewsletterIssue[]
  courses: Course[]
  threads: Thread[]
  challenges: Challenge[]
  events: EventItem[]
  members: Member[]
  referrals: ReferralCampaign[]
  moderation: ModerationItem[]
  notifications: NotificationItem[]
  metrics: {
    mrr: string
    activeMembers: number
    conversion: string
    churnRisk: number
    topSource: string
  }
}

export type PresetOverrides = Record<string, Partial<VerticalPreset>>

export type PaymentEvent = {
  id: string
  planId: PlanId
  amountLabel: string
  provider: 'portaly'
  status: 'paid' | 'refunded'
  invoiceStatus: 'issued' | 'pending' | 'not_required'
  createdAt: string
}

export type AppState = {
  presetId: PresetId
  role: Role
  selectedPlanId: PlanId
  presetOverrides: PresetOverrides
  completedLessons: string[]
  checkedInChallenges: string[]
  paymentEvents: PaymentEvent[]
  localContentItems: ContentItem[]
  localNewsletterIssues: NewsletterIssue[]
  localReferralCampaigns: ReferralCampaign[]
  localMembers: Member[]
  localModeration: ModerationItem[]
}
