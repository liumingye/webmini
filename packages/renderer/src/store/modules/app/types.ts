export interface AppStateTypes {
  webview: Electron.WebviewTag;
  windowPosition: number[] | null;
  windowSize: {
    mini: number[];
    feed: number[];
    default: number[];
    login: number[];
  };
  showGotoTarget: boolean;
  showAbout: boolean;
  disablePartButton: boolean;
  disableDanmakuButton: boolean;
  autoHideBar: boolean;
  windowID: { mainWindow?: number; selectPartWindow?: number };
}
