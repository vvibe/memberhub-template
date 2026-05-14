import type { PresetId, VerticalPreset } from '../types'

function makePreset(input: {
  id: PresetId
  name: string
  productName: string
  creatorName: string
  tagline: string
  audience: string
  heroTitle: string
  heroBody: string
  accent: string
  monthlyPrice: string
  lifetimePrice: string
  monthlyName: string
  lifetimeName: string
  contentTopic: string
  courseTopic: string
  communityTopic: string
  mrr: string
  activeMembers: number
  conversion: string
  topSource: string
}): VerticalPreset {
  return {
    id: input.id,
    name: input.name,
    tagline: input.tagline,
    audience: input.audience,
    brand: {
      productName: input.productName,
      creatorName: input.creatorName,
      primary: '#2f3437',
      accent: input.accent,
    },
    copy: {
      heroTitle: input.heroTitle,
      heroBody: input.heroBody,
      ctaPrimary: '加入會員',
      ctaSecondary: '先看免費內容',
    },
    plans: [
      {
        id: 'free',
        name: '免費會員',
        price: 'NT$0',
        cadence: '永久',
        description: '提供公開內容、活動通知與社群預覽。',
        features: ['免費內容預覽', '公開討論區', 'Newsletter 通知'],
      },
      {
        id: 'monthly',
        name: input.monthlyName,
        price: input.monthlyPrice,
        cadence: '每月',
        description: '解鎖付費內容、課程進度、直播回放與會員社群。',
        features: ['付費牆內容', '課程進度', '會員討論', '直播回放'],
        highlighted: true,
      },
      {
        id: 'lifetime',
        name: input.lifetimeName,
        price: input.lifetimePrice,
        cadence: '一次性',
        description: '適合高單價內容庫、長期會員學院與完整陪跑。',
        features: ['完整內容庫', '進階課程', '等級解鎖', '優先活動名額'],
        unlockLevel: 3,
      },
    ],
    content: [
      {
        id: `${input.id}-free-article`,
        title: `免費公開：${input.contentTopic}入門指南`,
        type: 'article',
        category: '公開內容',
        excerpt: '用一篇免費內容讓新訪客理解方法、成果與會員價值。',
        body: '公開內容示範。',
        isPaid: false,
        minutes: 8,
        source: 'organic',
      },
      {
        id: `${input.id}-paid-video`,
        title: `會員限定：${input.contentTopic}實戰拆解`,
        type: 'video',
        category: '會員課',
        excerpt: '完整流程、範本、常見錯誤與可下載資源都放在會員牆後。',
        body: '付費內容示範。',
        isPaid: true,
        minutes: 32,
        source: 'newsletter',
      },
      {
        id: `${input.id}-podcast`,
        title: `會員 Podcast：${input.communityTopic}經營問答`,
        type: 'podcast',
        category: '會員問答',
        excerpt: '把社群常見問題整理成可持續更新的付費音訊內容。',
        body: '音訊內容示範。',
        isPaid: true,
        minutes: 21,
        source: 'referral',
      },
      {
        id: `${input.id}-resource`,
        title: `會員下載：${input.contentTopic}工作表`,
        type: 'resource',
        category: '資源下載',
        excerpt: '可用 Storage 權限控管 PDF、表格、回放與素材包。',
        body: '下載資源示範。',
        isPaid: true,
        minutes: 4,
        source: 'line',
      },
      {
        id: `${input.id}-newsletter-brief`,
        title: `Newsletter：本週${input.contentTopic}重點整理`,
        type: 'newsletter',
        category: 'Email Newsletter',
        excerpt: '給免費讀者摘要、給付費會員完整拆解，適合 Substack-style 發送與網頁存檔。',
        body: 'Newsletter issue 示範。',
        isPaid: false,
        minutes: 6,
        source: 'email',
      },
    ],
    newsletter: [
      {
        id: `${input.id}-n1`,
        subject: `本週${input.contentTopic}公開摘要 + 會員延伸`,
        segment: 'all',
        status: 'scheduled',
        sendAt: '2026-05-20 09:00',
        openRate: '48%',
        clickRate: '12%',
        paidConversions: 9,
      },
      {
        id: `${input.id}-n2`,
        subject: `付費會員：${input.communityTopic}深度問答`,
        segment: 'paid',
        status: 'draft',
        sendAt: '2026-05-23 20:00',
        openRate: '-',
        clickRate: '-',
        paidConversions: 0,
      },
      {
        id: `${input.id}-n3`,
        subject: `歡迎信：如何開始使用${input.productName}`,
        segment: 'free',
        status: 'sent',
        sendAt: 'on signup',
        openRate: '62%',
        clickRate: '19%',
        paidConversions: 14,
      },
    ],
    courses: [
      {
        id: `${input.id}-course-1`,
        title: `${input.courseTopic}基礎班`,
        description: '從觀念、範例、練習到實作回饋的完整學習路徑。',
        progress: 36,
        lessons: [
          {
            id: `${input.id}-l1`,
            title: '建立基礎觀念',
            minutes: 16,
            complete: true,
            transcript: '逐字稿可被全站搜尋，讓課程像 Skool Classroom 一樣可查。',
            resources: [
              { id: `${input.id}-r1`, title: '課前檢查表', kind: 'template', access: 'free' },
              { id: `${input.id}-r2`, title: '補充閱讀連結', kind: 'link', access: 'member' },
            ],
            pinnedThreadId: `${input.id}-t1`,
          },
          {
            id: `${input.id}-l2`,
            title: '實作流程拆解',
            minutes: 20,
            complete: false,
            transcript: '把影片內容轉成搜尋索引，方便會員回找。',
            resources: [{ id: `${input.id}-r3`, title: '實作素材包', kind: 'file', access: 'member' }],
            pinnedThreadId: `${input.id}-t2`,
          },
          { id: `${input.id}-l3`, title: '常見錯誤與修正', minutes: 24, complete: false, resources: [{ id: `${input.id}-r4`, title: '錯誤修正表', kind: 'file', access: 'member' }] },
          { id: `${input.id}-l4`, title: '等級 3 解鎖：進階案例', minutes: 30, lockedLevel: 3, complete: false, resources: [{ id: `${input.id}-r5`, title: 'Level 3 案例檔', kind: 'file', access: 'level-gated' }] },
        ],
      },
      {
        id: `${input.id}-course-2`,
        title: `${input.courseTopic}週計畫`,
        description: '用打卡和短單元維持會員參與。',
        progress: 18,
        lessons: [
          { id: `${input.id}-l5`, title: '設定每週目標', minutes: 14, complete: true, resources: [{ id: `${input.id}-r6`, title: '目標設定表', kind: 'template', access: 'free' }] },
          { id: `${input.id}-l6`, title: '建立作品或任務', minutes: 18, complete: false, resources: [{ id: `${input.id}-r7`, title: '任務範本', kind: 'template', access: 'member' }] },
          { id: `${input.id}-l7`, title: '回顧與下一步', minutes: 22, complete: false, resources: [{ id: `${input.id}-r8`, title: '回顧逐字稿', kind: 'transcript', access: 'member' }] },
        ],
      },
    ],
    threads: [
      { id: `${input.id}-t1`, category: '公告', title: `本週直播：${input.contentTopic}案例拆解`, author: 'Host', replies: 24, reactions: 96, pinned: true, canStart: 'admin', reportCount: 0 },
      { id: `${input.id}-t2`, category: '作品回報', title: '我的作業卡在這一步，該怎麼調整？', author: 'Yuna', replies: 16, reactions: 42, canStart: 'paid', reportCount: 0 },
      { id: `${input.id}-t3`, category: '會員限定', title: '五月會員素材包已更新', author: 'Host', replies: 9, reactions: 58, adminOnly: true, canStart: 'paid', reportCount: 1 },
      { id: `${input.id}-t4`, category: '經營討論', title: `${input.communityTopic}如何提高續訂率？`, author: 'Rae', replies: 21, reactions: 67, canStart: 'all', reportCount: 0 },
    ],
    challenges: [
      { id: `${input.id}-c1`, title: `7 天${input.courseTopic}打卡`, cadence: '每日', streak: 5, participants: 184, points: 80 },
      { id: `${input.id}-c2`, title: `每週${input.contentTopic}練習`, cadence: '每週', streak: 2, participants: 96, points: 130 },
    ],
    events: [
      { id: `${input.id}-e1`, title: `Live：${input.contentTopic}實作課`, kind: 'live', date: '2026-05-25 20:00', status: 'upcoming', description: '會員可投稿問題，直播中逐步拆解。', audience: 'paid', replayAccess: 'paid' },
      { id: `${input.id}-e2`, title: `Webinar 回放：${input.communityTopic}商業化`, kind: 'webinar', date: '2026-05-08', status: 'replay', description: '含範本、檢查表與回放連結。', audience: 'subscribers', replayAccess: 'paid' },
      { id: `${input.id}-e3`, title: 'Office hour：會員問答', kind: 'office-hour', date: '2026-05-18 21:00', status: 'upcoming', description: '小班問答，適合需要回饋的會員。', audience: 'paid', replayAccess: 'paid' },
    ],
    members: [
      { id: `${input.id}-m1`, name: 'Yuna', email: 'yuna@example.com', role: 'member', groupRole: 'member', planId: 'monthly', status: 'active', level: 2, points: 540, source: 'newsletter', bio: `${input.courseTopic}學員，常分享作業回報。`, joinedAt: '2026-02-12', contributions: { posts: 8, comments: 34, likesReceived: 540 }, risk: 'low' },
      { id: `${input.id}-m2`, name: 'Rae', email: 'rae@example.com', role: 'member', groupRole: 'moderator', planId: 'lifetime', status: 'active', level: 4, points: 1320, source: 'referral', bio: '協助新會員熟悉課程與討論規則。', joinedAt: '2025-12-08', contributions: { posts: 18, comments: 77, likesReceived: 1320 }, risk: 'low' },
      { id: `${input.id}-m3`, name: 'Mika', email: 'mika@example.com', role: 'member', groupRole: 'member', planId: 'monthly', status: 'active', level: 3, points: 880, source: 'line', bio: '每週參與直播與打卡挑戰。', joinedAt: '2026-01-20', contributions: { posts: 11, comments: 45, likesReceived: 880 }, risk: 'medium' },
      { id: `${input.id}-m4`, name: 'Nori', email: 'nori@example.com', role: 'member', groupRole: 'member', planId: 'free', status: 'free', level: 1, points: 120, source: 'organic', bio: '免費讀者，正在評估升級。', joinedAt: '2026-04-26', contributions: { posts: 1, comments: 5, likesReceived: 120 }, risk: 'low' },
    ],
    referrals: [
      { id: `${input.id}-ref1`, code: 'GIFT7', label: '付費會員贈閱 7 天', source: 'subscriber gift', reward: '贈閱名額 + 續訂提醒', freeTrials: 38, paidConversions: 11, revenueLabel: 'NT$6,490' },
      { id: `${input.id}-ref2`, code: 'FRIEND20', label: '好友推薦折扣', source: 'referral link', reward: '推薦人下月折抵', freeTrials: 24, paidConversions: 7, revenueLabel: 'NT$4,130' },
      { id: `${input.id}-ref3`, code: 'LIVE-AMA', label: '直播報名來源', source: 'live campaign', reward: '活動後升級 email', freeTrials: 51, paidConversions: 13, revenueLabel: 'NT$7,670' },
    ],
    moderation: [
      { id: `${input.id}-mod1`, kind: 'membership-question', title: '新會員入會問題待審', subject: 'Kai 想加入免費方案', status: 'open', priority: 'medium', action: '檢查目標、來源與自我介紹後批准' },
      { id: `${input.id}-mod2`, kind: 'reported-post', title: '討論串被檢舉', subject: '五月會員素材包已更新', status: 'reviewing', priority: 'high', action: '確認是否違反社群規則，必要時隱藏留言' },
      { id: `${input.id}-mod3`, kind: 'automod-risk', title: 'AutoMod 高風險會員', subject: '新帳號短時間大量私訊', status: 'open', priority: 'high', action: '限制私訊、要求補齊入會問題或移除' },
      { id: `${input.id}-mod4`, kind: 'billing-dispute', title: '付款爭議資料準備', subject: '會員要求退款', status: 'resolved', priority: 'low', action: '匯出使用紀錄、付款紀錄與課程進度' },
    ],
    notifications: [
      { id: `${input.id}-notify1`, channel: 'email', trigger: 'new-post', audience: 'all', status: 'scheduled' },
      { id: `${input.id}-notify2`, channel: 'line', trigger: 'live-start', audience: 'paid', status: 'ready' },
      { id: `${input.id}-notify3`, channel: 'in-app', trigger: 'course-reminder', audience: 'paid', status: 'ready' },
      { id: `${input.id}-notify4`, channel: 'email', trigger: 'payment-failed', audience: 'at-risk', status: 'ready' },
    ],
    metrics: {
      mrr: input.mrr,
      activeMembers: input.activeMembers,
      conversion: input.conversion,
      churnRisk: 6,
      topSource: input.topSource,
    },
  }
}

