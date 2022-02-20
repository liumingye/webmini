import { contextBridge, ipcRenderer } from "electron";
import remote from "@electron/remote";
import { domReady } from "./utils";
import { useLoading } from "./loading";
import path from "path";

const { appendLoading, removeLoading } = useLoading();

(async () => {
  await domReady();
  appendLoading();
})();

// --------- Expose some API to the Renderer process. ---------
contextBridge.exposeInMainWorld("removeLoading", removeLoading);
contextBridge.exposeInMainWorld("ipcRenderer", withPrototype(ipcRenderer));

export interface FetchOptions {
  method: string;
  body: string | null;
  headers: { [key: string]: string } | null;
}
const DEFAULT_FETCH_CONFIG: FetchOptions = {
  method: "GET",
  body: null,
  headers: null,
};
const currentWindow = remote.getCurrentWindow();
contextBridge.exposeInMainWorld("app", {
  versions: {
    App: remote.app.getVersion(),
    "Vue.js": require("vue").version,
    Electron: process.versions.electron,
    Node: process.versions.node,
    Chrome: process.versions.chrome,
    Platform: require("os").platform(),
  },
  screen: {
    ...withPrototype(remote.screen),
  },
  preload: "file://" + path.resolve(__dirname, "../inject/index.cjs"),
  currentWindow: {
    setBounds: currentWindow.setBounds,
    getPosition: currentWindow.getPosition,
    getSize: currentWindow.getSize,
    hide: currentWindow.hide,
    on: currentWindow.on,
  },
  net: {
    fetch: <T extends any>(
      url: string,
      options: Partial<FetchOptions> = {}
    ): Promise<{
      ok: boolean;
      status: number;
      statusText: string;
      headers: Record<string, string | string[]>;
      text: () => Promise<string>;
      json: () => Promise<T>;
    }> => {
      const config = {
        ...DEFAULT_FETCH_CONFIG,
        ...options,
      };
      return new Promise(async (resolve, reject) => {
        const request = remote.net.request({
          url,
          method: config.method,
          useSessionCookies: true,
        });
        if (config.headers instanceof Object) {
          for (const [header, value] of Object.entries(config.headers)) {
            request.setHeader(header, value);
          }
        }
        request.on("login", () => {
          reject(new Error("Unauthorized"));
        });
        request.once("error", (error) => {
          request.removeAllListeners();
          reject(error);
        });
        request.on("response", (response) => {
          response.removeAllListeners();
          const chunks: Uint8Array[] = [];
          response.on("data", (chunk) => {
            chunks.push(chunk);
          });
          response.on("end", () => {
            response.removeAllListeners();
            const data = Buffer.concat(chunks).toString();
            resolve({
              ok: response.statusCode === 200,
              headers: response.headers,
              status: response.statusCode,
              statusText: response.statusMessage,
              text: async () => data,
              json: async () => JSON.parse(data),
            });
          });
          response.on("error", (error: any) => {
            response.removeAllListeners();
            reject(error);
          });
        });
        if (config.body !== undefined && config.body !== null) {
          request.write(config.body.toString());
        }
        request.end();
      });
    },
  },
});

// `exposeInMainWorld` can't detect attributes and methods of `prototype`, manually patching it.
function withPrototype(obj: Record<string, any>) {
  const protos = Object.getPrototypeOf(obj);
  for (const [key, value] of Object.entries(protos)) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) continue;
    if (typeof value === "function") {
      // Some native APIs, like `NodeJS.EventEmitter['on']`, don't work in the Renderer process. Wrapping them into a function.
      obj[key] = function (...args: any) {
        return value.call(obj, ...args);
      };
    } else {
      obj[key] = value;
    }
  }
  return obj;
}
