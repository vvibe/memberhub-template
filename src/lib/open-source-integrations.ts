export type OpenSourceIntegration = {
  feature: string
  provider: string
  status: 'ready' | 'optional' | 'manual'
  fit: string
  handoff: string
  license: string
  sourceUrl: string
}

export const openSourceIntegrations: OpenSourceIntegration[] = [
  {
    feature: '內容編輯',
    provider: 'Tiptap OSS Editor',
    status: 'ready',
    fit: '文章、電子報、付費牆段落與課程公告的富文字編輯。',
    handoff: '@tiptap/react + StarterKit + Placeholder 已在 RichTextEditor 使用。',
    license: 'MIT',
    sourceUrl: 'https://tiptap.dev/open-source-to-platform',
  },
  {
    feature: 'HTML 淨化',
    provider: 'DOMPurify',
    status: 'ready',
    fit: '顯示富文字內容前先清掉不允許的 HTML。',
    handoff: 'src/lib/rich-text.ts 集中處理 sanitize allowlist。',
    license: 'MPL-2.0 / Apache-2.0',
    sourceUrl: 'https://github.com/cure53/DOMPurify',
  },
  {
    feature: '會員後端',
    provider: 'PocketBase',
    status: 'manual',
    fit: '小型會員站可用一個 self-hosted backend 接 auth、資料庫、檔案與 admin。',
    handoff: '替換 store/auth/payment adapter，不改前台產品流程。',
    license: 'MIT',
    sourceUrl: 'https://pocketbase.io/',
  },
  {
    feature: '正式登入',
    provider: 'Keycloak',
    status: 'manual',
    fit: '需要 OIDC、SAML、組織權限或既有企業身份系統時使用。',
    handoff: '把 preview auth 換成 OIDC session 驗證。',
    license: 'Apache-2.0',
    sourceUrl: 'https://www.keycloak.org/',
  },
  {
    feature: '內容 CMS',
    provider: 'Strapi',
    status: 'manual',
    fit: '需要非工程人員管理文章、分類、作者與媒體素材時使用。',
    handoff: '保留 UI，內容來源改讀 Strapi API。',
    license: 'MIT',
    sourceUrl: 'https://strapi.io/',
  },
  {
    feature: 'Newsletter',
    provider: 'listmonk',
    status: 'manual',
    fit: '需要 self-hosted mailing list、分眾、活動信與發送紀錄時使用。',
    handoff: 'Newsletter 發送動作改呼叫 listmonk campaign/list API。',
    license: 'AGPL-3.0',
    sourceUrl: 'https://listmonk.app/',
  },
  {
    feature: '全文搜尋',
    provider: 'Meilisearch',
    status: 'manual',
    fit: '搜尋文章、課程、留言、成員與活動，比前端 local filter 更適合正式站。',
    handoff: '把目前 search view 的資料來源換成 Meilisearch index。',
    license: 'MIT',
    sourceUrl: 'https://github.com/meilisearch/meilisearch',
  },
  {
    feature: '預約活動',
    provider: 'Cal.diy',
    status: 'optional',
    fit: '教練、顧問、office hour 或會員一對一預約。',
    handoff: '活動卡放 booking URL 或 embed，不重寫 scheduling engine。',
    license: 'MIT',
    sourceUrl: 'https://github.com/calcom/cal.diy',
  },
  {
    feature: '直播會議',
    provider: 'Jitsi Meet',
    status: 'optional',
    fit: '會員直播、webinar、office hour 與回放前的即時會議。',
    handoff: '活動詳情接 Jitsi room URL，不自建視訊功能。',
    license: 'Apache-2.0',
    sourceUrl: 'https://jitsi.org/jitsi-meet/',
  },
  {
    feature: '多通道通知',
    provider: 'Novu',
    status: 'optional',
    fit: '站內、Email、SMS、Chat push 的 notification workflow。',
    handoff: '通知事件送到 Novu workflow，provider secret 留 server-side。',
    license: 'Open source',
    sourceUrl: 'https://docs.novu.co/platform/what-is-novu',
  },
  {
    feature: '檔案儲存',
    provider: 'MinIO',
    status: 'optional',
    fit: '課程附件、付費下載、圖片與回放檔案的 S3-compatible storage。',
    handoff: '只保存 object key / signed URL，不把檔案流程寫死在前端。',
    license: 'AGPL-3.0',
    sourceUrl: 'https://github.com/minio/minio',
  },
]

export const readyOpenSourceIntegrations = openSourceIntegrations.filter((item) => item.status === 'ready')
export const externalOpenSourceIntegrations = openSourceIntegrations.filter((item) => item.status !== 'ready')
