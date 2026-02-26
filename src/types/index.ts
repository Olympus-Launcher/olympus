import { StoreType, ThemeMode } from '../config'

export interface GameInfo {
  id: string
  name: string
  executablePath: string
  coverImage?: string
  store: StoreType
  installLocation?: string
  lastPlayed?: string
  playCount?: number
  isFavorite?: boolean
}

export interface Settings {
  theme: ThemeMode
  scanOnStartup: boolean
}

export type ViewType = 'all' | 'favorites' | 'recent' | 'steam' | 'epic' | 'ea' | 'custom' | 'settings'
