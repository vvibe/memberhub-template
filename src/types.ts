export type Role = 'visitor' | 'member' | 'admin'
export type ViewId = 'community' | 'classroom' | 'calendar' | 'members' | 'leaderboard' | 'about' | 'login' | 'account' | 'admin'
export type PlanId = 'free' | 'monthly' | 'annual' | 'lifetime'
export type PricingMode = 'free' | 'subscription' | 'freemium' | 'tiered' | 'one-time'

export type GroupProfile = {
  name: string
  creatorName: string
  slug: string
  tagline: string
  description: string
  coverLabel: string
  coverImageUrl?: string
  logoImageUrl?: string
  onlineLabel: string
}

export type Plan = {
  id: PlanId
  name: string
  price: string
  cadence: string
  description: string
  benefits: string[]
  highlighted?: boolean
}

export type PaymentEvent = {
  id: string
  planId: PlanId
  memberEmail?: string
  amountLabel: string
  provider: 'portaly'
  status: 'paid' | 'refunded'
  invoiceStatus: 'issued' | 'pending' | 'not_required'
  createdAt: string
}

export type CommunityCategory = {
  id: string
  name: string
  permission: 'members' | 'admins'
  sort: 'default' | 'new' | 'top-week' | 'top-month'
}

export type CommunityLink = {
  id: string
  label: string
  url: string
  visibility: 'public' | 'members'
}

export type CommunityPost = {
  id: string
  categoryId: string
  authorId: string
  authorName: string
  body: string
  createdAt: string
  likes: number
  comments: CommunityComment[]
  pinned?: boolean
}

export type CommunityComment = {
  id: string
  authorId: string
  authorName: string
  body: string
  createdAt: string
  likes: number
  replies: CommunityComment[]
}

export type CourseAccessMode = 'open' | 'level-unlock' | 'buy-now' | 'time-unlock' | 'private'

export type ClassroomPage = {
  id: string
  title: string
  minutes: number
  body: string
  resources: string[]
  transcript?: string
  pinnedPostId?: string
}

export type ClassroomCourse = {
  id: string
  title: string
  description: string
  accessMode: CourseAccessMode
  requiredLevel?: number
  price?: string
  unlockAfterDays?: number
  published: boolean
  pages: ClassroomPage[]
}

export type CalendarEvent = {
  id: string
  title: string
  date: string
  time: string
  duration: string
  timezone: string
  location: 'MemberHub Call' | 'Zoom' | 'Meet' | 'Address'
  recurrence: 'none' | 'weekly' | 'monthly'
  accessMode?: 'all' | 'level' | 'plan' | 'course'
  requiredLevel?: number
  requiredPlanId?: PlanId
  courseId?: string
  description: string
}

export type Member = {
  id: string
  name: string
  email: string
  role: 'owner' | 'billing' | 'admin' | 'moderator' | 'member'
  planId: PlanId
  level: number
  points: number
  joinedAt: string
  posts: number
  comments: number
  status?: 'active' | 'removed' | 'banned'
  chatBlocked?: boolean
  courseAccessIds?: string[]
}

export type MembershipApplication = {
  id: string
  email: string
  planId: PlanId
  answers: Record<string, string>
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export type PluginState = {
  id:
    | 'membership-questions'
    | 'instant-approval'
    | 'unlock-posting'
    | 'unlock-chat'
    | 'auto-dm'
    | 'onboarding-video'
  name: string
  enabled: boolean
  description: string
}

export type AccessSettings = {
  instantMembershipApproval: boolean
  postingLevel: number
  chatLevel: number
}

export type PointRuleId = 'post' | 'comment' | 'like'

export type PointRule = {
  id: PointRuleId
  label: string
  points: number
  enabled: boolean
}

export type LevelBenefit = {
  level: number
  benefits: string[]
}

export type NotificationSettings = {
  emailEnabled: boolean
  scope: 'all' | 'selected'
  adminPosts: boolean
  courses: boolean
  events: boolean
}

export type CommunityPreset = {
  id: 'memberhub'
  group: GroupProfile
  pricingMode: PricingMode
  plans: Plan[]
  accessSettings: AccessSettings
  levelThresholds: number[]
  levelBenefits: LevelBenefit[]
  pointRules: PointRule[]
  externalLinks: CommunityLink[]
  categories: CommunityCategory[]
  rules: string[]
  membershipQuestions: string[]
  posts: CommunityPost[]
  courses: ClassroomCourse[]
  events: CalendarEvent[]
  members: Member[]
  plugins: PluginState[]
}

export type AppState = {
  role: Role
  selectedPlanId: PlanId
  profileName: string
  profileEmail: string
  profileAvatarUrl: string
  notificationSettings: NotificationSettings
  adminEmail: string
  adminPassword: string
  group: GroupProfile
  pricingMode: PricingMode
  plans: Plan[]
  accessSettings: AccessSettings
  levelThresholds: number[]
  levelBenefits: LevelBenefit[]
  pointRules: PointRule[]
  externalLinks: CommunityLink[]
  categories: CommunityCategory[]
  rules: string[]
  membershipQuestions: string[]
  membershipApplications: MembershipApplication[]
  posts: CommunityPost[]
  likedPostIds: string[]
  likedCommentIds: string[]
  courses: ClassroomCourse[]
  completedPageIds: string[]
  events: CalendarEvent[]
  members: Member[]
  plugins: PluginState[]
  payments: PaymentEvent[]
  currentMemberPoints: number
  membershipAnswers: Record<string, string>
  inviteRecords: string[]
}
