export {};

declare global {
  interface Window {
    // Expose some Api through preload script
    ipcRenderer: import("electron").IpcRenderer;
    remote: import("@electron/remote");
    app: {
      remote: {
        app: {
          getVersion(): string;
        };
        screen: Electron.Screen;
      };
      preload: string;
      currentWindow: Electron.BrowserWindow;
    };
    removeLoading: () => void;
  }
}
