import { exec } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import log from 'electron-log'
import { v4 as uuidv4 } from 'uuid'

export interface GameInfo {
  id: string
  name: string
  executablePath: string
  coverImage?: string
  store: 'steam' | 'epic' | 'ea' | 'custom'
  installLocation?: string
  lastPlayed?: string
  playCount?: number
  isFavorite?: boolean
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function readFileContent(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch {
    return ''
  }
}

function parseSteamLibrary(libraryFoldersPath: string): Promise<string[]> {
  return new Promise((resolve) => {
    const libraryPaths: string[] = []
    
    const defaultSteamPath = path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Steam')
    libraryPaths.push(defaultSteamPath)
    libraryPaths.push(path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Steam'))

    exec(`"${path.join(libraryFoldersPath, 'bin', 'steamservice.dll')}"`, { windowsHide: true }, async (error) => {
      try {
        const content = await readFileContent(libraryFoldersPath)
        const pathMatches = content.match(/"path"\s+"([^"]+)"/g)
        
        if (pathMatches) {
          for (const match of pathMatches) {
            const matchPath = match.match(/"path"\s+"([^"]+)"/)
            if (matchPath && matchPath[1]) {
              const cleanPath = matchPath[1].replace(/\\\\/g, '\\')
              if (!libraryPaths.includes(cleanPath)) {
                libraryPaths.push(cleanPath)
              }
            }
          }
        }
      } catch (e) {
        log.warn('Could not parse steam libraryfolders:', e)
      }
      resolve(libraryPaths)
    })
  })
}

async function findSteamGamesInLibrary(libraryPath: string): Promise<GameInfo[]> {
  const games: GameInfo[] = []
  const steamAppsPath = path.join(libraryPath, 'steamapps')
  
  try {
    const manifestFiles = await fs.readdir(steamAppsPath)
    
    for (const file of manifestFiles) {
      if (file.startsWith('appmanifest_') && file.endsWith('.acf')) {
        const manifestPath = path.join(steamAppsPath, file)
        const content = await readFileContent(manifestPath)
        
        const nameMatch = content.match(/"name"\s+"([^"]+)"/)
        const installDirMatch = content.match(/"installdir"\s+"([^"]+)"/)
        
        if (nameMatch && installDirMatch) {
          const gameName = nameMatch[1]
          const installDir = installDirMatch[1]
          const exePath = path.join(steamAppsPath, 'common', installDir, `${gameName}.exe`)
          
          if (await fileExists(exePath)) {
            games.push({
              id: `steam-${gameName.toLowerCase().replace(/\s+/g, '-')}`,
              name: gameName,
              executablePath: exePath,
              store: 'steam',
              installLocation: path.join(steamAppsPath, 'common', installDir)
            })
          }
        }
      }
    }
  } catch (e) {
    log.warn(`Could not read steam library at ${libraryPath}:`, e)
  }
  
  return games
}

export async function detectSteamGames(): Promise<GameInfo[]> {
  log.info('Detecting Steam games...')
  const games: GameInfo[] = []
  
  try {
    const libraryPaths = [
      path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Steam', 'steamapps'),
      path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Steam', 'steamapps')
    ]

    const commonLibraryPaths = [
      'D:\\SteamLibrary',
      'E:\\SteamLibrary',
      'F:\\SteamLibrary'
    ]

    const allPaths = [...libraryPaths, ...commonLibraryPaths]

    for (const libPath of allPaths) {
      const libraryFoldersPath = path.join(libPath, '..', 'steamapps', 'libraryfolders.vdf')
      let libFoldersContent = ''
      
      try {
        libFoldersContent = await readFileContent(libraryFoldersPath)
        const pathMatches = libFoldersContent.match(/"path"\s+"([^"]+)"/g)
        
        if (pathMatches) {
          for (const match of pathMatches) {
            const matchPath = match.match(/"path"\s+"([^"]+)"/)
            if (matchPath && matchPath[1]) {
              const cleanPath = matchPath[1].replace(/\\\\/g, '\\')
              const steamAppsPath = path.join(cleanPath, 'steamapps')
              
              if (await fileExists(steamAppsPath)) {
                const libraryGames = await findSteamGamesInLibrary(cleanPath)
                games.push(...libraryGames)
              }
            }
          }
        }
      } catch (e) {
        log.debug('Could not parse libraryfolders.vdf at', libPath)
      }

      if (await fileExists(libPath)) {
        const directGames = await findSteamGamesInLibrary(path.dirname(libPath))
        games.push(...directGames)
      }
    }

    log.info(`Found ${games.length} Steam games`)
  } catch (error) {
    log.error('Error detecting Steam games:', error)
  }
  
  return games
}