export const presets: VerticalPreset[] = [
  makePreset({
    id: 'baking-community',
    name: '烘焙會員社群',
    productName: 'SweetCrumb 烘焙研究室',
    creatorName: 'Mori Baking Studio',
    tagline: '食譜付費牆、線上課程、打卡挑戰與直播烘焙課',
    audience: '適合料理老師、烘焙教室、甜點品牌、食譜型 creator',
    heroTitle: '把食譜、課程與烘焙社群做成可訂閱的會員網站',
    heroBody: 'SweetCrumb 示範如何用 MemberHub 建立料理/烘焙網站：免費食譜預覽、會員限定配方、課程進度、打卡挑戰、直播回放、社群討論與後台營運都已準備好。',
    accent: '#956400',
    monthlyPrice: 'NT$590',
    lifetimePrice: 'NT$5,980',
    monthlyName: '月費烘焙會員',
    lifetimeName: '年度大師班',
    contentTopic: '檸檬塔配方',
    courseTopic: '烘焙',
    communityTopic: '烘焙社群',
    mrr: 'NT$126,880',
    activeMembers: 356,
    conversion: '10.6%',
    topSource: 'newsletter',
  }),
  makePreset({
    id: 'design-teacher',
    name: '設計師教學',
    productName: 'Design Circle Pro',
    creatorName: 'Kevin Design Lab',
    tagline: '付費文章、作品講評、課程與社群陪跑',
    audience: '適合設計師、UI/UX 老師、自由接案顧問',
    heroTitle: '把你的設計知識變成可訂閱的會員學院',
    heroBody: '建立付費內容、課程進度、作品講評社群、直播活動與會員訂閱，讓學員從免費內容一路進到付費課程與作品回饋。',
    accent: '#6b5cff',
    monthlyPrice: 'NT$499',
    lifetimePrice: 'NT$6,800',
    monthlyName: '月費會員',
    lifetimeName: '終身會員',
    contentTopic: '作品集設計',
    courseTopic: '設計',
    communityTopic: '作品講評',
    mrr: 'NT$84,320',
    activeMembers: 238,
    conversion: '8.7%',
    topSource: 'newsletter',
  }),
  makePreset({
    id: 'fitness-coach',
    name: '健身教練',
    productName: 'CoachFit Club',
    creatorName: 'Coach Lin',
    tagline: '訓練課表、飲食紀錄、打卡與直播問答',
    audience: '適合健身教練、皮拉提斯老師、線上陪跑教練',
    heroTitle: '把訓練計畫變成能續訂的線上會員服務',
    heroBody: '用課程、打卡、社群與活動，把一次性教練服務延伸成可持續經營的會員產品。',
    accent: '#2f6b4f',
    monthlyPrice: 'NT$899',
    lifetimePrice: 'NT$9,800',
    monthlyName: '月費訓練會員',
    lifetimeName: '年度陪跑會員',
    contentTopic: '訓練課表',
    courseTopic: '健身',
    communityTopic: '訓練打卡',
    mrr: 'NT$214,560',
    activeMembers: 412,
    conversion: '12.4%',
    topSource: 'line',
  }),
  makePreset({
    id: 'finance-newsletter',
    name: '財經 Newsletter',
    productName: 'Market Notes Plus',
    creatorName: 'Market Notes',
    tagline: '免費/付費文章、年度訂閱、專屬討論與直播',
    audience: '適合財經作者、投資研究者、商業 newsletter',
    heroTitle: '把財經內容包裝成付費 newsletter 與會員社群',
    heroBody: '免費文章建立信任，付費內容提供深度研究、回放、討論與訂閱管理。',
    accent: '#1f6c9f',
    monthlyPrice: 'NT$399',
    lifetimePrice: 'NT$4,800',
    monthlyName: '月費研究會員',
    lifetimeName: '年度研究會員',
    contentTopic: '市場研究',
    courseTopic: '投資研究',
    communityTopic: '財經討論',
    mrr: 'NT$96,420',
    activeMembers: 302,
    conversion: '7.9%',
    topSource: 'organic',
  }),
]

export function getPreset(id: PresetId) {
  return presets.find((preset) => preset.id === id) ?? presets[0]
}
