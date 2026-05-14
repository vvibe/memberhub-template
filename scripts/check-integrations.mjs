import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
  '.mcp.json',
  '.cursor/mcp.json',
  '.env.example',
  'src/lib/insforge.ts',
  'src/lib/portaly.ts',
  'migrations/20260511210000_memberhub.sql',
  'insforge/functions/portaly-checkout/index.ts',
  'insforge/functions/portaly-webhook/index.ts',
  'docs/ai-install-intake.md',
  'docs/fork-readiness.md',
  'docs/launch-checklist.md',
  'docs/mcp-setup.md',
  'AGENTS.md',
]

const requiredEnv = [
  'VITE_INSFORGE_URL',
  'VITE_INSFORGE_ANON_KEY',
  'INSFORGE_API_KEY',
  'PORTALY_API_KEY',
  'PORTALY_CALLBACK_SECRET',
  'PORTALY_MCP_TOKEN',
  'APP_BASE_URL',
  'ALLOWED_ORIGINS',
]

const requiredMigrationTables = [
  'profiles',
  'memberships',
  'plans',
  'content_items',
  'payment_events',
  'vibe_sync_state',
]

const requiredReadmePhrases = [
  'Portaly Vibe 產品優化工具',
  'InsForge Auth',
  'Portaly Vibe hosted checkout',
  '是否需要啟用金流、訂閱方案與發票流程',
  '可能產生成本',
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

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const projectMcp = JSON.parse(readFileSync('.mcp.json', 'utf8'))
const cursorMcp = JSON.parse(readFileSync('.cursor/mcp.json', 'utf8'))
const envExample = readFileSync('.env.example', 'utf8')
const migration = readFileSync('migrations/20260511210000_memberhub.sql', 'utf8')
const readme = readFileSync('README.md', 'utf8')
const agents = readFileSync('AGENTS.md', 'utf8')
const forkReadiness = readFileSync('docs/fork-readiness.md', 'utf8')
const checkoutFunction = readFileSync('insforge/functions/portaly-checkout/index.ts', 'utf8')
const webhookFunction = readFileSync('insforge/functions/portaly-webhook/index.ts', 'utf8')

function assertPortalyMcpConfig(config, label) {
  const server = config.mcpServers?.['portaly-vibe']
  assert(Boolean(server), `${label} defines portaly-vibe MCP server`)
  assert(server?.type === 'http', `${label} uses HTTP transport`)
  assert(server?.url === 'https://mcp.portaly.ai', `${label} points to https://mcp.portaly.ai`)
  assert(server?.headers?.Authorization === 'Bearer <YOUR_TOKEN>', `${label} documents Authorization bearer token placeholder`)
}

for (const file of requiredFiles) assert(existsSync(file), `${file} exists`)
for (const key of requiredEnv) assert(envExample.includes(key), `.env.example documents ${key}`)
for (const table of requiredMigrationTables) assert(migration.includes(`create table if not exists ${table}`), `migration includes ${table}`)
for (const phrase of requiredReadmePhrases) assert(readme.includes(phrase), `README includes "${phrase}"`)
assertPortalyMcpConfig(projectMcp, '.mcp.json')
assertPortalyMcpConfig(cursorMcp, '.cursor/mcp.json')

assert(packageJson.dependencies?.['@insforge/sdk'], 'package installs @insforge/sdk')
assert(packageJson.devDependencies?.['@insforge/cli'], 'package installs @insforge/cli')
assert(packageJson.scripts?.['insforge:migrate'], 'package exposes insforge:migrate')
assert(packageJson.scripts?.['insforge:functions:deploy'], 'package exposes insforge:functions:deploy')
assert(packageJson.scripts?.['check:integrations'], 'package exposes check:integrations')
assert(checkoutFunction.includes('/api/creator-subscription/checkout-sessions'), 'Portaly checkout function calls hosted checkout API')
assert(checkoutFunction.includes('PORTALY_API_KEY'), 'Portaly checkout function reads server-side API key')
assert(checkoutFunction.includes('ALLOWED_ORIGINS'), 'Portaly checkout function restricts allowed origins')
assert(checkoutFunction.includes('origin_not_allowed'), 'Portaly checkout function rejects untrusted browser origins')
assert(webhookFunction.includes('PORTALY_CALLBACK_SECRET'), 'Portaly webhook verifies callback secret')
assert(webhookFunction.includes('x-portaly-signature'), 'Portaly webhook reads signature header')
assert(webhookFunction.includes('timingSafeEqual'), 'Portaly webhook uses timing-safe signature comparison')
assert(agents.includes('Only after the above is complete, ask whether the user wants to enable payments'), 'AGENTS keeps payment opt-in guard')
assert(forkReadiness.includes('可能產生成本'), 'fork readiness documents possible costs')
assert(forkReadiness.includes('安全注意'), 'fork readiness documents security notes')

if (process.exitCode) {
  console.error('\nIntegration check failed.')
  process.exit(process.exitCode)
}

console.log('\nIntegration check passed.')
