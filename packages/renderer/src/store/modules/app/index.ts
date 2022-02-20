import { AppStateTypes } from "./types";
import { defineStore } from "pinia";
import { getVidWithP, getVid } from "@/utils";
import { userAgent, videoUrlPrefix } from "@/utils/constant";
import { useHistoryStore } from "@/store";

const ipc = window.ipcRenderer;

export const useAppStore = defineStore("app", {
  state: (): AppStateTypes => ({
    webview: null as unknown as Electron.WebviewTag,
    // canGoBack: false,
    // canGoForward: false,
    title: "",
    lastTarget: "", // 这是最后一次传入changeUrl方法的url
    windowPosition: null,
    windowSizeMini: [300, 170],
    windowSizeFeed: [650, 760],
    windowSizeDefault: [376, 500],
    windowSizeLogin: [490, 394],
    showGotoTarget: false,
    showAbout: false,
    disablePartButton: true,
    disableDanmakuButton: true,
    autoHideBar: false,
    windowID: {},
    lastNavigation: 0,
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
        "windowPosition",
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
    updateURL() {
      const historyStore = useHistoryStore();
      // 防止重复加载同页面
      const url = this.webview.getURL();
      if (url === this.lastTarget) {
        // console.log(`代码尝试重复加载页面：${url}`);
        return false;
      }
      this.lastTarget = url;
      if (this.lastNavigation > 0) {
        this.lastNavigation--;
      } else {
        if (!["m.bilibili.com/video/"].includes(url)) {
          historyStore.push(url);
        }
      }
      console.log("historyStore", historyStore.$state);
      // console.log("updateURL", url);
      // 通知webview加载脚本
      this.webview.send("load-commit");
      const vid = getVidWithP(url);
      if (vid) {
        this.lastNavigation = 1;
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
        this.lastNavigation = 1;
        this.webview.loadURL(url, {
          userAgent: userAgent.desktop,
        });
        this.disableDanmakuButton = false;
        this.autoHideBar = true;
        return;
      }

      if (/live\.bilibili\.com\/(h5\/||blanc\/)?(\d+).*/.test(url)) {
        this.lastNavigation = 1;
        this.webview.loadURL(url, {
          userAgent: userAgent.desktop,
        });
        this.disableDanmakuButton = false;
        this.disablePartButton = true;
        this.autoHideBar = true;
        return;
      }

      if (url.indexOf("passport.bilibili.com/login") > -1) {
        this.lastNavigation = 1;
        this.webview.loadURL(url, {
          userAgent: userAgent.desktop,
        });
        this.disableDanmakuButton = true;
        this.disablePartButton = true;
        this.autoHideBar = false;
        return;
      }

      // if (/m\.bilibili\.com\/search\?/.test(url)) {
      //   this.webview.loadURL(url, {
      //     userAgent: userAgent.mobile,
      //   });
      // }

      this.webview.setUserAgent(userAgent.mobile);
      // 清除分p
      if (this.windowID.selectPartWindow) {
        ipc.sendTo(this.windowID.selectPartWindow, "update-part", null);
      }
      this.disableDanmakuButton = true;
      this.disablePartButton = true;
      this.autoHideBar = false;
    },
    // updateNavigationState() {
    //   if (!this.webview) return;
    //   this.canGoBack = this.webview.canGoBack();
    //   this.canGoForward = this.webview.canGoForward();
    // },
    updateTitle(title: string) {
      this.title = title;
    },
    go(url: string) {
      console.log("go", url);
      const historyStore = useHistoryStore();
      historyStore.push(url);
      // console.log("historyStore", historyStore.$state);
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
