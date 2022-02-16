export interface AppStateTypes {
  webview: Electron.WebviewTag;
  lastLoadedUrl: string;
  lastTarget: string;
  windowSizeMini: [number, number];
  windowSizeFeed: [number, number];
  windowSizeDefault: [number, number];
  windowSizeLogin: [number, number];
  showLoding: boolean;
  showGotoTarget: boolean;
  showAbout: boolean;
  disablePartButton: boolean;
  disableDanmakuButton: boolean;
  windowID: { mainWindow?: number; selectPartWindow?: number };
}
