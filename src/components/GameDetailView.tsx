import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GameInfo } from '../types'
import { ThemeColors } from '../config'

interface GameDetailViewProps {
  game: GameInfo
  themeColors: ThemeColors
  onBack: () => void
  onLaunch: (game: GameInfo) => void
  onEdit: (game: GameInfo) => void
  onToggleFavorite: (gameId: string) => void
}

export default function GameDetailView({ game, themeColors, onBack, onLaunch, onEdit, onToggleFavorite }: GameDetailViewProps) {
  const { t } = useTranslation()
  const [bannerError, setBannerError] = useState(false)
  const [coverError, setCoverError] = useState(false)

  const handleLaunch = () => onLaunch(game)
  const handleEdit = () => onEdit(game)
  const handleToggleFavorite = () => onToggleFavorite(game.id)

  const formatLastPlayed = (dateStr?: string) => {
    if (!dateStr) return t('gameCard.neverPlayed')
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return t('gameCard.playedToday')
    if (diffDays === 1) return t('gameCard.playedYesterday')
    if (diffDays < 7) return t('gameCard.playedDaysAgo', { days: diffDays })
    if (diffDays < 30) return t('gameCard.playedWeeksAgo', { weeks: Math.floor(diffDays / 7) })
    return t('gameCard.playedMonthsAgo', { months: Math.floor(diffDays / 30) })
  }

  const storeDisplayName = (store: string) => {
    switch (store) {
      case 'steam': return 'Steam'
      case 'epic': return 'Epic Games'
      case 'ea': return 'EA App'
      case 'custom': return t('sidebar.customGamesTab')
      default: return store
    }
  }

  const hasBanner = game.bannerImage && !bannerError
  const hasCover = game.coverImage && !coverError

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: themeColors.bg }}>
      {hasBanner && (
        <div className="w-full" style={{ height: '20rem' }}>
          <div className="relative h-full">
            <img
              src={`file://${game.bannerImage}?t=${Date.now()}`}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
              onError={() => setBannerError(true)}
            />
            <div className="absolute inset-0" style={{
              background: `linear-gradient(to top, ${themeColors.bg} 0%, transparent 60%)`
            }} />
          </div>
        </div>
      )}

      <div className="px-6 pb-6" style={{ position: 'relative', zIndex: 5 }}>
        {!hasBanner && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-6 transition-colors hover:opacity-80 pt-6"
          style={{ color: themeColors.textSecondary }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('gameDetail.back')}
        </button>
        )}

        {hasBanner && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{
              color: '#fff',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
              position: 'absolute',
              top: '-10rem',
              left: '1rem',
              zIndex: 20
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('gameDetail.back')}
          </button>
        )}

        <div
          className="flex flex-col md:flex-row gap-8"
          style={{
            marginTop: hasBanner ? '-8rem' : 0,
            alignItems: 'flex-start',
            position: 'relative',
            zIndex: 10
          }}
        >
          <div className="w-full md:w-72 flex-shrink-0" style={{ marginLeft: '2rem' }}>
            <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: themeColors.surface }}>
              {hasCover ? (
                <img
                  src={`file://${game.coverImage}?t=${Date.now()}`}
                  alt={game.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                  onError={() => setCoverError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-7xl font-bold opacity-30" style={{ color: themeColors.textSecondary }}>
                    {(game.name || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1" style={{ paddingTop: hasBanner ? '3rem' : 0 }}>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{
                  color: hasBanner ? '#fff' : themeColors.text,
                  textShadow: hasBanner ? '0 2px 8px rgba(0,0,0,0.8)' : 'none'
                }}>
                  {game.name}
                </h1>
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: hasBanner ? 'rgba(0,0,0,0.4)' : themeColors.surface,
                    border: `1px solid ${hasBanner ? 'rgba(255,255,255,0.2)' : themeColors.border}`,
                    color: hasBanner ? '#fff' : themeColors.textSecondary
                  }}
                >
                  {storeDisplayName(game.store)}
                </span>
              </div>
              <button
                onClick={handleToggleFavorite}
                className="p-2 rounded-full transition-colors flex-shrink-0"
                style={{ color: game.isFavorite ? '#ef4444' : (hasBanner ? 'rgba(255,255,255,0.7)' : themeColors.textSecondary) }}
              >
                <svg className="w-7 h-7" fill={game.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {hasBanner && (
        <div className="flex flex-col md:flex-row gap-8" style={{ marginTop: '2rem' }}>
          <div className="w-full md:w-72 flex-shrink-0" style={{ marginLeft: '2rem' }} />
          <div className="flex-1">
            <div className="space-y-4 mb-8">
              <div className="p-4 rounded-xl" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
                <h3 className="text-sm font-medium mb-3" style={{ color: themeColors.textSecondary }}>
                  {t('gameDetail.gameInfo')}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: themeColors.textSecondary }}>{t('gameDetail.lastPlayed')}</span>
                    <span style={{ color: themeColors.text }}>{formatLastPlayed(game.lastPlayed)}</span>
                  </div>
                  {game.playCount !== undefined && game.playCount > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color: themeColors.textSecondary }}>{t('gameDetail.playCount')}</span>
                      <span style={{ color: themeColors.text }}>{game.playCount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span style={{ color: themeColors.textSecondary }}>{t('gameDetail.store')}</span>
                    <span style={{ color: themeColors.text }}>{storeDisplayName(game.store)}</span>
                  </div>
                  {game.appid && (
                    <div className="flex justify-between">
                      <span style={{ color: themeColors.textSecondary }}>App ID</span>
                      <span style={{ color: themeColors.text }}>{game.appid}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLaunch}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {t('gameDetail.playGame')}
              </button>
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium"
                style={{
                  backgroundColor: themeColors.surface,
                  border: `1px solid ${themeColors.border}`,
                  color: themeColors.text
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t('gameDetail.editGame')}
              </button>
            </div>
          </div>
        </div>
        )}

        {!hasBanner && (
        <div className="flex flex-col md:flex-row gap-8" style={{ marginTop: '1rem', alignItems: 'flex-start' }}>
          <div className="w-full md:w-72 flex-shrink-0" style={{ marginLeft: '2rem' }} />
          <div className="flex-1">
            <div className="space-y-4 mb-8">
              <div className="p-4 rounded-xl" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
                <h3 className="text-sm font-medium mb-3" style={{ color: themeColors.textSecondary }}>
                  {t('gameDetail.gameInfo')}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: themeColors.textSecondary }}>{t('gameDetail.lastPlayed')}</span>
                    <span style={{ color: themeColors.text }}>{formatLastPlayed(game.lastPlayed)}</span>
                  </div>
                  {game.playCount !== undefined && game.playCount > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color: themeColors.textSecondary }}>{t('gameDetail.playCount')}</span>
                      <span style={{ color: themeColors.text }}>{game.playCount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span style={{ color: themeColors.textSecondary }}>{t('gameDetail.store')}</span>
                    <span style={{ color: themeColors.text }}>{storeDisplayName(game.store)}</span>
                  </div>
                  {game.appid && (
                    <div className="flex justify-between">
                      <span style={{ color: themeColors.textSecondary }}>App ID</span>
                      <span style={{ color: themeColors.text }}>{game.appid}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLaunch}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {t('gameDetail.playGame')}
              </button>
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium"
                style={{
                  backgroundColor: themeColors.surface,
                  border: `1px solid ${themeColors.border}`,
                  color: themeColors.text
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t('gameDetail.editGame')}
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
