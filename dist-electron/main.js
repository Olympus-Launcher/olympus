"use strict";
const electron = require("electron");
const path = require("path");
const log = require("electron-log");
const Store = require("electron-store");
require("child_process");
const fs = require("fs");
async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}
async function readFileContent(filePath) {
  try {
    return await fs.promises.readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}
async function findSteamGamesInLibrary(libraryPath) {
  const games = [];
  const steamAppsPath = path.join(libraryPath, "steamapps");
  try {
    const manifestFiles = await fs.promises.readdir(steamAppsPath);
    for (const file of manifestFiles) {
      if (file.startsWith("appmanifest_") && file.endsWith(".acf")) {
        const manifestPath = path.join(steamAppsPath, file);
        const content = await readFileContent(manifestPath);
        const nameMatch = content.match(/"name"\s+"([^"]+)"/);
        const installDirMatch = content.match(/"installdir"\s+"([^"]+)"/);
        if (nameMatch && installDirMatch) {
          const gameName = nameMatch[1];
          const installDir = installDirMatch[1];
          const exePath = path.join(steamAppsPath, "common", installDir, `${gameName}.exe`);
          if (await fileExists(exePath)) {
            games.push({
              id: `steam-${gameName.toLowerCase().replace(/\s+/g, "-")}`,
              name: gameName,
              executablePath: exePath,
              store: "steam",
              installLocation: path.join(steamAppsPath, "common", installDir)
            });
          }
        }
      }
    }
  } catch (e) {
    log.warn(`Could not read steam library at ${libraryPath}:`, e);
  }
  return games;
}
async function detectSteamGames() {
  log.info("Detecting Steam games...");
  const games = [];
  try {
    const libraryPaths = [
      path.join(process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "Steam", "steamapps"),
      path.join(process.env["ProgramFiles"] || "C:\\Program Files", "Steam", "steamapps")
    ];
    const commonLibraryPaths = [
      "D:\\SteamLibrary",
      "E:\\SteamLibrary",
      "F:\\SteamLibrary"
    ];
    const allPaths = [...libraryPaths, ...commonLibraryPaths];
    for (const libPath of allPaths) {
      const libraryFoldersPath = path.join(libPath, "..", "steamapps", "libraryfolders.vdf");
      let libFoldersContent = "";
      try {
        libFoldersContent = await readFileContent(libraryFoldersPath);
        const pathMatches = libFoldersContent.match(/"path"\s+"([^"]+)"/g);
        if (pathMatches) {
          for (const match of pathMatches) {
            const matchPath = match.match(/"path"\s+"([^"]+)"/);
            if (matchPath && matchPath[1]) {
              const cleanPath = matchPath[1].replace(/\\\\/g, "\\");
              const steamAppsPath = path.join(cleanPath, "steamapps");
              if (await fileExists(steamAppsPath)) {
                const libraryGames = await findSteamGamesInLibrary(cleanPath);
                games.push(...libraryGames);
              }
            }
          }
        }
      } catch (e) {
        log.debug("Could not parse libraryfolders.vdf at", libPath);
      }
      if (await fileExists(libPath)) {
        const directGames = await findSteamGamesInLibrary(path.dirname(libPath));
        games.push(...directGames);
      }
    }
    log.info(`Found ${games.length} Steam games`);
  } catch (error) {
    log.error("Error detecting Steam games:", error);
  }
  return games;
}
async function detectEpicGames() {
  var _a;
  log.info("Detecting Epic games...");
  const games = [];
  const epicManifestPaths = [
    path.join(process.env["ProgramData"] || "C:\\ProgramData", "Epic", "EpicGamesLauncher", "Data", "Manifests")
  ];
  try {
    for (const manifestDir of epicManifestPaths) {
      try {
        const files = await fs.promises.readdir(manifestDir);
        for (const file of files) {
          if (file.endsWith(".item")) {
            const manifestPath = path.join(manifestDir, file);
            const content = await readFileContent(manifestPath);
            try {
              const manifest = JSON.parse(content);
              const displayName = manifest.DisplayName || ((_a = manifest.InstallLocation) == null ? void 0 : _a.split("\\").pop());
              const installLocation = manifest.InstallLocation;
              const launchExecutable = manifest.LaunchExecutable;
              if (displayName && installLocation && launchExecutable) {
                const exePath = path.join(installLocation, launchExecutable);
                if (await fileExists(exePath)) {
                  games.push({
                    id: `epic-${displayName.toLowerCase().replace(/\s+/g, "-")}`,
                    name: displayName,
                    executablePath: exePath,
                    store: "epic",
                    installLocation
                  });
                }
              }
            } catch (e) {
              log.debug("Could not parse epic manifest:", file);
            }
          }
        }
      } catch (e) {
        log.debug("Could not read Epic manifest directory:", manifestDir);
      }
    }
    log.info(`Found ${games.length} Epic games`);
  } catch (error) {
    log.error("Error detecting Epic games:", error);
  }
  return games;
}
async function detectEAGames() {
  log.info("Detecting EA games...");
  const games = [];
  const eaPaths = [
    path.join(process.env["ProgramFiles"] || "C:\\Program Files", "Electronic Arts"),
    path.join(process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "Electronic Arts")
  ];
  try {
    for (const eaPath of eaPaths) {
      try {
        const entries = await fs.promises.readdir(eaPath);
        for (const entry of entries) {
          const gamePath = path.join(eaPath, entry);
          try {
            const stat = await fs.promises.stat(gamePath);
            if (stat.isDirectory()) {
              const contents = await fs.promises.readdir(gamePath);
              for (const file of contents) {
                if (file.endsWith(".exe") && !file.toLowerCase().includes("setup") && !file.toLowerCase().includes("uninstall")) {
                  games.push({
                    id: `ea-${entry.toLowerCase().replace(/\s+/g, "-")}`,
                    name: entry,
                    executablePath: path.join(gamePath, file),
                    store: "ea",
                    installLocation: gamePath
                  });
                  break;
                }
              }
            }
          } catch (e) {
            log.debug("Could not read EA game directory:", entry);
          }
        }
      } catch (e) {
        log.debug("Could not read EA directory:", eaPath);
      }
    }
    const eaAppDataPath = path.join(process.env["APPDATA"] || "", "Electronic Arts", "EA Desktop", "configs", "urdf-metadata-cache.json");
    try {
      const content = await readFileContent(eaAppDataPath);
      const data = JSON.parse(content);
      if (data && typeof data === "object") {
        for (const [gameId, gameData] of Object.entries(data)) {
          if (gameData && typeof gameData === "object") {
            const gd = gameData;
            const installPath = gd.installPath;
            const displayName = gd.displayName;
            if (installPath && displayName) {
              try {
                const files = await fs.promises.readdir(installPath);
                for (const file of files) {
                  if (file.endsWith(".exe") && !file.toLowerCase().includes("setup") && !file.toLowerCase().includes("uninstall")) {
                    const exists = games.some((g) => g.id === `ea-${displayName.toLowerCase().replace(/\s+/g, "-")}`);
                    if (!exists) {
                      games.push({
                        id: `ea-${displayName.toLowerCase().replace(/\s+/g, "-")}`,
                        name: displayName,
                        executablePath: path.join(installPath, file),
                        store: "ea",
                        installLocation: installPath
                      });
                    }
                    break;
                  }
                }
              } catch (e) {
                log.debug("Could not read EA app game directory");
              }
            }
          }
        }
      }
    } catch (e) {
      log.debug("Could not read EA Desktop cache");
    }
    log.info(`Found ${games.length} EA games`);
  } catch (error) {
    log.error("Error detecting EA games:", error);
  }
  return games;
}
log.transports.file.level = "info";
log.transports.console.level = "debug";
log.info("Application starting...");
const store = new Store({
  name: "game-launcher-data",
  defaults: {
    games: [],
    settings: {
      theme: "dark",
      scanOnStartup: true
    }
  }
});
let mainWindow = null;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
function createWindow() {
  log.info("Creating main window...");
  mainWindow = new electron.BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0f0f0f",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    frame: false,
    show: false
  });
  mainWindow.once("ready-to-show", () => {
    log.info("Window ready to show");
    mainWindow == null ? void 0 : mainWindow.show();
  });
  if (VITE_DEV_SERVER_URL) {
    log.info("Loading dev server URL:", VITE_DEV_SERVER_URL);
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    log.info("Loading production build");
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
electron.app.whenReady().then(() => {
  log.info("App ready");
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  log.info("All windows closed");
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.ipcMain.handle("get-games", async () => {
  log.info("IPC: get-games called");
  return store.get("games");
});
electron.ipcMain.handle("save-games", async (_, games) => {
  log.info("IPC: save-games called, count:", games.length);
  store.set("games", games);
  return true;
});
electron.ipcMain.handle("scan-games", async () => {
  log.info("IPC: scan-games called");
  try {
    const existingGames = store.get("games");
    const existingIds = new Set(existingGames.map((g) => g.id));
    const [steamGames, epicGames, eaGames] = await Promise.all([
      detectSteamGames(),
      detectEpicGames(),
      detectEAGames()
    ]);
    const allDetectedGames = [...steamGames, ...epicGames, ...eaGames];
    const newGames = allDetectedGames.filter((g) => !existingIds.has(g.id));
    const updatedGames = [...existingGames, ...newGames];
    store.set("games", updatedGames);
    log.info(`Scan complete. Found ${newGames.length} new games`);
    return { games: updatedGames, newCount: newGames.length };
  } catch (error) {
    log.error("Error scanning games:", error);
    throw error;
  }
});
electron.ipcMain.handle("add-game", async (_, game) => {
  log.info("IPC: add-game called", game.name);
  const games = store.get("games");
  const newGame = {
    ...game,
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  games.push(newGame);
  store.set("games", games);
  return newGame;
});
electron.ipcMain.handle("remove-game", async (_, gameId) => {
  log.info("IPC: remove-game called", gameId);
  const games = store.get("games");
  const filtered = games.filter((g) => g.id !== gameId);
  store.set("games", filtered);
  return true;
});
electron.ipcMain.handle("launch-game", async (_, game) => {
  log.info("IPC: launch-game called", game.name);
  try {
    await electron.shell.openPath(game.executablePath);
    const games = store.get("games");
    const updated = games.map((g) => {
      if (g.id === game.id) {
        return {
          ...g,
          lastPlayed: (/* @__PURE__ */ new Date()).toISOString(),
          playCount: (g.playCount || 0) + 1
        };
      }
      return g;
    });
    store.set("games", updated);
    log.info("Game launched successfully:", game.name);
    return true;
  } catch (error) {
    log.error("Error launching game:", error);
    throw error;
  }
});
electron.ipcMain.handle("select-executable", async () => {
  log.info("IPC: select-executable called");
  const result = await electron.dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Executables", extensions: ["exe", "lnk", "bat", "cmd"] },
      { name: "All Files", extensions: ["*"] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});
electron.ipcMain.handle("select-image", async () => {
  log.info("IPC: select-image called");
  const result = await electron.dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif"] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});
electron.ipcMain.handle("get-settings", async () => {
  return store.get("settings");
});
electron.ipcMain.handle("save-settings", async (_, settings) => {
  store.set("settings", settings);
  return true;
});
electron.ipcMain.handle("window-minimize", () => {
  mainWindow == null ? void 0 : mainWindow.minimize();
});
electron.ipcMain.handle("window-maximize", () => {
  if (mainWindow == null ? void 0 : mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow == null ? void 0 : mainWindow.maximize();
  }
});
electron.ipcMain.handle("window-close", () => {
  mainWindow == null ? void 0 : mainWindow.close();
});
electron.ipcMain.handle("window-is-maximized", () => {
  return (mainWindow == null ? void 0 : mainWindow.isMaximized()) ?? false;
});
log.info("Main process initialized");
