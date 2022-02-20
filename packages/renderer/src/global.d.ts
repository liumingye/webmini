export {};

interface FetchOptions {
  method: string;
  body: string | null;
  headers: { [key: string]: string } | null;
}

declare global {
  interface Window {
    // Expose some Api through preload script
    ipcRenderer: import("electron").IpcRenderer;
    // remote: import("@electron/remote");
    app: {
      remote: {
        app: {
          getVersion(): string;
        };
        screen: Electron.Screen;
      };
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
    removeLoading: () => void;
  }
}
