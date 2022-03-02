import App from '@/App.vue'
import store from '@/store'
import router from '@/router'
// windicss
import 'virtual:windi.css'
// nprogress
import 'nprogress/nprogress.css'
// arco-design
import '@arco-design/web-vue/es/index.less'
// global style
import '@/assets/css/global.less'
// UiComponents
import Ui from '@/components/ui'
// IconComponents
import Icon from '@/components/ui/icon'
import '@/components/ui/icon/runtime/index.less'

createApp(App)
  .use(router)
  .use(store)
  .use(Ui)
  .use(Icon)
  .mount('#app')
  .$nextTick(window.removeLoading)
