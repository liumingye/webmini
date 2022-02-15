// @ts-nocheck
import { is, addStyle } from "./utils";
const ipc = require("electron").ipcRenderer;

window.addEventListener("load", function () {
  // 普通视频页：自动最大化播放器
  if (is.video(window.location.pathname)) {
    // 预先加载全屏样式
    document.body.classList.add(
      "player-mode-webfullscreen",
      "player-fullscreen-fix"
    );
    const removeStyle = addStyle(
      ".bilibili-player-video-sendbar{display: none!important}"
    );
    // 隐藏全屏播放器（在某些情况下会出现）的滚动条
    document.body.style.overflow = "hidden";
    // 监控全屏按钮出现
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.addedNodes.length > 0 &&
          /(bilibili-player-video-web-fullscreen|squirtle-video-pagefullscreen)/.test(
            mutation.addedNodes[0].className
          )
        ) {
          mutation.addedNodes[0].click();
          removeStyle();
          // 从app层面把 上、下 按键传进来，方便播放器控制音量
          ipc.on("change-volume", (ev, arg) => {
            const event = new KeyboardEvent("keydown", {
              keyCode: arg === "up" ? 38 : 40,
              bubbles: true,
            });
            document.dispatchEvent(event);
          });
          // 用户按了老板键，停止播放视频
          ipc.on("hide-hide-hide", () => {
            const player = document.querySelector(".bilibili-player-video");
            const playButton = document.querySelector(
              ".bilibili-player-video-btn-start"
            );
            // 只有当视频处在播放状态时才click一下来停止播放，如果本来就停止了就别点了
            if (
              player &&
              !Array.from(playButton.classList).includes("video-state-pause")
            ) {
              player.click();
            }
          });
          observer.disconnect();
        }
      });
    });
    observer.observe(
      document.querySelector(
        ".bilibili-player-video-control-wrap,.bpx-player-control-wrap"
      ),
      {
        childList: true,
        subtree: true,
      }
    );
  }

  // 番剧页：获取播放器iframe地址并转跳
  // else if (/anime\/\d+\/play/.test(window.location.href)) {
  //   var playerInitCheck = setInterval(() => {
  //       let ifr;
  //       if ((ifr = document.querySelector("iframe"))) {
  //         if (ifr.src.indexOf("iframemessage.html") == -1) {
  //           window.location.href = ifr.src;
  //           clearInterval(playerInitCheck);
  //         }
  //       } else if (++checkCount > 400) {
  //         clearInterval(playerInitCheck);
  //       }
  //     }, 50),
  //     checkCount = 0;
  // }

  // 动态页重做样式
  else if (is.trends(window.location.href)) {
    addStyle(
      "#internationalHeader{display:none;}" +
        ".home-page .home-container .home-content .center-panel{padding:0 8px;box-sizing:border-box;margin:0!important;}" +
        "#bili-header-m,.left-panel,.right-panel,.center-panel>.section-block,.sticky-bar{ display:none!important}" +
        ".home-content,.center-panel{width:100%!important;}" +
        ".card{min-width: 0!important;}"
    );
  }

  // /blanc/:id才是真正的直播播放器所在页面
  // 它有时会作为iframe嵌入到直播间里，此时无法直接操作到播放器，所以转跳到实际播放器所在页面
  const liveId = /\/\/live\.bilibili\.com\/(\d+)/.exec(window.location.href);
  if (liveId) {
    window.location.href = `https://live.bilibili.com/blanc/${liveId[1]}?liteVersion=true`;
  }

  // 直播使用桌面版 HTML5 直播播放器
  else if (is.live(window.location.href)) {
    // 通过查询 HTML5 播放器 DIV 来判断页面加载
    if (document.querySelector(".bp-no-flash-tips")) {
      // 切换 HTML5 播放器
      window.EmbedPlayer.loader();
    } else {
      // 全屏播放器并隐藏聊天栏
      document
        .getElementsByTagName("body")[0]
        .classList.add("player-full-win", "hide-aside-area");
      addStyle(
        // 隐藏聊天栏显示按钮
        ".aside-area-toggle-btn{display: none!important}" +
          // 隐藏全屏播放器（在某些情况下会出现）的滚动条
          "body{overflow: hidden;}" +
          // 移除看板娘
          "#my-dear-haruna-vm{display: none!important}" +
          // 移除问题反馈
          ".web-player-icon-feedback{display: none!important}" +
          "#sidebar-vm{display: none!important}"
      );
    }
  } else if (is.login(window.location.href)) {
    addStyle(
      "#internationalHeader,.international-footer,.top-banner,.qrcode-tips,.title-line{display: none!important}"
    );
  } else if (is.search(window.location.href)) {
    // 打开app弹窗自动点击取消
    const style = document.createElement("style");
    style.innerHTML = ".v-dialog{display: none!important}";
    document.head.appendChild(style);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.addedNodes.length > 0 &&
          mutation.addedNodes[0].className === "v-dialog"
        ) {
          document.querySelector(".open-app-dialog-btn.cancel").click();
          observer.disconnect();
        }
      });
    });
    observer.observe(document.body, {
      childList: true,
    });
  }
  // 移除app广告
  const removeAppAd = () => {
    const appAdNode = document.querySelectorAll('[class*="launch-app-btn" i]');
    appAdNode.forEach((node) => {
      node.remove();
    });
  };
  removeAppAd();
});
