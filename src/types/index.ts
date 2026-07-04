import { StoreType, ThemeMode } from '../config'

export interface GameInfo {
  id: string
  name: string
  executablePath: string
  coverImage?: string
  bannerImage?: string
  bannerFocalX?: number
  bannerFocalY?: number
  bannerZoom?: number
  store: StoreType
  installLocation?: string
  lastPlayed?: string
  playCount?: number
  isFavorite?: boolean
  isHidden?: boolean
  appid?: string
  processName?: string
}

export interface Settings {
  theme: ThemeMode
  scanOnStartup: boolean
  hardwareAcceleration: boolean
  language?: string
  showStoreOnGameCard?: boolean
  autoDownloadCovers?: boolean
  integrations?: {
    steamGridDBApiKey?: string
  }
}

export type ViewType = 'all' | 'favorites' | 'recent' | 'steam' | 'epic' | 'ea' | 'custom' | 'settings' | 'game-detail'

export interface SteamGameMetadata {
  appId: string
  name: string
  developers: string[]
  publishers: string[]
  releaseDate: string | null
  detailedDescription: string
  aboutTheGame: string
  shortDescription: string
  genres: string[]
  screenshots: string[]
  minimumRequirements: string
  recommendedRequirements: string
  headerImage: string | null
}

export interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error' | 'dev-mode'
  version?: string
  releaseNotes?: string
  percent?: number
  error?: string
}


