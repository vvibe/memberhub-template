import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const outDir = path.join(root, 'seed', 'generated')
fs.mkdirSync(outDir, { recursive: true })

const payload = {
  generatedAt: new Date().toISOString(),
  note: 'MemberHub ships one default membership community preset in src/data/presets.ts. This file is a marker for deploy pipelines that expect a seed artifact.',
  presets: ['memberhub'],
}

fs.writeFileSync(path.join(outDir, 'preview-seed.json'), JSON.stringify(payload, null, 2))
console.log('Generated seed/generated/preview-seed.json')
