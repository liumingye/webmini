export interface AppStateTypes {
  webview: Electron.WebviewTag;
  lastTarget: string;
  windowSizeMini: [number, number];
  windowSizeFeed: [number, number];
  windowSizeDefault: [number, number];
  windowSizeLogin: [number, number];
  showGotoTarget: boolean;
  showAbout: boolean;
  disablePartButton: boolean;
  disableDanmakuButton: boolean;
  autoHideBar: boolean;
  windowID: { mainWindow?: number; selectPartWindow?: number };
}
