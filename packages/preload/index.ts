import fs from "fs";
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
const currentWindow = remote.getCurrentWindow();

// contextBridge.exposeInMainWorld("fs", fs);
contextBridge.exposeInMainWorld("removeLoading", removeLoading);
contextBridge.exposeInMainWorld("ipcRenderer", withPrototype(ipcRenderer));
contextBridge.exposeInMainWorld("app", {
  remote: {
    app: {
      getVersion: remote.app.getVersion,
    },
    screen: {
      ...withPrototype(remote.screen),
    },
  },
  preload:
    "file://" + path.resolve(__dirname, "../renderer/preload/inject.cjs"),
  currentWindow: {
    setBounds: currentWindow.setBounds,
    getPosition: currentWindow.getPosition,
    getSize: currentWindow.getSize,
    hide: currentWindow.hide,
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
