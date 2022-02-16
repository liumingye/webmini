import { createApp } from "vue";
import App from "@/App.vue";
import store from "@/store";
import router from "@/router";
// nprogress
import 'nprogress/nprogress.css'
// global style
import "@/assets/css/global.less";

createApp(App)
  .use(router)
  .use(store)
  .mount("#app")
  .$nextTick(window.removeLoading);

// console.log('fs', window.fs)
// console.log('ipcRenderer', window.ipcRenderer)

// Usage of ipcRenderer.on
// window.ipcRenderer.on("main-process-message", (_event, ...args) => {
//   console.log("[Receive Main-process message]:", ...args);
// });
