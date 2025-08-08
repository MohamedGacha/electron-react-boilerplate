// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    getSetupFiles: (): Promise<string[]> => ipcRenderer.invoke('getSetupFiles'),
    copySetupFile: (relativePath: string) =>
      ipcRenderer.invoke('copy-setup-file', relativePath),
    deleteSetupFile: (relativePath: string) =>
      ipcRenderer.invoke('delete-setup-file', relativePath),
    readSetupFile: (relativePath: string) =>
      ipcRenderer.invoke('read-setup-file', relativePath),
    updateSetupFile: (relativePath: string, newContent: string) =>
      ipcRenderer.invoke('update-setup-file', relativePath, newContent),
    createSetupFile: (relativePath: string, content: string) =>
      ipcRenderer.invoke('create-setup-file', relativePath, content),
    revealSetupFile: (relativePath: string) =>
      ipcRenderer.invoke('reveal-setup-file', relativePath),
  },
});

export type ElectronHandler = typeof electronHandler;
