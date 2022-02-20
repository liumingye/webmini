import { FetchOptions } from "../../preload";

declare global {
  interface Window {
    // Expose some Api through preload script
    ipcRenderer: Electron.IpcRenderer;
    removeLoading: () => void;
    app: {
      versions: {
        App: string;
        Chrome: string;
        Electron: string;
        Node: string;
        Platform: string;
        "Vue.js": string;
      };
      screen: Electron.Screen;
      preload: string;
      cookie: string;
      currentWindow: Electron.BrowserWindow;
      net: {
        fetch: <T extends any>(
          url: string,
          options: Partial<FetchOptions> = {}
        ) => Promise<{
          ok: boolean;
          status: number;
          statusText: string;
          headers: Record<string, string | string[]>;
          text: () => Promise<string>;
          json: () => Promise<T>;
        }>;
      };
    };
  }
}
