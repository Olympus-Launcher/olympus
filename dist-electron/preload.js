"use strict";
const electron = require("electron");
const electronAPI = {
  getGames: () => electron.ipcRenderer.invoke("get-games"),
  saveGames: (games) => electron.ipcRenderer.invoke("save-games", games),
  scanGames: () => electron.ipcRenderer.invoke("scan-games"),
  addGame: (game) => electron.ipcRenderer.invoke("add-game", game),
  removeGame: (gameId) => electron.ipcRenderer.invoke("remove-game", gameId),
  launchGame: (game) => electron.ipcRenderer.invoke("launch-game", game),
  selectExecutable: () => electron.ipcRenderer.invoke("select-executable"),
  selectImage: () => electron.ipcRenderer.invoke("select-image"),
  getSettings: () => electron.ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => electron.ipcRenderer.invoke("save-settings", settings)
};
electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
