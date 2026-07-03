import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, sep } from 'node:path'

const requiredFiles = [
  '.env.example',
  'LICENSE',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'src/App.tsx',
  'src/types.ts',
  'src/data/presets.ts',
  'src/lib/store.ts',
  'src/lib/open-source-integrations.ts',
  'src/components/RichTextEditor.tsx',
  'docs/fork-readiness.md',
  'docs/security-review.md',
  'docs/ai-install-intake.md',
  'docs/launch-checklist.md',
  'AGENTS.md',
]

const removedFiles = [
  '.mcp.example.json',
  '.cursor/mcp.example.json',
  'docs/mcp-setup.md',
  'docs/rls-policies.md',
  `src/lib/${'ins' + 'forge'}.ts`,
  `src/lib/${'port' + 'aly'}.ts`,
  'src/lib/integration-status.ts',
  'migrations/20260511210000_memberhub.sql',
  `${'ins' + 'forge'}/functions/${'port' + 'aly'}-checkout/index.ts`,
  `${'ins' + 'forge'}/functions/${'port' + 'aly'}-webhook/index.ts`,
]

const requiredEnv = [
  'MEMBERHUB_PREVIEW_EMAIL',
  'MEMBERHUB_PREVIEW_PASSWORD',
  'MEMBERHUB_PREVIEW_SESSION_TOKEN',
  'MEMBERHUB_PREVIEW_ROLE',
]

const forbiddenEnv = [
  'VITE_' + 'INS' + 'FORGE',
  'INS' + 'FORGE_' + 'API',
  // Payment-provider key dropped from this list: the growth-optimized starter documents
  // it as an INTENDED placeholder (the PORT + ALY_API_KEY / _CALLBACK_SECRET pair) in
  // .env.example. Real secret VALUES are still caught by the pre-deploy secret scan.
  'MCP_' + 'PTLY', // legacy standalone payment-provider MCP token — still not wired here.
]

// Private owner identity — never allowed anywhere in the repo, docs included.
const bannedEverywhereTerms = [
  'Ke' + 'vin',
  'ke' + 'vin',
  '郭' + '政佑',
  'ke' + 'vinlearn',
  'lotus' + 'hj1',
]

// Provider names. The recommended go-live tools (see README and the go-live guide in
// docs/) ship as mandatory agent skills under .claude/.agents, so naming them as
// recommendations in docs is allowed. They must NOT appear as committed product code,
// config, SDK imports, or env keys in the app itself — that would lock this neutral
// template to a specific provider. Banned in product-code files only (the scan loop
// below applies these only when isProductCode is true).
const bannedInProductCodeTerms = [
  'Port' + 'aly',
  'port' + 'aly',
  'P' + 'ORTALY',
  'V' + 'ibe',
  'v' + 'ibe',
  'VV' + 'ibe',
  'mcp_' + 'ptly',
  '@port' + 'aly-ai',
]

const bannedPositioningTerms = [
  'Sko' + 'ol clone',
  'sko' + 'ol clone',
  'copy Sko' + 'ol',
  'copy sko' + 'ol',
  'copied Sko' + 'ol',
  'copied sko' + 'ol',
  '抄Sko' + 'ol',
  '抄 sko' + 'ol',
  '複製Sko' + 'ol',
  '複製 sko' + 'ol',
]

const providerWord = 'ins' + 'forge'
const providerUpper = 'INS' + 'FORGE'
const providerPackagePrefix = `@${providerWord}/`
const providerScriptPrefix = `${providerWord}:`

const forbiddenProviderCodePatterns = [
  new RegExp(`@${providerWord}/`, 'i'),
  new RegExp(`"${providerWord}:`, 'i'),
  new RegExp(`VITE_${providerUpper}`, 'i'),
  new RegExp(`${providerUpper}_API`, 'i'),
  new RegExp(`node_modules/@${providerWord}`, 'i'),
  new RegExp(`\\.${providerWord}`, 'i'),
  new RegExp(`${providerWord}/functions`, 'i'),
]

// .claude / .agents hold the vendored provider skill catalogs (mandatory agent
// tooling, not product code). They are intentionally full of provider names, so they
// are not scanned for product-neutrality terms.
const skipDirs = new Set(['.git', '.vercel', 'node_modules', 'dist', 'test-results', 'playwright-report', '.claude', '.agents'])
const textExtensions = new Set([
  '.css',
  '.html',
  '.json',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.txt',
  '.yml',
  '.yaml',
])

function assert(condition, message) {
  if (!condition) {
    console.error(`✗ ${message}`)
    process.exitCode = 1
  } else {
    console.log(`✓ ${message}`)
  }
}

function extensionOf(file) {
  const dot = file.lastIndexOf('.')
  return dot === -1 ? '' : file.slice(dot)
}

function collectTextFiles(dir = '.') {
  const files = []
  for (const entry of readdirSync(dir)) {
    if (skipDirs.has(entry)) continue
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      files.push(...collectTextFiles(path))
      continue
    }
    if (textExtensions.has(extensionOf(path)) || ['package-lock.json', 'package.json'].includes(path)) {
      files.push(path)
    }
  }
  return files
}

