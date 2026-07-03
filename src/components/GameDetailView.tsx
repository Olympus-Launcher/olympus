import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { GameInfo, SteamGameMetadata } from '../types'
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
  const [reqTab, setReqTab] = useState<'minimum' | 'recommended'>('minimum')
  const [reqExpanded, setReqExpanded] = useState(true)
  const [steamMetadata, setSteamMetadata] = useState<SteamGameMetadata | null>(null)
  const [metadataLoading, setMetadataLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  const screenshots = steamMetadata?.screenshots ?? []
  const clampedIndex = screenshots.length === 0 ? 0 : Math.min(currentIndex, screenshots.length - 1)
  const currentScreenshot = screenshots[clampedIndex] ?? null
  const GAP = 12
  const leftIndex = Math.max(0, Math.min(clampedIndex - 1, Math.max(0, screenshots.length - 3)))
  const MAX_VISIBLE_DOTS = 5
  const dotOffset = Math.max(0, Math.min(currentIndex - 2, screenshots.length - MAX_VISIBLE_DOTS))

  useEffect(() => {
    setCurrentIndex(0)
    setIsExpanded(false)
    if (game.store === 'steam' && game.appid) {
      setMetadataLoading(true)
      window.electronAPI.getSteamGameMetadata(game.appid).then((metadata) => {
        if (metadata) {
          setSteamMetadata(metadata)
          setCurrentIndex(metadata.screenshots && metadata.screenshots.length >= 2 ? 1 : 0)
        }
        setMetadataLoading(false)
      }).catch(() => {
        setMetadataLoading(false)
      })
    }
  }, [game.store, game.appid])

  useEffect(() => {
    if (!isExpanded) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false)
      if (e.key === 'ArrowLeft') setCurrentIndex(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setCurrentIndex(i => Math.min(screenshots.length - 1, i + 1))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded])

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
          <div className="w-full md:w-64 flex-shrink-0">
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
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLaunch}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {t('gameDetail.playGame')}
                </button>
                <button
                  onClick={handleToggleFavorite}
                  className="p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0"
                  style={{ color: game.isFavorite ? '#ef4444' : (hasBanner ? 'rgba(255,255,255,0.7)' : themeColors.textSecondary) }}
                >
                  <svg className="w-7 h-7" fill={game.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button
                  onClick={handleEdit}
                  className="p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0"
                  style={{ color: hasBanner ? 'rgba(255,255,255,0.7)' : themeColors.textSecondary }}
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_420px] gap-6 mt-6 mb-8" style={{ alignItems: 'start' }}>
              <div className="flex flex-col gap-6">
                {screenshots.length > 0 && (
                  <div className="rounded-xl overflow-hidden" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-4" style={{ color: themeColors.textSecondary }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-sm font-semibold uppercase tracking-wider">
                          {t('gameDetail.screenshots')}
                        </h3>
                      </div>

                      <div className="relative w-full aspect-[21/9] overflow-x-clip overflow-y-visible rounded-lg">
                        <div
                          className="flex gap-3 h-full"
                          style={{
                            transform: `translateX(calc(-${leftIndex} * (100% + ${GAP}px) / 3))`,
                            transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        >
                          {screenshots.map((url, i) => (
                            <button
                              key={i}
                              onClick={() => { setCurrentIndex(i); setIsExpanded(true) }}
                              className="flex-shrink-0 relative rounded-lg overflow-hidden transition-all duration-150 hover:scale-110 hover:z-10 hover:shadow-xl"
                              style={{ width: `calc((100% - ${2 * GAP}px) / 3)` }}
                            >
                              <img
                                src={url}
                                alt=""
                                className="w-full h-full object-cover"
                                draggable={false}
                              />
                            </button>
                          ))}
                        </div>

                        {clampedIndex > 0 && (
                          <button
                            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all z-10 hover:scale-110 backdrop-blur-sm"
                            style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                        )}

                        {clampedIndex < screenshots.length - 1 && (
                          <button
                            onClick={() => setCurrentIndex(i => Math.min(screenshots.length - 1, i + 1))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all z-10 hover:scale-110 backdrop-blur-sm"
                            style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </div>

                      <div className="flex justify-center mt-3">
                        <div className="flex items-center gap-1.5">
                          {screenshots.slice(dotOffset, dotOffset + MAX_VISIBLE_DOTS).map((_, idx) => {
                            const i = dotOffset + idx
                            return (
                              <button key={i} onClick={() => setCurrentIndex(i)} className="flex-shrink-0 transition-all duration-200 rounded-full"
                                style={{
                                  width: i === currentIndex ? '16px' : '6px',
                                  height: '6px',
                                  backgroundColor: i === currentIndex ? 'var(--color-primary-500, #6366f1)' : 'rgba(255,255,255,0.25)',
                                }}
                              />
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-5 rounded-xl" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
                  <div className="flex items-center gap-2 mb-4" style={{ color: themeColors.textSecondary }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-sm font-semibold uppercase tracking-wider">
                      {t('gameDetail.gameInfo')}
                    </h3>
                  </div>
                  <div className="space-y-3">
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

                  {steamMetadata?.aboutTheGame && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: themeColors.border }}>
                      <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: themeColors.text }}>
                        {steamMetadata?.aboutTheGame || ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-xl" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}`, alignSelf: 'start' }}>
                <button
                  onClick={() => setReqExpanded(!reqExpanded)}
                  className="w-full flex items-center justify-between mb-4 rounded-lg transition-colors duration-150 px-1 -mx-1"
                  style={{ color: themeColors.textSecondary }}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-sm font-semibold uppercase tracking-wider">
                      System Requirements
                    </h3>
                  </div>
                  <svg
                    className="w-4 h-4 transition-transform duration-200"
                    style={{ transform: reqExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {reqExpanded && (
                <>
                <div className="flex rounded-lg overflow-hidden mb-4" style={{ border: `1px solid ${themeColors.border}` }}>
                  <button
                    onClick={() => setReqTab('minimum')}
                    className="flex-1 px-3 py-1 text-xs font-medium transition-colors duration-150"
                    style={{
                      backgroundColor: reqTab === 'minimum' ? 'var(--color-primary-600, #6366f1)' : 'transparent',
                      color: reqTab === 'minimum' ? '#fff' : themeColors.textSecondary
                    }}
                  >
                    Minimum
                  </button>
                  <button
                    onClick={() => setReqTab('recommended')}
                    className="flex-1 px-3 py-1 text-xs font-medium transition-colors duration-150"
                    style={{
                      backgroundColor: reqTab === 'recommended' ? 'var(--color-primary-600, #6366f1)' : 'transparent',
                      color: reqTab === 'recommended' ? '#fff' : themeColors.textSecondary,
                      borderLeft: `1px solid ${themeColors.border}`
                    }}
                  >
                    Recommended
                  </button>
                </div>
                {metadataLoading ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: themeColors.textSecondary }}>Loading...</span>
                  </div>
                </div>
                ) : reqTab === 'minimum' ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: themeColors.textSecondary }}>OS</span>
                    <span className="text-sm text-right" style={{ color: themeColors.text }}>{steamMetadata?.minimumRequirements?.match(/OS:\s*([^\n]+)/i)?.[1]?.trim() || 'Windows 10 64-bit'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: themeColors.textSecondary }}>Processor</span>
                    <span className="text-sm text-right" style={{ color: themeColors.text }}>{steamMetadata?.minimumRequirements?.match(/Processor:\s*([^\n]+)/i)?.[1]?.trim() || 'Intel Core i5-8400 / Ryzen 5 2600'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: themeColors.textSecondary }}>Memory</span>
                    <span className="text-sm text-right" style={{ color: themeColors.text }}>{steamMetadata?.minimumRequirements?.match(/Memory:\s*([^\n]+)/i)?.[1]?.trim() || '8 GB RAM'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: themeColors.textSecondary }}>Graphics</span>
                    <span className="text-sm text-right" style={{ color: themeColors.text }}>{steamMetadata?.minimumRequirements?.match(/Graphics:\s*([^\n]+)/i)?.[1]?.trim() || 'GTX 1060 / RX 580'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: themeColors.textSecondary }}>Storage</span>
                    <span className="text-sm text-right" style={{ color: themeColors.text }}>{steamMetadata?.minimumRequirements?.match(/Storage:\s*([^\n]+)/i)?.[1]?.trim() || '60 GB'}</span>
                  </div>
                </div>
                ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: themeColors.textSecondary }}>OS</span>
                    <span className="text-sm text-right" style={{ color: themeColors.text }}>{steamMetadata?.recommendedRequirements?.match(/OS:\s*([^\n]+)/i)?.[1]?.trim() || 'Windows 11 64-bit'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: themeColors.textSecondary }}>Processor</span>
                    <span className="text-sm text-right" style={{ color: themeColors.text }}>{steamMetadata?.recommendedRequirements?.match(/Processor:\s*([^\n]+)/i)?.[1]?.trim() || 'Core i7-9700 / Ryzen 7 3700X'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: themeColors.textSecondary }}>Memory</span>
                    <span className="text-sm text-right" style={{ color: themeColors.text }}>{steamMetadata?.recommendedRequirements?.match(/Memory:\s*([^\n]+)/i)?.[1]?.trim() || '16 GB RAM'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: themeColors.textSecondary }}>Graphics</span>
                    <span className="text-sm text-right" style={{ color: themeColors.text }}>{steamMetadata?.recommendedRequirements?.match(/Graphics:\s*([^\n]+)/i)?.[1]?.trim() || 'RTX 2070 / RX 6700 XT'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: themeColors.textSecondary }}>Storage</span>
                    <span className="text-sm text-right" style={{ color: themeColors.text }}>{steamMetadata?.recommendedRequirements?.match(/Storage:\s*([^\n]+)/i)?.[1]?.trim() || '60 GB SSD'}</span>
                  </div>
                </div>
                )}
                </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {isExpanded && currentScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          onClick={() => setIsExpanded(false)}
        >
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute top-4 right-4 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all z-10"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {currentIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => i - 1) }}
              className="absolute left-4 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all z-10"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <img
            src={currentScreenshot}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain select-none"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />

          {currentIndex < screenshots.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => i + 1) }}
              className="absolute right-4 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all z-10"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