export async function detectEpicGames(): Promise<GameInfo[]> {
  log.info('Detecting Epic games...')
  const games: GameInfo[] = []
  
  const epicManifestPaths = [
    path.join(process.env['ProgramData'] || 'C:\\ProgramData', 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests')
  ]

  try {
    for (const manifestDir of epicManifestPaths) {
      try {
        const files = await fs.readdir(manifestDir)
        
        for (const file of files) {
          if (file.endsWith('.item')) {
            const manifestPath = path.join(manifestDir, file)
            const content = await readFileContent(manifestPath)
            
            try {
              const manifest = JSON.parse(content)
              const displayName = manifest.DisplayName || manifest.InstallLocation?.split('\\').pop()
              const installLocation = manifest.InstallLocation
              const launchExecutable = manifest.LaunchExecutable
              
              if (displayName && installLocation && launchExecutable) {
                const exePath = path.join(installLocation, launchExecutable)
                
                if (await fileExists(exePath)) {
                  games.push({
                    id: `epic-${displayName.toLowerCase().replace(/\s+/g, '-')}`,
                    name: displayName,
                    executablePath: exePath,
                    store: 'epic',
                    installLocation: installLocation
                  })
                }
              }
            } catch (e) {
              log.debug('Could not parse epic manifest:', file)
            }
          }
        }
      } catch (e) {
        log.debug('Could not read Epic manifest directory:', manifestDir)
      }
    }

    log.info(`Found ${games.length} Epic games`)
  } catch (error) {
    log.error('Error detecting Epic games:', error)
  }
  
  return games
}

export async function detectEAGames(): Promise<GameInfo[]> {
  log.info('Detecting EA games...')
  const games: GameInfo[] = []
  
  const eaPaths = [
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Electronic Arts'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Electronic Arts')
  ]

  const eaRegistryKeys = [
    'HKLM\\SOFTWARE\\Electronic Arts\\EA Desktop\\Applications'
  ]

  try {
    for (const eaPath of eaPaths) {
      try {
        const entries = await fs.readdir(eaPath)
        
        for (const entry of entries) {
          const gamePath = path.join(eaPath, entry)
          
          try {
            const stat = await fs.stat(gamePath)
            
            if (stat.isDirectory()) {
              const contents = await fs.readdir(gamePath)
              
              for (const file of contents) {
                if (file.endsWith('.exe') && !file.toLowerCase().includes('setup') && !file.toLowerCase().includes('uninstall')) {
                  games.push({
                    id: `ea-${entry.toLowerCase().replace(/\s+/g, '-')}`,
                    name: entry,
                    executablePath: path.join(gamePath, file),
                    store: 'ea',
                    installLocation: gamePath
                  })
                  break
                }
              }
            }
          } catch (e) {
            log.debug('Could not read EA game directory:', entry)
          }
        }
      } catch (e) {
        log.debug('Could not read EA directory:', eaPath)
      }
    }

    const eaAppDataPath = path.join(process.env['APPDATA'] || '', 'Electronic Arts', 'EA Desktop', 'configs', 'urdf-metadata-cache.json')
    
    try {
      const content = await readFileContent(eaAppDataPath)
      const data = JSON.parse(content)
      
      if (data && typeof data === 'object') {
        for (const [gameId, gameData] of Object.entries(data)) {
          if (gameData && typeof gameData === 'object') {
            const gd = gameData as Record<string, unknown>
            const installPath = gd.installPath as string
            const displayName = gd.displayName as string
            
            if (installPath && displayName) {
              try {
                const files = await fs.readdir(installPath)
                
                for (const file of files) {
                  if (file.endsWith('.exe') && !file.toLowerCase().includes('setup') && !file.toLowerCase().includes('uninstall')) {
                    const exists = games.some(g => g.id === `ea-${displayName.toLowerCase().replace(/\s+/g, '-')}`)
                    
                    if (!exists) {
                      games.push({
                        id: `ea-${displayName.toLowerCase().replace(/\s+/g, '-')}`,
                        name: displayName,
                        executablePath: path.join(installPath, file),
                        store: 'ea',
                        installLocation: installPath
                      })
                    }
                    break
                  }
                }
              } catch (e) {
                log.debug('Could not read EA app game directory')
              }
            }
          }
        }
      }
    } catch (e) {
      log.debug('Could not read EA Desktop cache')
    }

    log.info(`Found ${games.length} EA games`)
  } catch (error) {
    log.error('Error detecting EA games:', error)
  }
  
  return games
}
