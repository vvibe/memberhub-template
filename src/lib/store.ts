import { cloneCommunityPreset } from '../data/presets'
import type { AppState, CommunityComment, CommunityPost, PlanId, Role } from '../types'

const STORAGE_KEY = 'memberhub-demo-state-v1'

function mergeById<T extends { id: string }>(defaults: T[], saved: T[] | undefined, keepUnknown = true) {
  if (!Array.isArray(saved)) return defaults
  const savedById = new Map(saved.map((item) => [item.id, item]))
  const merged = defaults.map((item) => ({ ...item, ...savedById.get(item.id) }))
  const defaultIds = new Set(defaults.map((item) => item.id))
  return keepUnknown ? [...merged, ...saved.filter((item) => !defaultIds.has(item.id))] : merged
}

function normalizeComments(comments: Array<CommunityComment | string> | undefined, postId: string): CommunityComment[] {
  if (!Array.isArray(comments)) return []
  return comments.map((comment, index) => {
    if (typeof comment === 'string') {
      return {
        id: `${postId}-comment-${index + 1}`,
        authorId: 'member',
        authorName: 'Member',
        body: comment,
        createdAt: '之前',
        likes: 0,
        replies: [],
      }
    }
    return { ...comment, replies: normalizeComments(comment.replies, comment.id) }
  })
}

function normalizePosts(posts: CommunityPost[]) {
  return posts.map((post) => ({ ...post, comments: normalizeComments(post.comments as Array<CommunityComment | string>, post.id) }))
}

export function createDefaultState(): AppState {
  const preset = cloneCommunityPreset()
  return {
    role: 'visitor',
    selectedPlanId: 'free',
    profileName: 'You',
    profileEmail: 'you@example.test',
    profileAvatarUrl: '',
    notificationSettings: {
      emailEnabled: true,
      scope: 'all',
      adminPosts: true,
      courses: true,
      events: true,
    },
    adminEmail: 'owner@memberhub.test',
    adminPassword: 'memberhub-admin-2026',
    group: preset.group,
    pricingMode: preset.pricingMode,
    plans: preset.plans,
    accessSettings: preset.accessSettings,
    levelThresholds: preset.levelThresholds,
    levelBenefits: preset.levelBenefits,
    pointRules: preset.pointRules,
    externalLinks: preset.externalLinks,
    categories: preset.categories,
    rules: preset.rules,
    membershipQuestions: preset.membershipQuestions,
    membershipApplications: [],
    posts: preset.posts,
    likedPostIds: [],
    likedCommentIds: [],
    courses: preset.courses,
    completedPageIds: [],
    events: preset.events,
    members: preset.members,
    plugins: preset.plugins,
    payments: [],
    currentMemberPoints: 0,
    membershipAnswers: {},
    inviteRecords: [],
  }
}

export function loadState(): AppState {
  const defaultState = createDefaultState()
  if (typeof localStorage === 'undefined') return defaultState
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const saved = JSON.parse(raw)
    const state: AppState = {
      ...defaultState,
      ...saved,
      group: { ...defaultState.group, ...saved.group },
      accessSettings: { ...defaultState.accessSettings, ...saved.accessSettings },
      levelThresholds: Array.isArray(saved.levelThresholds) ? saved.levelThresholds : defaultState.levelThresholds,
      levelBenefits: Array.isArray(saved.levelBenefits)
        ? defaultState.levelBenefits.map((item) => ({ ...item, ...saved.levelBenefits.find((savedItem: typeof item) => savedItem.level === item.level) }))
        : defaultState.levelBenefits,
      pointRules: mergeById(defaultState.pointRules, saved.pointRules, false),
      notificationSettings: { ...defaultState.notificationSettings, ...saved.notificationSettings },
      plans: mergeById(defaultState.plans, saved.plans),
      categories: mergeById(defaultState.categories, saved.categories),
      posts: normalizePosts(mergeById(defaultState.posts, saved.posts)),
      likedPostIds: Array.isArray(saved.likedPostIds) ? saved.likedPostIds : defaultState.likedPostIds,
      likedCommentIds: Array.isArray(saved.likedCommentIds) ? saved.likedCommentIds : defaultState.likedCommentIds,
      courses: mergeById(defaultState.courses, saved.courses),
      events: mergeById(defaultState.events, saved.events),
      members: mergeById(defaultState.members, saved.members),
      plugins: mergeById(defaultState.plugins, saved.plugins, false),
      externalLinks: mergeById(defaultState.externalLinks, saved.externalLinks),
      payments: Array.isArray(saved.payments) ? saved.payments : defaultState.payments,
    }
    const online = Number(state.group.onlineLabel.match(/^(\d+)\s+online$/)?.[1])
    if (Number.isFinite(online) && online >= state.members.length) {
      state.group = { ...state.group, onlineLabel: defaultState.group.onlineLabel }
    }
    return state
  } catch {
    return defaultState
  }
}

export function saveState(state: AppState) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function resetState() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY)
  return createDefaultState()
}

export function roleLabel(role: Role) {
  if (role === 'admin') return 'Admin'
  if (role === 'member') return 'Member'
  return 'Guest'
}

export function planLabel(id: PlanId) {
  const labels: Record<PlanId, string> = {
    free: 'Free',
    monthly: 'Monthly',
    annual: 'Annual',
    lifetime: 'Lifetime',
  }
  return labels[id]
}
