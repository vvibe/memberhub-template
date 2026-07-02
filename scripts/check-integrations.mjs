import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
  '.mcp.example.json',
  '.cursor/mcp.example.json',
  '.env.example',
  'LICENSE',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'src/App.tsx',
  'src/types.ts',
  'src/data/presets.ts',
  'src/lib/insforge.ts',
  'src/lib/open-source-integrations.ts',
  'src/lib/portaly.ts',
  'src/components/RichTextEditor.tsx',
  'migrations/20260511210000_memberhub.sql',
  'insforge/functions/portaly-checkout/index.ts',
  'insforge/functions/portaly-webhook/index.ts',
  'docs/fork-readiness.md',
  'docs/security-review.md',
  'docs/rls-policies.md',
  'AGENTS.md',
]

const requiredEnv = [
  'VITE_INSFORGE_URL',
  'VITE_INSFORGE_ANON_KEY',
  'INSFORGE_API_KEY',
  'PORTALY_CHECKOUT_API_KEY',
  'PORTALY_CALLBACK_SECRET',
  'PORTALY_CALLBACK_URL',
  'PORTALY_API_TOKEN',
  'MEMBERHUB_PREVIEW_EMAIL',
  'MEMBERHUB_PREVIEW_PASSWORD',
  'APP_BASE_URL',
  'ALLOWED_ORIGINS',
]

function assert(condition, message) {
  if (!condition) {
    console.error(`✗ ${message}`)
    process.exitCode = 1
  } else {
    console.log(`✓ ${message}`)
  }
}

