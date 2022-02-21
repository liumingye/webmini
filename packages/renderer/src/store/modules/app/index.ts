import { AppStateTypes } from "./types";
import { defineStore } from "pinia";
import { getVidWithP, getVid } from "@/utils";
import { userAgent, videoUrlPrefix, liveUrlPrefix } from "@/utils/constant";
import { useHistoryStore } from "@/store";

const ipc = window.ipcRenderer;

export const useAppStore = defineStore("app", {
  state: (): AppStateTypes => ({
    webview: null as unknown as Electron.WebviewTag,
    windowPosition: null,
    windowSize: {
      mini: [300, 170],
      feed: [650, 760],
      default: [376, 500],
      login: [490, 394],
    },
    showGotoTarget: false,
    showAbout: false,
    disablePartButton: true,
    disableDanmakuButton: true,
    autoHideBar: false,
    windowID: {},
  }),
  actions: {
    loadSelfFromLocalStorage() {
      const storage = localStorage.getItem("app");
      if (!storage) return;
      try {
        const map = new Map(JSON.parse(storage));
        map.forEach((value, key) => {
          // @ts-ignore
          this.$state[key] = value;
        });
      } catch (e) {
        localStorage.removeItem("app");
      }
    },
    saveSelfToLocalStorage() {
      const map = new Map();
      const whiteList = ["windowPosition", "windowSize"];
      whiteList.forEach((value) => {
        // @ts-ignore
        map.set(value, this[value]);
      });
      localStorage.setItem("app", JSON.stringify(Array.from(map.entries())));
    },
    updateURL() {
      const historyStore = useHistoryStore();
      // 防止重复加载同页面
      const url = this.webview.getURL();
      console.log("updateURL", url);

      historyStore.push(url);

      // 通知webview加载脚本
      this.webview.send("load-commit");

      const vid = getVidWithP(url);
      if (vid) {
        historyStore.replace(videoUrlPrefix + vid);
        this.webview.loadURL(videoUrlPrefix + vid, {
          userAgent: userAgent.desktop,
        });

        this.disableDanmakuButton = false;
        this.autoHideBar = true;
        if (this.windowID.selectPartWindow) {
          ipc.sendTo(this.windowID.selectPartWindow, "url-changed", url);
        }
        return;
      }

      if (url.indexOf("/bangumi/play/") > -1) {
        this.webview.loadURL(url, {
          userAgent: userAgent.desktop,
        });
        this.disableDanmakuButton = false;
        this.autoHideBar = true;
        return;
      }

      const live = /live\.bilibili\.com\/(h5\/||blanc\/)?(\d+).*/.exec(url);
      if (live) {
        this.webview.loadURL(liveUrlPrefix + live[2], {
          userAgent: userAgent.desktop,
        });
        this.disableDanmakuButton = false;
        this.disablePartButton = true;
        this.autoHideBar = true;
        return;
      }

      if (url.indexOf("//passport.bilibili.com/login") > -1) {
        this.webview.loadURL(url, {
          userAgent: userAgent.desktop,
        });
        this.disableDanmakuButton = true;
        this.disablePartButton = true;
        this.autoHideBar = false;
        return;
      }

      if (url.indexOf("//t.bilibili.com") > -1) {
        this.webview.setUserAgent(userAgent.desktop);
      } else {
        this.webview.setUserAgent(userAgent.mobile);
      }

      // 清除分p
      if (this.windowID.selectPartWindow) {
        ipc.sendTo(this.windowID.selectPartWindow, "update-part", null);
      }
      this.disableDanmakuButton = true;
      this.disablePartButton = true;
      this.autoHideBar = false;
    },
    go(url: string) {
      console.log("go", url);
      this.webview.loadURL(url, {
        userAgent: userAgent.mobile,
      });
    },
    goPart(pid: number) {
      console.log("goPart", pid);
      const vid = getVid(this.webview.getURL());
      if (vid) {
        let url = `${videoUrlPrefix}${vid}/?p=${pid}`;
        this.webview.loadURL(url, {
          userAgent: userAgent.desktop,
        });
        this.go(url);
        console.log(`路由：选择分p，选中第${pid}，转跳地址：${url}`);
      }
    },
    goBangumiPart(ep: { bvid: number }) {
      console.log("goBangumiPart", ep);
      this.go(videoUrlPrefix + ep.bvid);
    },
  },
});
