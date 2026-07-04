export interface GameInfo {
  id: string
  name: string
  executablePath: string
  coverImage?: string
  bannerImage?: string
  bannerFocalX?: number
  bannerFocalY?: number
  bannerZoom?: number
  store: 'steam' | 'epic' | 'ea' | 'custom'
  installLocation?: string
  lastPlayed?: string
  playCount?: number
  isFavorite?: boolean
  isHidden?: boolean
  appid?: string
  processName?: string
}

export interface Settings {
  theme: string
  scanOnStartup: boolean
  hardwareAcceleration: boolean
  language?: string
  showStoreOnGameCard?: boolean
  autoDownloadCovers?: boolean
  integrations?: {
    steamGridDBApiKey?: string
  }
}

export interface SteamGridDBGame {
  id: number
  name: string
  types: string[]
  verified: boolean
}

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

export interface SteamGridDBGrid {
  id: number
  url: string
  thumb: string
  style: string
  dimensions: string
  likes: number
}
