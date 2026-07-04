import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { GameInfo } from '../types'
import { ThemeMode } from '../config'
import SteamGridDBModal from './SteamGridDBModal'
import { Tooltip } from './Tooltip'

interface EditGameModalProps {
  game: GameInfo
  theme: ThemeMode
  onClose: () => void
  onSave: (game: GameInfo) => void
}

export default function EditGameModal({ game, theme, onClose, onSave }: EditGameModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(game.name)
  const [executablePath, setExecutablePath] = useState(game.executablePath)
  const [coverImage, setCoverImage] = useState(game.coverImage || '')
  const [bannerImage, setBannerImage] = useState(game.bannerImage || '')
  const [bannerFocalX, setBannerFocalX] = useState(game.bannerFocalX ?? 50)
  const [bannerFocalY, setBannerFocalY] = useState(game.bannerFocalY ?? 50)
  const [bannerZoom, setBannerZoom] = useState(game.bannerZoom ?? 1)
  const [isLoading, setIsLoading] = useState(false)
  const [showSteamGridDB, setShowSteamGridDB] = useState<'cover' | 'hero' | false>(false)
  const [activeTab, setActiveTab] = useState<'game' | 'artwork'>('game')
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; fx: number; fy: number } | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [previewNaturalSize, setPreviewNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const gameBannerAspectRatio = useMemo(() => {
    const sidebarWidth = 280
    const contentWidth = window.innerWidth - sidebarWidth
    return contentWidth / (20 * 16)
  }, [])

  const isStoreGame = game.store === 'steam' || game.store === 'epic' || game.store === 'ea'

  const handleCoverSelected = (coverPath: string) => {
    setCoverImage(coverPath)
  }

  const handleBannerSelected = (bannerPath: string) => {
    setBannerImage(bannerPath)
  }

  const handleSelectExecutable = async () => {
    const path = await window.electronAPI.selectExecutable()
    if (path) {
      setExecutablePath(path)
    }
  }

  const handleSelectImage = async () => {
    const path = await window.electronAPI.selectImage()
    if (path) {
      setCoverImage(path)
    }
  }

  const handleSelectBannerImage = async () => {
    const path = await window.electronAPI.selectImage()
    if (path) {
      setBannerImage(path)
    }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    dragRef.current = { startX: e.clientX, startY: e.clientY, fx: bannerFocalX, fy: bannerFocalY }
  }, [bannerFocalX, bannerFocalY])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setBannerFocalX(Math.max(0, Math.min(100, dragRef.current.fx + dx * 0.3)))
    setBannerFocalY(Math.max(0, Math.min(100, dragRef.current.fy + dy * 0.3)))
  }, [isDragging])

  const stopDragging = useCallback(() => {
    setIsDragging(false)
    dragRef.current = null
  }, [])

  useEffect(() => {
    if (!isDragging) return
    const handleMouseUp = () => stopDragging()
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [isDragging, stopDragging])

  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setBannerZoom(prev => Math.max(1, Math.min(5, +(prev + delta).toFixed(2))))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [bannerImage, activeTab])

  const updateContainerSize = useCallback(() => {
    if (previewRef.current) {
      const r = previewRef.current.getBoundingClientRect()
      setContainerSize({ w: r.width, h: r.height })
    }
  }, [])

  useEffect(() => {
    updateContainerSize()
    window.addEventListener('resize', updateContainerSize)
    return () => window.removeEventListener('resize', updateContainerSize)
  }, [updateContainerSize, bannerImage])

  useEffect(() => {
    if (activeTab === 'artwork') updateContainerSize()
  }, [activeTab, updateContainerSize])

  const previewStyle = useMemo((): React.CSSProperties => {
    if (!containerSize.w || !containerSize.h || !previewNaturalSize) {
      return { width: '100%', height: '100%', objectFit: 'cover', opacity: 0 }
    }
    return {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transform: `scale(${bannerZoom})`,
      transformOrigin: `${bannerFocalX}% ${bannerFocalY}%`,
      cursor: isDragging ? 'grabbing' : 'grab',
      pointerEvents: 'none',
      opacity: 1,
    }
  }, [containerSize, previewNaturalSize, bannerFocalX, bannerFocalY, bannerZoom, isDragging])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isStoreGame && (!name || !executablePath)) return

    setIsLoading(true)
    try {
      const payload: GameInfo = isStoreGame
        ? { ...game, coverImage: coverImage || undefined, bannerImage: bannerImage || undefined }
        : { ...game, name, executablePath, coverImage: coverImage || undefined, bannerImage: bannerImage || undefined }
      payload.bannerFocalX = bannerFocalX
      payload.bannerFocalY = bannerFocalY
      payload.bannerZoom = bannerZoom
      onSave(payload)
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'game' as const, label: t('editGame.tabGame') },
    { id: 'artwork' as const, label: t('editGame.tabArtwork') },
  ]

  return (
    <div className="fixed inset-0 bg-black/70 modal-overlay flex items-center justify-center z-50">
      <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-4xl mx-4 overflow-hidden fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border">
          <h2 className="text-lg font-semibold text-theme-text">{t('editGame.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 text-theme-textSecondary hover:text-theme-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b px-6" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2.5 font-medium transition-colors relative text-sm"
              style={{ color: activeTab === tab.id ? '#0284c7' : 'var(--color-text-secondary, #888)' }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: '#0284c7' }} />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {activeTab === 'game' && (
            <>
              <div>
                <label className="block text-sm font-medium text-theme-textSecondary mb-2">
                  {t('editGame.gameName')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isStoreGame}
                  className={`w-full px-4 py-2 bg-theme-bg border border-theme-border rounded-lg text-theme-text ${isStoreGame ? 'opacity-50 cursor-not-allowed' : ''}`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-textSecondary mb-2">
                  {t('editGame.executablePath')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={executablePath}
                    onChange={(e) => setExecutablePath(e.target.value)}
                    disabled={isStoreGame}
                    className={`flex-1 px-4 py-2 bg-theme-bg border border-theme-border rounded-lg text-theme-text ${isStoreGame ? 'opacity-50 cursor-not-allowed' : ''}`}
                    required
                  />
                  {!isStoreGame && (
                  <button
                    type="button"
                    onClick={handleSelectExecutable}
                    className="px-4 py-2 bg-theme-card border border-theme-border rounded-lg text-theme-text hover:bg-theme-border transition-colors"
                  >
                    {t('editGame.browse')}
                  </button>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'artwork' && (
            <>
              <div>
                <label className="block text-sm font-medium text-theme-textSecondary mb-2">
                  {t('editGame.coverImage')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="flex-1 px-4 py-2 bg-theme-bg border border-theme-border rounded-lg text-theme-text"
                  />
                  <button
                    type="button"
                    onClick={handleSelectImage}
                    className="px-4 py-2 bg-theme-card border border-theme-border rounded-lg text-theme-text hover:bg-theme-border transition-colors"
                  >
                    {t('editGame.browse')}
                  </button>
                  <Tooltip text={t('editGame.steamGridDBTooltip')}>
                  <button
                    type="button"
                    onClick={() => setShowSteamGridDB('cover')}
                    className="px-4 py-2 bg-theme-card border border-theme-border rounded-lg text-primary-500 hover:bg-theme-border transition-colors"
                  >
                    {t('editGame.steamGridDB')}
                  </button>
                  </Tooltip>
                </div>
              </div>

              {coverImage && (
                <div className="flex justify-center">
                  <img 
                    src={`file://${coverImage}?t=${Date.now()}`} 
                    alt="Cover preview" 
                    className="h-32 rounded-lg object-cover"
                    key={coverImage}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-theme-textSecondary mb-2">
                  {t('editGame.bannerImage')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bannerImage}
                    onChange={(e) => setBannerImage(e.target.value)}
                    className="flex-1 px-4 py-2 bg-theme-bg border border-theme-border rounded-lg text-theme-text"
                  />
                  <button
                    type="button"
                    onClick={handleSelectBannerImage}
                    className="px-4 py-2 bg-theme-card border border-theme-border rounded-lg text-theme-text hover:bg-theme-border transition-colors"
                  >
                    {t('editGame.browse')}
                  </button>
                  <Tooltip text={t('editGame.steamGridDBBannerTooltip')}>
                  <button
                    type="button"
                    onClick={() => setShowSteamGridDB('hero')}
                    className="px-4 py-2 bg-theme-card border border-theme-border rounded-lg text-primary-500 hover:bg-theme-border transition-colors"
                  >
                    {t('editGame.steamGridDB')}
                  </button>
                  </Tooltip>
                </div>
              </div>

              {bannerImage && (
                <div>
                  <div
                    ref={previewRef}
                    className="w-full rounded-lg overflow-hidden relative select-none"
                    style={{
                      aspectRatio: `${gameBannerAspectRatio}`,
                      border: `2px solid ${isDragging ? '#0284c7' : (theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)')}`,
                      transition: 'border-color 0.15s',
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                  >
                    <img
                      src={`file://${bannerImage}?t=${Date.now()}`}
                      alt="Banner preview"
                      draggable={false}
                      key={bannerImage}
                      className="pointer-events-none"
                      style={previewStyle}
                      onLoad={(e) => {
                        const img = e.currentTarget
                        setPreviewNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
                      }}
                    />
                    <div className="absolute inset-0 pointer-events-none" style={{
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)'
                    }} />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-theme-textSecondary">
                        {t('editGame.dragToReposition')}
                      </span>
                      <span className="text-xs text-theme-textSecondary">|</span>
                      <span className="text-xs text-theme-textSecondary">
                        Scroll to zoom
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setBannerZoom(prev => Math.max(1, +(prev - 0.25).toFixed(2)))}
                        className="px-2 py-0.5 text-xs rounded border transition-colors"
                        style={{
                          borderColor: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                          color: 'var(--color-text-secondary, #888)'
                        }}
                      >−</button>
                      <span className="text-xs text-theme-textSecondary tabular-nums">
                        ×{bannerZoom.toFixed(1)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBannerZoom(prev => Math.min(5, +(prev + 0.25).toFixed(2)))}
                        className="px-2 py-0.5 text-xs rounded border transition-colors"
                        style={{
                          borderColor: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                          color: 'var(--color-text-secondary, #888)'
                        }}
                      >+</button>
                      <span className="text-xs text-theme-textSecondary">|</span>
                      <span className="text-xs text-theme-textSecondary tabular-nums">
                        X: {Math.round(bannerFocalX)}% &middot; Y: {Math.round(bannerFocalY)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {isStoreGame && (
                <p className="text-xs text-theme-textSecondary italic">
                  {t('editGame.onlyCoverEditable', { store: game.store })}
                </p>
              )}
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-theme-card border border-theme-border rounded-lg text-theme-text hover:bg-theme-border transition-colors"
            >
              {t('addGame.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-lg transition-colors"
            >
              {t('addGame.save')}
            </button>
          </div>
        </form>
      </div>

      {showSteamGridDB === 'cover' && (
        <SteamGridDBModal
          gameName={name}
          gameId={game.id}
          steamAppId={game.store === 'steam' ? game.appid : undefined}
          theme={theme}
          imageType="cover"
          onClose={() => setShowSteamGridDB(false)}
          onCoverSelected={handleCoverSelected}
        />
      )}

      {showSteamGridDB === 'hero' && (
        <SteamGridDBModal
          gameName={name}
          gameId={game.id}
          steamAppId={game.store === 'steam' ? game.appid : undefined}
          theme={theme}
          imageType="hero"
          onClose={() => setShowSteamGridDB(false)}
          onCoverSelected={handleBannerSelected}
        />
      )}
    </div>
  )
}
