import { AppStateTypes } from "./types";
import { defineStore } from "pinia";
import { getVidWithP, getVid } from "@/utils";
import { liveUrlPrefix, userAgent, videoUrlPrefix } from "@/utils/constant";

const ipc = window.ipcRenderer;

export const useAppStore = defineStore("app", {
  state: (): AppStateTypes => ({
    webview: null as unknown as Electron.WebviewTag,
    lastLoadedUrl: "",
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
      console.log(map);
      localStorage.setItem("app", JSON.stringify(Array.from(map.entries())));
    },
    go(url: string) {
      console.log("go", url);
      // 防止重复加载同页面
      if (url === this.lastTarget) {
        // utils.log(`代码尝试重复加载页面：${target}`);
        return false;
      }
      this.lastTarget = url;
      // 显示loading mask
      this.showLoding = true;
      const vid = getVidWithP(url);
      let live;

      if (vid) {
        this.webview.loadURL(url, {
          userAgent: userAgent.desktop,
        });
        this.disableDanmakuButton = false;
        console.log(
          `路由：类型① 视频详情页\n原地址：${url}\n转跳地址：${
            videoUrlPrefix + vid
          }`
        );
      } else if (url.indexOf("passport.bilibili.com/login") > -1) {
        // case 登录页面
        this.webview.loadURL(url, {
          userAgent: userAgent.desktop,
        });
        // !noNewHistory && _history.add(target);
        this.disableDanmakuButton = false;
        // console.log(`路由：类型② 番剧播放页\n地址：${url}`);
      } else if (url.indexOf("bangumi/play/") > -1) {
        // case 2 番剧播放页
        this.webview.loadURL(url, {
          userAgent: userAgent.desktop,
        });
        // !noNewHistory && _history.add(target);
        this.disableDanmakuButton = false;
        console.log(`路由：类型② 番剧播放页\n地址：${url}`);
      } else if (
        (live = /live\.bilibili\.com\/(h5\/||blanc\/)?(\d+).*/.exec(url))
      ) {
        this.webview.loadURL(liveUrlPrefix + live[2], {
          userAgent: userAgent.desktop,
        });
        // !noNewHistory && _history.add(liveUrlPrefix + live[2]);
        this.disableDanmakuButton = false;
        console.log(
          `路由：类型③ 直播页面\n原地址：${url}\n转跳地址：${
            liveUrlPrefix + live[2]
          }`
        );
      } else {
        // 其他链接不做操作直接打开
        this.webview.loadURL(url, {
          userAgent: userAgent.mobile,
        });
        // !noNewHistory && _history.add(target);
        // 清除分p
        if (this.windowID.selectPartWindow) {
          ipc.sendTo(this.windowID.selectPartWindow, "update-part", null);
        }
        this.disablePartButton = true;
        this.disableDanmakuButton = true;
        console.log(`路由：类型④ 未归类\n原地址：${url}\n转跳地址：${url}`);
      }
      if (this.windowID.selectPartWindow) {
        ipc.sendTo(this.windowID.selectPartWindow, "url-changed", url);
      }
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
    canGoBack(state) {
      return state.webview.canGoBack();
    },
  },
});
