import { app } from 'electron'
import path from 'path'
import log from 'electron-log'
import Store from 'electron-store'
import { SteamGameMetadata } from './types'

const metadataStore = new Store({
  cwd: path.join(app.getPath('userData'), 'config'),
  name: 'metadata'
})

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

function parseRequirements(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  const lines = text.split('\n')
  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0 && colonIndex < 50) {
      const key = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()
      if (key && value) {
        result[key] = value
      }
    }
  }
  return result
}

function getCachedMetadata(appId: string): SteamGameMetadata | null {
  const cache = metadataStore.get('steamMetadata') as Record<string, SteamGameMetadata> | undefined
  if (cache && cache[appId]) {
    log.info(`[SteamMetadata] Cache hit for appId ${appId}`)
    return cache[appId]
  }
  return null
}

function setCachedMetadata(appId: string, data: SteamGameMetadata): void {
  const cache = metadataStore.get('steamMetadata') as Record<string, SteamGameMetadata> | undefined
  metadataStore.set('steamMetadata', { ...(cache || {}), [appId]: data })
  log.info(`[SteamMetadata] Cached metadata for appId ${appId}`)
}

export async function getSteamGameMetadata(
  appId: string,
  language = 'english'
): Promise<SteamGameMetadata | null> {
  if (!appId) {
    log.error('[SteamMetadata] No appId provided')
    return null
  }

  const cached = getCachedMetadata(appId)
  if (cached) return cached

  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${encodeURIComponent(appId)}&l=${encodeURIComponent(language)}&cc=us`
    log.info(`[SteamMetadata] Fetching metadata for appId ${appId}`)

    const response = await fetch(url)

    if (!response.ok) {
      log.error(`[SteamMetadata] HTTP ${response.status} for appId ${appId}`)
      return null
    }

    const data = await response.json()
    const appData = data[appId]

    if (!appData || appData.success !== true) {
      log.error(`[SteamMetadata] Steam returned success=false for appId ${appId}`)
      return null
    }

    const d = appData.data

    const metadata: SteamGameMetadata = {
      appId,
      name: d.name || '',
      developers: d.developers || [],
      publishers: d.publishers || [],
      releaseDate: d.release_date?.date || null,
      detailedDescription: stripHtml(d.detailed_description || ''),
      aboutTheGame: stripHtml(d.about_the_game || ''),
      shortDescription: stripHtml(d.short_description || ''),
      genres: (d.genres || []).map((g: { description: string }) => g.description),
      screenshots: (d.screenshots || []).map((s: { path_full: string }) => s.path_full),
      minimumRequirements: stripHtml(d.pc_requirements?.minimum || ''),
      recommendedRequirements: stripHtml(d.pc_requirements?.recommended || ''),
      headerImage: d.header_image || null,
    }

    setCachedMetadata(appId, metadata)
    return metadata
  } catch (error) {
    log.error(`[SteamMetadata] Error fetching metadata for appId ${appId}:`, error)
    return null
  }
}

export { stripHtml, parseRequirements }
