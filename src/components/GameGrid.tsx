import { useState } from 'react'
import { GameInfo } from '../types'
import GameCard from './GameCard'
import { labels } from '../config'

interface GameGridProps {
  games: GameInfo[]
  onLaunch: (game: GameInfo) => void
  onRemove: (gameId: string) => void
  onToggleFavorite: (gameId: string) => void
  isEmpty: boolean
  isScanning: boolean
  onScan: () => void
}

export default function GameGrid({ 
  games, 
  onLaunch, 
  onRemove, 
  onToggleFavorite,
  isEmpty,
  isScanning,
  onScan
}: GameGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  if (isEmpty && !isScanning) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl placeholder-icon flex items-center justify-center">
            <svg className="w-12 h-12 text-dark-textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark-text mb-2">{labels.gameGrid.noGamesFound}</h2>
          <p className="text-dark-textSecondary mb-6">
            {labels.gameGrid.noGamesDescription}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-lg transition-colors"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {labels.gameGrid.scanning}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {labels.gameGrid.scanForGames}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' 
                ? 'bg-primary-600 text-white' 
                : 'bg-dark-card text-dark-textSecondary hover:text-dark-text'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' 
                ? 'bg-primary-600 text-white' 
                : 'bg-dark-card text-dark-textSecondary hover:text-dark-text'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>

        {isScanning && (
          <div className="flex items-center gap-2 text-dark-textSecondary">
            <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
            <span className="text-sm">{labels.gameGrid.scanningForGames}</span>
          </div>
        )}
      </div>

      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6'
        : 'space-y-3'
      }>
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            viewMode={viewMode}
            onLaunch={onLaunch}
            onRemove={onRemove}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </div>
  )
}
