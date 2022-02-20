import { createApp } from "vue";
import App from "@/App.vue";
import store from "@/store";
import router from "@/router";
// nprogress
import "nprogress/nprogress.css";
// global style
import "@/assets/css/global.less";

createApp(App)
  .use(router)
  .use(store)
  .mount("#app")
  .$nextTick(window.removeLoading);
