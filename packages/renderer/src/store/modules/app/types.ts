export interface AppStateTypes {
  webview: Electron.WebviewTag;
  lastTarget: string;
  windowPosition: number[] | null;
  windowSizeMini: number[];
  windowSizeFeed: number[];
  windowSizeDefault: number[];
  windowSizeLogin: number[];
  showGotoTarget: boolean;
  showAbout: boolean;
  disablePartButton: boolean;
  disableDanmakuButton: boolean;
  autoHideBar: boolean;
  windowID: { mainWindow?: number; selectPartWindow?: number };
}
