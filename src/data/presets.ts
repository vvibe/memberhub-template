import type { CommunityPreset } from '../types'

export const levelThresholds = [0, 5, 20, 65, 155, 515, 2015, 8015, 33015]

export const pointRules = [
  { id: 'post', label: '發文', points: 1, enabled: true },
  { id: 'comment', label: '留言', points: 1, enabled: true },
  { id: 'like', label: '按讚', points: 1, enabled: true },
] as const

export const levelBenefits = [
  { level: 1, benefits: ['閱讀公開 Classroom', '參與基礎討論'] },
  { level: 2, benefits: ['開啟私訊與基礎問答', '參加入門活動'] },
  { level: 3, benefits: ['解鎖進階課程', '取得模板下載'] },
  { level: 4, benefits: ['參加會員直播', '提交案例回饋'] },
  { level: 5, benefits: ['案例庫完整存取', '優先活動名額'] },
  { level: 6, benefits: ['小班 Office hour', '進階工作流拆解'] },
  { level: 7, benefits: ['Beta 課程優先體驗'] },
  { level: 8, benefits: ['高階社群權限', '專屬實作挑戰'] },
  { level: 9, benefits: ['最高等級榮譽', '完整資源存取'] },
]

export const communityPreset: CommunityPreset = {
  id: 'memberhub',
  group: {
    name: 'Skills School AI Skill 社群',
    creatorName: 'Skills School',
    slug: 'memberhub',
    tagline: '把 AI Skill 變成每天用得到的工作流程',
    description:
      '一個給創作者、顧問與知識工作者的實作社群。會員在社群裡拆任務、上課、參加直播、互相回饋，逐步把 AI 從單次提示詞變成可交付的工作系統。',
    coverLabel: 'AI Skill Community',
    coverImageUrl: 'https://picsum.photos/seed/memberhub-cover/1200/630',
    logoImageUrl: '',
    onlineLabel: '2 online',
  },
  pricingMode: 'freemium',
  accessSettings: {
    instantMembershipApproval: false,
    postingLevel: 1,
    chatLevel: 1,
  },
  levelThresholds,
  levelBenefits,
  pointRules: pointRules.map((rule) => ({ ...rule })),
  externalLinks: [],
  plans: [
    {
      id: 'free',
      name: '免費會員',
      price: 'NT$0',
      cadence: '永久',
      description: '適合先加入社群、閱讀公開討論與參加入門活動。',
      benefits: ['公開社群', '入門課程', '活動提醒'],
    },
    {
      id: 'monthly',
      name: 'Pro 社群',
      price: 'NT$890',
      cadence: '每月',
      description: '解鎖完整課程、直播回放、模板與進階討論區。',
      benefits: ['完整 Classroom', '會員直播', '模板下載', '進階回饋'],
      highlighted: true,
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: 'NT$16,800',
      cadence: '一次付清',
      description: '適合要長期使用課程與社群資源的團隊或個人。',
      benefits: ['永久課程存取', '優先活動名額', '社群案例庫'],
    },
  ],
  categories: [
    { id: 'announcements', name: 'Announcements', permission: 'admins', sort: 'new' },
    { id: 'wins', name: 'Wins', permission: 'members', sort: 'top-week' },
    { id: 'feedback', name: 'Skill Feedback', permission: 'members', sort: 'default' },
    { id: 'questions', name: 'Questions', permission: 'members', sort: 'default' },
  ],
  rules: [
    '發文請描述背景、輸入資料與想得到的輸出。',
    '回饋時指出可以改進的下一步，不只給抽象鼓勵。',
    '不要私訊推銷服務；需要合作請先在公開串說明。',
  ],
  membershipQuestions: [
    '你現在最想把哪一個工作流程做成 AI Skill？',
    '你的主要身份是創作者、顧問、老師、PM、工程師，還是其他？',
    '你從哪裡知道這個社群？',
  ],
  posts: [
    {
      id: 'post-1',
      categoryId: 'announcements',
      authorId: 'owner',
      authorName: 'Skills Team',
      body: '本週直播會拆解三份會員投稿：研究摘要 Skill、內容改寫 Skill、客戶回覆 Skill。請在週三前把你的版本貼到 Skill Feedback。',
      createdAt: '今天 09:20',
      likes: 18,
      comments: [
        { id: 'comment-1-1', authorId: 'm1', authorName: 'Yuna', body: '已提交我的研究摘要版本。', createdAt: '今天 10:02', likes: 3, replies: [] },
        {
          id: 'comment-1-2',
          authorId: 'm3',
          authorName: 'Mika',
          body: '@SkillsTeam 可以順便看資料清洗嗎？',
          createdAt: '今天 10:18',
          likes: 2,
          replies: [{ id: 'comment-1-2-1', authorId: 'owner', authorName: 'Skills Team', body: '@Mika 可以，會放在第二段。', createdAt: '今天 10:31', likes: 1, replies: [] }],
        },
      ],
      pinned: true,
    },
    {
      id: 'post-2',
      categoryId: 'feedback',
      authorId: 'm1',
      authorName: 'Yuna',
      body: '我把會議摘要 Skill 的輸出改成「結論、待辦、風險」三段，交給主管時比較容易直接使用。',
      createdAt: '昨天 21:10',
      likes: 12,
      comments: [
        { id: 'comment-2-1', authorId: 'm2', authorName: 'Rae', body: '這個格式很清楚。', createdAt: '昨天 21:22', likes: 1, replies: [] },
        { id: 'comment-2-2', authorId: 'm3', authorName: 'Mika', body: '可以加一段決策紀錄。', createdAt: '昨天 21:48', likes: 0, replies: [] },
      ],
    },
    {
      id: 'post-3',
      categoryId: 'questions',
      authorId: 'm2',
      authorName: 'Rae',
      body: '大家怎麼判斷一個任務適不適合做成 AI Skill？我目前卡在「例外情境很多」的任務。',
      createdAt: '週一 14:05',
      likes: 9,
      comments: [{ id: 'comment-3-1', authorId: 'm1', authorName: 'Yuna', body: '先看輸入是否固定。', createdAt: '週一 14:32', likes: 2, replies: [] }],
    },
  ],
  courses: [
    {
      id: 'course-1',
      title: 'AI Skill 基礎到實戰',
      description: '從任務拆解、提示設計、資料輸入到品質檢查，完成第一個可重複使用的 AI Skill。',
      accessMode: 'open',
      published: true,
      pages: [
        {
          id: 'page-1',
          title: '定義可重複的 AI 任務',
          minutes: 18,
          body: '建立 AI Skill 前，先把任務邊界、輸入資料、輸出標準與檢查方式寫清楚。',
          resources: ['AI 任務定義表', 'Skill 選題範例庫'],
          transcript: '一個好的 AI Skill 要先定義清楚任務邊界，避免把研究、整理、寫作、判斷全部混在同一段提示詞裡。',
          pinnedPostId: 'post-2',
        },
        {
          id: 'page-2',
          title: '完成第一版 Skill SOP',
          minutes: 26,
          body: '把流程寫成別人也能執行的 SOP，包含角色、輸入、步驟、輸出與品質檢查。',
          resources: ['AI Skill SOP 模板'],
        },
      ],
    },
    {
      id: 'course-2',
      title: '進階工作流案例庫',
      description: '會員互相拆解真實工作流程，把可交付案例整理成可複製模板。',
      accessMode: 'level-unlock',
      requiredLevel: 3,
      published: true,
      pages: [
        {
          id: 'page-3',
          title: '多步驟研究工作流',
          minutes: 34,
          body: '把搜尋、篩選、摘要、評分和輸出包成一個可檢查流程。',
          resources: ['研究流程評分表', '案例輸出模板'],
          pinnedPostId: 'post-3',
        },
      ],
    },
    {
      id: 'course-3',
      title: '一對一顧問案例拆解',
      description: '一次性購買的深度案例，適合想直接看完整改稿流程的人。',
      accessMode: 'buy-now',
      price: 'NT$2,400',
      published: true,
      pages: [
        {
          id: 'page-4',
          title: '顧問交付物重構',
          minutes: 45,
          body: '把零散 Prompt 改成可重複交付的顧問工具包。',
          resources: ['交付物結構表'],
        },
      ],
    },
    {
      id: 'course-4',
      title: '新會員 7 天解鎖',
      description: '加入後第 7 天自動解鎖，避免新會員一次看到太多內容。',
      accessMode: 'time-unlock',
      unlockAfterDays: 7,
      published: true,
      pages: [
        {
          id: 'page-5',
          title: '第 7 天回顧與下一步',
          minutes: 16,
          body: '整理第一週的發文、回饋與下一個 Skill 目標。',
          resources: ['7 天回顧表'],
        },
      ],
    },
    {
      id: 'course-5',
      title: 'Private Beta',
      description: '手動授權的 Beta 區，適合小班測試或顧問客戶。',
      accessMode: 'private',
      published: false,
      pages: [
        {
          id: 'page-6',
          title: 'Beta 測試說明',
          minutes: 10,
          body: '只有被授權的會員會看到這個區域。',
          resources: ['Beta 回饋表'],
        },
      ],
    },
  ],
  events: [
    {
      id: 'event-1',
      title: 'Live：AI Skill SOP 修改實作課',
      date: '2026-06-27',
      time: '20:00',
      duration: '90m',
      timezone: 'Asia/Taipei',
      location: 'MemberHub Call',
      recurrence: 'weekly',
      accessMode: 'all',
      description: '會員可投稿自己的 AI Skill，直播中逐步調整任務、輸入格式與輸出檢查。',
    },
    {
      id: 'event-2',
      title: 'Office hour：AI Skill 導入問答',
      date: '2026-07-02',
      time: '21:00',
      duration: '60m',
      timezone: 'Asia/Taipei',
      location: 'Zoom',
      recurrence: 'none',
      accessMode: 'level',
      requiredLevel: 2,
      description: '小班問答，適合正在把 Skill 放進工作流程的會員。',
    },
  ],
  members: [
    { id: 'owner', name: 'Skills Team', email: 'owner@skillsschool.test', role: 'owner', planId: 'lifetime', level: 9, points: 33015, joinedAt: '2025-10-01', posts: 42, comments: 180, status: 'active' },
    { id: 'billing', name: 'Nina', email: 'billing@skillsschool.test', role: 'billing', planId: 'lifetime', level: 7, points: 2440, joinedAt: '2025-11-10', posts: 10, comments: 55, status: 'active' },
    { id: 'm1', name: 'Yuna', email: 'yuna@skillsschool.test', role: 'member', planId: 'monthly', level: 4, points: 180, joinedAt: '2026-02-12', posts: 9, comments: 38, status: 'active' },
    { id: 'm2', name: 'Rae', email: 'rae@skillsschool.test', role: 'moderator', planId: 'monthly', level: 5, points: 420, joinedAt: '2026-01-08', posts: 21, comments: 86, status: 'active' },
    { id: 'm3', name: 'Mika', email: 'mika@skillsschool.test', role: 'member', planId: 'free', level: 2, points: 18, joinedAt: '2026-04-26', posts: 2, comments: 8, status: 'active' },
  ],
  plugins: [
    { id: 'membership-questions', name: 'Membership Questions', enabled: true, description: '加入前收集目標、身份與來源。' },
    { id: 'instant-approval', name: 'Instant Membership Approval', enabled: false, description: '免費會員是否不用審核直接加入。' },
    { id: 'unlock-posting', name: 'Unlock Posting', enabled: false, description: '要求會員達到指定 Level 後才能發文。' },
    { id: 'unlock-chat', name: 'Unlock Chat', enabled: false, description: '要求會員達到指定 Level 後才能私訊。' },
    { id: 'auto-dm', name: 'AutoDM', enabled: false, description: '新會員加入後自動發送歡迎訊息。' },
    { id: 'onboarding-video', name: 'Onboarding Video', enabled: true, description: '在 About / Join 流程中顯示導覽影片。' },
  ],
}

export function cloneCommunityPreset() {
  return structuredClone(communityPreset)
}
