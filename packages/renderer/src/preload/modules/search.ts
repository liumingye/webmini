import { addStyle } from "../utils";

let removeStyle: () => void;

const searchObserver = new MutationObserver((mutations) => {
  mutations.forEach(({ addedNodes }) => {
    if (addedNodes.length === 0) return;
    const node = addedNodes[0] as HTMLElement;
    if (node.className === "v-dialog") {
      const cancel = document.querySelector(
        ".open-app-dialog-btn.cancel"
      ) as HTMLElement;
      cancel?.click();
      searchObserver.disconnect();
    }
  });
});

const fn = {
  start: () => {
    fn.stop();
    // 打开app弹窗自动点击取消
    removeStyle = addStyle(".v-dialog{display: none!important}");
    searchObserver.observe(document.body, {
      childList: true,
    });
  },

  stop: () => {
    // 断开 observer
    searchObserver.disconnect();
    removeStyle && removeStyle();
  },
};

export default fn;
