import App from '@/App.vue'
import store from '@/store'
import router from '@/router'

// windicss
import 'virtual:windi-base.css'
import 'virtual:windi-components.css'
import 'virtual:windi-utilities.css'
// nprogress
import 'nprogress/nprogress.css'
// arco-design
import '@arco-design/web-vue/es/index.less'
// UiComponents
import Ui from '@/components/ui'
// IconComponents
import Icon from '@/components/ui/icon'
import '@/components/ui/icon/runtime/index.less'
// OverlayScrollbars
import 'overlayscrollbars/css/OverlayScrollbars.css'
// global style
import '@/assets/css/global.less'

// NProgress
import NProgress from 'nprogress'
// VueRequest
import { setGlobalOptions } from 'vue-request'

createApp(App)
  .use(router)
  .use(store)
  .use(Ui)
  .use(Icon)
  .mount('#app')
  .$nextTick(window.removeLoading)

// NProgress
NProgress.configure({ easing: 'ease', speed: 200, trickleSpeed: 50, showSpinner: false })

// VueRequest
setGlobalOptions({
  manual: true,
  errorRetryCount: 2,
  debounceInterval: 150,
})