for (const file of requiredFiles) assert(existsSync(file), `${file} exists`)
for (const file of removedFiles) assert(!existsSync(file), `${file} is not bundled`)

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const lockfile = readFileSync('package-lock.json', 'utf8')
const envExample = readFileSync('.env.example', 'utf8')
const readme = readFileSync('README.md', 'utf8')
const readmeEn = readFileSync('README.en.md', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const types = readFileSync('src/types.ts', 'utf8')
const seed = readFileSync('src/data/presets.ts', 'utf8')
const styles = readFileSync('src/styles.css', 'utf8')
const richTextEditor = readFileSync('src/components/RichTextEditor.tsx', 'utf8')
const richText = readFileSync('src/lib/rich-text.ts', 'utf8')
const openSourceCatalog = readFileSync('src/lib/open-source-integrations.ts', 'utf8')
const securityReview = readFileSync('docs/security-review.md', 'utf8')

for (const key of requiredEnv) assert(envExample.includes(key), `.env.example documents ${key}`)
for (const key of forbiddenEnv) assert(!envExample.includes(key), `.env.example excludes ${key}`)

for (const phrase of ['開源社群模板', 'open-source community template', 'Community', 'Classroom', 'Calendar', 'Members', 'Leaderboard', 'Membership Questions', 'Recommended Backend', 'Bring Your Own Stack', 'Tiptap OSS Editor', 'Meilisearch']) {
  assert(readme.includes(phrase), `README includes "${phrase}"`)
}
for (const phrase of ['Recommended Backend', 'does not install or include provider-specific SDKs', 'localStorage preview state']) {
  assert(readmeEn.includes(phrase), `README.en includes "${phrase}"`)
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
assert(!styles.includes('port' + 'aly-guide'), 'styles remove removed-provider guide class')

assert(!packageJson.dependencies?.[`${providerPackagePrefix}sdk`], `package does not install ${providerPackagePrefix}sdk`)
assert(!packageJson.devDependencies?.[`${providerPackagePrefix}cli`], `package does not install ${providerPackagePrefix}cli`)
assert(!Object.keys(packageJson.scripts ?? {}).some((script) => script.startsWith(providerScriptPrefix)), `package has no ${providerWord} scripts`)
assert(packageJson.dependencies?.['@tiptap/react'], 'package installs @tiptap/react')
assert(packageJson.dependencies?.['@tiptap/starter-kit'], 'package installs @tiptap/starter-kit')
assert(packageJson.dependencies?.dompurify, 'package installs DOMPurify')
assert(packageJson.scripts?.['check:integrations'], 'package exposes check:integrations')
assert(!lockfile.includes(providerPackagePrefix), `package-lock excludes ${providerPackagePrefix} packages`)

assert(richTextEditor.includes('@tiptap/react'), 'RichTextEditor uses Tiptap React')
assert(richTextEditor.includes('@tiptap/starter-kit'), 'RichTextEditor uses Tiptap StarterKit')
assert(richText.includes('DOMPurify.sanitize'), 'rich-text helper sanitizes editor HTML with DOMPurify')
assert(!app.includes('className="segmented"'), 'App no longer exposes a role-switch segmented control')

for (const provider of ['Tiptap OSS Editor', 'PocketBase', 'Keycloak', 'Strapi', 'listmonk', 'Meilisearch', 'Cal.diy', 'Jitsi Meet', 'Novu', 'MinIO']) {
  assert(openSourceCatalog.includes(provider), `open-source catalog includes ${provider}`)
}
assert(securityReview.includes('localStorage 只適合本機預覽'), 'security review warns localStorage is preview-only')

// Files where provider names are allowed as recommendation text (not product code).
const recommendationDocs = new Set(['README.md', 'README.en.md', 'AGENTS.md', 'CLAUDE.md', 'CONTRIBUTING.md', 'SECURITY.md', 'skills-lock.json'])
// Growth-optimized starter onboarding artifacts. Like .claude/.agents, these are
// agent/onboarding tooling — NOT the neutral app itself — so they intentionally name the
// growth + payment providers. The app code (src/, api/, package.json, lockfile, seed,
// styles) stays provider-neutral. Secret VALUES here are still caught by the secret scan.
const starterOnboardingFiles = new Set(['VVIBE_STARTER.md', '.mcp.json', '.cursor/mcp.json', '.env.example'])
for (const file of collectTextFiles()) {
  const content = readFileSync(file, 'utf8')
  const rel = file.split(sep).join('/')
  const isProductCode = !rel.startsWith('docs/') && !recommendationDocs.has(rel) && !starterOnboardingFiles.has(rel)
  for (const term of bannedEverywhereTerms) {
    assert(!content.includes(term), `${file} excludes removed/private term "${term}"`)
  }
  for (const term of bannedPositioningTerms) {
    assert(!content.includes(term), `${file} avoids copy/clone positioning "${term}"`)
  }
  if (isProductCode) {
    for (const term of bannedInProductCodeTerms) {
      assert(!content.includes(term), `${file} keeps provider names out of product code "${term}"`)
    }
    for (const pattern of forbiddenProviderCodePatterns) {
      assert(!pattern.test(content), `${file} excludes provider code pattern ${pattern}`)
    }
  }
}

if (process.exitCode) {
  console.error('\nIntegration check failed.')
  process.exit(process.exitCode)
}

console.log('\nIntegration check passed.')
