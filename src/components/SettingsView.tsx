import { useState } from 'react'
import { Settings } from '../types'
import { project, labels } from '../config'

interface SettingsViewProps {
  settings: Settings
  onSave: (settings: Settings) => void
  onScanGames: () => void
  isScanning: boolean
}

export default function SettingsView({ settings, onSave, onScanGames, isScanning }: SettingsViewProps) {
  const [localSettings, setLocalSettings] = useState<Settings>(settings)

  const handleSave = async () => {
    await onSave(localSettings)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-dark-text mb-6">{labels.settings.title}</h1>

        <div className="space-y-6">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-dark-text mb-4">{labels.settings.library}</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-text font-medium">{labels.settings.scanOnStartup}</p>
                  <p className="text-sm text-dark-textSecondary">{labels.settings.scanOnStartupDescription}</p>
                </div>
                <button
                  onClick={() => {
                    setLocalSettings({ ...localSettings, scanOnStartup: !localSettings.scanOnStartup })
                    setTimeout(handleSave, 0)
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    localSettings.scanOnStartup ? 'bg-primary-600' : 'bg-dark-border'
                  }`}
                >
                  <span 
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      localSettings.scanOnStartup ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t border-dark-border">
                <p className="text-dark-text font-medium mb-2">{labels.settings.manualScan}</p>
                <p className="text-sm text-dark-textSecondary mb-4">
                  {labels.settings.manualScanDescription}
                </p>
                <button
                  onClick={onScanGames}
                  disabled={isScanning}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-lg transition-colors"
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

          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-dark-text mb-4">{labels.settings.appearance}</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-text font-medium">{labels.settings.darkMode}</p>
                  <p className="text-sm text-dark-textSecondary">{labels.settings.darkModeDescription}</p>
                </div>
                <button
                  onClick={() => {
                    setLocalSettings({ ...localSettings, theme: localSettings.theme === 'dark' ? 'light' : 'dark' })
                    setTimeout(handleSave, 0)
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    localSettings.theme === 'dark' ? 'bg-primary-600' : 'bg-dark-border'
                  }`}
                >
                  <span 
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      localSettings.theme === 'dark' ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-dark-text mb-4">{labels.settings.about}</h2>
            
            <div className="space-y-2 text-dark-textSecondary">
              <p><span className="text-dark-text">{project.name}</span> {labels.app.version}{project.version}</p>
              <p>{project.description}</p>
              <p className="text-sm">Supports {project.supportedStoreNames.steam}, {project.supportedStoreNames.epic}, {project.supportedStoreNames.ea}, and {project.supportedStoreNames.custom} games</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
