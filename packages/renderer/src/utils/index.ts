import { useAppStore } from "@/store";
import { ref } from "vue";
import { windowType } from "./types";
import { userAgent, videoUrlPrefix } from "@/utils/constant";

const ipc = window.ipcRenderer;

export const currentWindowType = ref<windowType>("windowSizeDefault");

export const resizeMainWindow = () => {
  const appStore = useAppStore();
  const targetWindowType = ref<windowType>();
  const url = appStore.webview.getURL();
  if (
    url.indexOf("/video/") > -1 ||
    url.indexOf("html5player.html") > -1 ||
    /\/\/live\.bilibili\.com\/blanc\/\d+/.test(url) ||
    url.indexOf("bangumi/play/") > -1
  ) {
    targetWindowType.value = "windowSizeMini";
  } else if (url.indexOf("passport.bilibili.com/login") > -1) {
    targetWindowType.value = "windowSizeLogin";
  } else if (url.indexOf("t.bilibili.com/") > -1) {
    targetWindowType.value = "windowSizeFeed";
  } else {
    targetWindowType.value = "windowSizeDefault";
  }
  if (targetWindowType.value === currentWindowType.value) {
    return;
  }
  console.log(url.indexOf("passport.bilibili.com/login"));
  console.log(targetWindowType.value);
  const currentSize = window.app.currentWindow.getSize(),
    leftTopPosition = window.app.currentWindow.getPosition(),
    rightBottomPosition = [
      leftTopPosition[0] + currentSize[0],
      leftTopPosition[1] + currentSize[1],
    ],
    targetSize = appStore[targetWindowType.value],
    targetPosition = [
      rightBottomPosition[0] - targetSize[0],
      rightBottomPosition[1] - targetSize[1],
    ];

  // 原先只考虑了一块屏幕的情况，其实有副屏时x轴是有可能为负数的
  // 所以我们取一个简单的方法，只有一块屏幕时鼠标最小坐标是0，窗口不可能被拖到x<-width的位置上。所以如果这个窗口的x小于-width，那一定是被拖到副屏上了
  // 只有在他的x处于[-width, 10]之间时，此时窗口应该横跨在左右两块屏幕的交界上，这时我们强行把窗口挪到主屏的x=10位置
  if (targetPosition[0] > -targetSize[0] && targetPosition[0] < 10) {
    targetPosition[0] = 10;
  }
  targetPosition[1] = targetPosition[1] > 10 ? targetPosition[1] : 10;

  window.app.currentWindow.setBounds(
    {
      x: targetPosition[0],
      y: targetPosition[1],
      width: targetSize[0],
      height: targetSize[1],
    },
    true
  );

  currentWindowType.value = targetWindowType.value;

  // 通知设置窗口改变位置
  // ipc.send("main-window-resized", targetPosition, targetSize);
};

export const getVidWithP = (url: string) => {
  const m = /video\/((av|BV)\d+(?:\/?\?p=\d+)?)/.exec(url);
  return m ? m[1] : null;
};

export const getVid = (url: string) => {
  const m = /video\/(av\d+)/.exec(url) || /video\/(BV\w+)/.exec(url);
  return m ? m[1] : null;
};

// ajax
export const ajax = {
  get: function (url: string, success: any, mode?: "desktop" | "mobile") {
    var r = new XMLHttpRequest();
    r.open("GET", url, true);
    if (mode && mode in userAgent) {
      r.setRequestHeader("userAgent", userAgent[mode || "desktop"]);
    }
    r.onreadystatechange = function () {
      if (r.readyState != 4 || r.status != 200) return;
      success(r.responseText);
    };
    r.send();
  },
};

export const getPartOfBangumi = (url: string) => {
  ajax.get(url, (res = "") => {
    const appStore = useAppStore();
    // 分 P 信息存储在 window.__INITIAL_STATE__= 中 根据 object 类型的特性最后一个 } 后面不会有 , ] } 使用正则匹配
    const match = res.match(
      /window\.__INITIAL_STATE__\s*=\s*(\{.*?\})[^,\]\}]/m
    );
    if (!match || match?.length < 2) {
      console.log("获取番剧分p数据失败", res);
      return false;
    }
    const json = JSON.parse(match[1]);
    let parts;
    let currentPartId = 0;
    try {
      parts = json.epList;
      currentPartId = json.epInfo.i;
    } catch (err) {
      console.log(`解析番剧分p失败：${err}`, json);
      return false;
    }
    console.log(`获取番剧 ${url} 的分P数据成功`);
    if (parts.length) {
      if (!appStore.windowID.selectPartWindow) return;
      ipc.sendTo(appStore.windowID.selectPartWindow, "update-bangumi-part", {
        currentPartId,
        parts: parts.map((p: any) => {
          return {
            epid: p.i,
            aid: p.aid,
            bvid: p.bvid,
            title: p.longTitle,
          };
        }),
      });
      if (parts.length > 1) {
        // ipc.send("show-select-part-window");
        appStore.disablePartButton = false;
      }
    } else {
      if (!appStore.windowID.selectPartWindow) return;
      ipc.sendTo(appStore.windowID.selectPartWindow, "update-part", null);
      appStore.disablePartButton = true;
    }
  });
};

export const getPartOfVideo = (vid: string) => {
  ajax.get(videoUrlPrefix + vid, (res = "") => {
    const appStore = useAppStore();
    // 分 P 信息存储在 window.__INITIAL_STATE__= 中 根据 object 类型的特性最后一个 } 后面不会有 , ] } 使用正则匹配
    const match = res.match(
      /window\.__INITIAL_STATE__\s*=\s*(\{.*?\})[^,\]\}]/m
    );
    if (!match || match?.length < 2) {
      console.log("获取番剧分p数据失败", res);
      return false;
    }
    const json = JSON.parse(match[1]);
    let parts;
    try {
      parts = json.videoData.pages;
    } catch (err) {
      console.log(`解析视频分p失败：${err}`, json);
      return false;
    }
    console.log(`获取视频 ${vid} 的分P数据成功`);
    if (parts.length) {
      if (!appStore.windowID.selectPartWindow) return;
      ipc.sendTo(
        appStore.windowID.selectPartWindow,
        "update-part",
        parts.map((p: { part: [] }) => p.part)
      );
      // 有超过1p时自动开启分p窗口
      if (parts.length > 1) {
        if (!appStore.windowID.selectPartWindow) return;
        ipc.sendTo(
          appStore.windowID.selectPartWindow,
          "show-select-part-window"
        );
        appStore.disablePartButton = false;
      }
    } else {
      if (!appStore.windowID.selectPartWindow) return;
      ipc.sendTo(appStore.windowID.selectPartWindow, "update-part", null);
      appStore.disablePartButton = true;
    }
  });
};
