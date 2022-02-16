import { AppStateTypes } from "./types";
import { defineStore } from "pinia";
import { getVidWithP, getVid } from "@/utils";
import { liveUrlPrefix, userAgent, videoUrlPrefix } from "@/utils/constant";

const ipc = window.ipcRenderer;

export const useAppStore = defineStore("app", {
  state: (): AppStateTypes => ({
    webview: null as unknown as Electron.WebviewTag,
    lastTarget: "", // 这是最后一次传入go方法的url
    windowSizeMini: [300, 170],
    windowSizeFeed: [650, 760],
    windowSizeDefault: [376, 500],
    windowSizeLogin: [490, 394],
    showLoding: false,
    showGotoTarget: false,
    showAbout: false,
    disablePartButton: true,
    disableDanmakuButton: true,
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
      const whiteList = [
        "windowSizeMini",
        "windowSizeFeed",
        "windowSizeDefault",
      ];
      whiteList.forEach((value) => {
        // @ts-ignore
        map.set(value, this[value]);
      });
      localStorage.setItem("app", JSON.stringify(Array.from(map.entries())));
    },
    changeUrl(url: string) {
      // 防止重复加载同页面
      if (url === this.lastTarget) {
        // utils.log(`代码尝试重复加载页面：${target}`);
        return false;
      }
      this.lastTarget = url;
      console.log("changeUrl", url);

      // 显示loading mask
      this.showLoding = true;

      const vid = getVidWithP(url);
      if (vid) {
        this.webview.loadURL(url, {
          userAgent: userAgent.desktop,
        });
        this.disableDanmakuButton = false;
        if (this.windowID.selectPartWindow) {
          ipc.sendTo(this.windowID.selectPartWindow, "url-changed", url);
        }
        return;
      }

      if (url.indexOf("bangumi/play/") > -1) {
        this.webview.setUserAgent(userAgent.desktop);
        this.disableDanmakuButton = false;
        return;
      }

      const live = /live\.bilibili\.com\/(h5\/||blanc\/)?(\d+).*/.exec(url);
      if (live) {
        this.webview.setUserAgent(userAgent.desktop);
        this.disableDanmakuButton = false;
        return;
      }

      if (url.indexOf("passport.bilibili.com/login") > -1) {
        this.webview.setUserAgent(userAgent.desktop);
        this.disableDanmakuButton = true;
        return;
      }

      this.webview.loadURL(url, {
        userAgent: userAgent.mobile,
      });
      // 清除分p
      if (this.windowID.selectPartWindow) {
        ipc.sendTo(this.windowID.selectPartWindow, "update-part", null);
      }
      this.disablePartButton = true;
      this.disableDanmakuButton = true;
    },
    go(url: string) {
      console.log("go", url);
      this.webview.loadURL(url, {
        userAgent: userAgent.mobile,
      });
    },
    goPart(pid: number) {
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
      console.log(`路由：选择番剧分p`);
      this.go(videoUrlPrefix + ep.bvid);
    },
  },
  getters: {
    // canGoBack(state) {
    //   return state.webview.canGoBack();
    // },
  },
});
