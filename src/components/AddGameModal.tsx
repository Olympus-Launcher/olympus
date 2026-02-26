import { useState } from 'react'
import { GameInfo } from '../types'

interface AddGameModalProps {
  onClose: () => void
  onAdd: (game: Omit<GameInfo, 'id'>) => void
}

export default function AddGameModal({ onClose, onAdd }: AddGameModalProps) {
  const [name, setName] = useState('')
  const [executablePath, setExecutablePath] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [store, setStore] = useState<'steam' | 'epic' | 'ea' | 'custom'>('custom')
  const [isLoading, setIsLoading] = useState(false)

  const handleSelectExecutable = async () => {
    const path = await window.electronAPI.selectExecutable()
    if (path) {
      setExecutablePath(path)
      if (!name) {
        const fileName = path.split('\\').pop()?.replace('.exe', '') || ''
        setName(fileName)
      }
    }
  }

  const handleSelectImage = async () => {
    const path = await window.electronAPI.selectImage()
    if (path) {
      setCoverImage(path)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !executablePath) return

    setIsLoading(true)
    try {
      onAdd({
        name,
        executablePath,
        coverImage: coverImage || undefined,
        store
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 modal-overlay flex items-center justify-center z-50">
      <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-md mx-4 overflow-hidden fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-dark-text">Add Game</h2>
          <button
            onClick={onClose}
            className="p-1 text-dark-textSecondary hover:text-dark-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-textSecondary mb-2">
              Game Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter game name"
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-textSecondary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-textSecondary mb-2">
              Executable Path *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={executablePath}
                onChange={(e) => setExecutablePath(e.target.value)}
                placeholder="C:\Games\game.exe"
                className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-textSecondary"
                required
              />
              <button
                type="button"
                onClick={handleSelectExecutable}
                className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text hover:bg-dark-border transition-colors"
              >
                Browse
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-textSecondary mb-2">
              Cover Image (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="C:\Images\cover.jpg"
                className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-textSecondary"
              />
              <button
                type="button"
                onClick={handleSelectImage}
                className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text hover:bg-dark-border transition-colors"
              >
                Browse
              </button>
            </div>
          </div>

          {coverImage && (
            <div className="flex justify-center">
              <img 
                src={`file://${coverImage}`} 
                alt="Cover preview" 
                className="h-32 rounded-lg object-cover"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-textSecondary mb-2">
              Store / Source
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['steam', 'epic', 'ea', 'custom'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStore(s)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    store === s
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-card text-dark-textSecondary hover:bg-dark-border'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text hover:bg-dark-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name || !executablePath}
              className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-lg transition-colors"
            >
              {isLoading ? 'Adding...' : 'Add Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