for (const file of requiredFiles) assert(existsSync(file), `${file} exists`)

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const projectMcp = JSON.parse(readFileSync('.mcp.example.json', 'utf8'))
const cursorMcp = JSON.parse(readFileSync('.cursor/mcp.example.json', 'utf8'))
const envExample = readFileSync('.env.example', 'utf8')
const gitignore = readFileSync('.gitignore', 'utf8')
const readme = readFileSync('README.md', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const types = readFileSync('src/types.ts', 'utf8')
const seed = readFileSync('src/data/presets.ts', 'utf8')
const styles = readFileSync('src/styles.css', 'utf8')
const richTextEditor = readFileSync('src/components/RichTextEditor.tsx', 'utf8')
const richText = readFileSync('src/lib/rich-text.ts', 'utf8')
const openSourceCatalog = readFileSync('src/lib/open-source-integrations.ts', 'utf8')
const checkoutFunction = readFileSync('insforge/functions/portaly-checkout/index.ts', 'utf8')
const webhookFunction = readFileSync('insforge/functions/portaly-webhook/index.ts', 'utf8')
const securityReview = readFileSync('docs/security-review.md', 'utf8')
const rlsPolicies = readFileSync('docs/rls-policies.md', 'utf8')

function assertPortalyMcpConfig(config, label) {
  const server = config.mcpServers?.['portaly-vibe']
  assert(Boolean(server), `${label} defines portaly-vibe MCP server`)
  assert(server?.command === 'npx', `${label} uses official npx MCP command`)
  assert(JSON.stringify(server?.args) === JSON.stringify(['-y', '@portaly-ai/portaly-mcp']), `${label} uses @portaly-ai/portaly-mcp`)
  assert(server?.env?.PORTALY_API_TOKEN === 'mcp_ptly_xxx', `${label} documents official MCP token placeholder`)
}

for (const key of requiredEnv) assert(envExample.includes(key), `.env.example documents ${key}`)
for (const phrase of ['開源社群模板', 'open-source community template', 'Community', 'Classroom', 'Calendar', 'Members', 'Leaderboard', 'Membership Questions', 'InsForge + V Vibe', 'Bring Your Own Stack', 'Tiptap OSS Editor', 'Meilisearch']) {
  assert(readme.includes(phrase), `README includes "${phrase}"`)
}
for (const phrase of ['Community', 'Classroom', 'Calendar', 'Members', 'Leaderboard', 'About', 'Pricing', 'Membership Questions', '免費加入', '登入社群', '社群管理後台已開啟', '匯入 .CSV 名單']) {
  assert(app.includes(phrase), `App UI includes "${phrase}"`)
}
for (const phrase of ['PublicationAdminView', 'SearchView', 'NewsletterView']) {
  assert(!app.includes(phrase), `App removes legacy ${phrase}`)
}
for (const phrase of ['community', 'classroom', 'calendar', 'members', 'leaderboard', 'about', 'login', 'account', 'admin']) {
  assert(types.includes(phrase), `ViewId includes ${phrase}`)
}
for (const phrase of ['pricingMode', 'membershipQuestions', 'plugins', 'CourseAccessMode', 'CalendarEvent']) {
  assert(types.includes(phrase), `types include ${phrase}`)
}
for (const phrase of ['levelThresholds', 'freemium', 'level-unlock', 'buy-now', 'time-unlock', 'private', 'membership-questions', 'auto-dm']) {
  assert(seed.includes(phrase), `seed includes ${phrase}`)
}
for (const phrase of ['Webhook', 'Zapier Invite', 'Cancellation Video', 'Google Ads', 'Member Affiliates']) {
  assert(!seed.includes(phrase) && !app.includes(phrase), `App seed removes ${phrase}`)
}
for (const phrase of ['Geist Variable', '--border', '.hub-topbar', '.hub-search', '.hub-bento-grid', '.admin-tabs', '.leaderboard-list', '.plugin-card']) {
  assert(styles.includes(phrase), `styles include ${phrase}`)
}
assert(!styles.includes('hub-dock'), 'styles remove floating dock navigation')

assertPortalyMcpConfig(projectMcp, '.mcp.example.json')
assertPortalyMcpConfig(cursorMcp, '.cursor/mcp.example.json')
assert(gitignore.includes('.mcp.json'), '.gitignore excludes local .mcp.json')
assert(gitignore.includes('.cursor/mcp.json'), '.gitignore excludes local .cursor/mcp.json')

assert(packageJson.dependencies?.['@insforge/sdk'], 'package installs @insforge/sdk')
assert(packageJson.dependencies?.['@tiptap/react'], 'package installs @tiptap/react')
assert(packageJson.dependencies?.['@tiptap/starter-kit'], 'package installs @tiptap/starter-kit')
assert(packageJson.dependencies?.dompurify, 'package installs DOMPurify')
assert(packageJson.devDependencies?.['@insforge/cli'], 'package installs @insforge/cli')
assert(packageJson.scripts?.['check:integrations'], 'package exposes check:integrations')
assert(richTextEditor.includes('@tiptap/react'), 'RichTextEditor uses Tiptap React')
assert(richTextEditor.includes('@tiptap/starter-kit'), 'RichTextEditor uses Tiptap StarterKit')
assert(richText.includes('DOMPurify.sanitize'), 'rich-text helper sanitizes editor HTML with DOMPurify')
assert(!app.includes('className="segmented"'), 'App no longer exposes a role-switch segmented control')
for (const provider of ['Tiptap OSS Editor', 'PocketBase', 'Keycloak', 'Strapi', 'listmonk', 'Meilisearch', 'Cal.diy', 'Jitsi Meet', 'Novu', 'MinIO']) {
  assert(openSourceCatalog.includes(provider), `open-source catalog includes ${provider}`)
}
assert(checkoutFunction.includes('PORTALY_CHECKOUT_API_KEY'), 'Portaly checkout function reads dedicated server-side checkout key')
assert(checkoutFunction.includes('ALLOWED_ORIGINS'), 'Portaly checkout function restricts allowed origins')
assert(webhookFunction.includes('PORTALY_CALLBACK_SECRET'), 'optional payment callback verifies callback secret')
assert(webhookFunction.includes('timingSafeEqual'), 'optional payment callback uses timing-safe signature comparison')
assert(securityReview.includes('不要把真實 API key'), 'security review warns about real secrets')
assert(securityReview.includes('localStorage 只適合本機預覽'), 'security review warns localStorage is preview-only')
assert(rlsPolicies.includes('memberhub_has_paid_membership'), 'RLS policy template covers paid member access')
assert(rlsPolicies.includes('memberhub_is_admin'), 'RLS policy template covers admin access')

if (process.exitCode) {
  console.error('\nIntegration check failed.')
  process.exit(process.exitCode)
}

console.log('\nIntegration check passed.')
