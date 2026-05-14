import { createClient, type InsForgeClient } from '@insforge/sdk'

const placeholderValues = new Set(['', 'https://your-app.insforge.app', 'replace_with_insforge_anon_key'])

export const insforgeConfig = {
  url: import.meta.env.VITE_INSFORGE_URL ?? '',
  anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY ?? '',
}

export function hasInsForgeConfig() {
  return !placeholderValues.has(insforgeConfig.url) && !placeholderValues.has(insforgeConfig.anonKey)
}

let browserClient: InsForgeClient | null = null

export function getInsForgeClient() {
  if (!hasInsForgeConfig()) return null
  browserClient ??= createClient({
    baseUrl: insforgeConfig.url,
    anonKey: insforgeConfig.anonKey,
  })
  return browserClient
}
