import { createApp } from 'vue'
import App from '@/App.vue'
import store from '@/store'
import router from '@/router'
// windicss
import 'virtual:windi-base.css'
import 'virtual:windi-components.css'
import 'virtual:windi-utilities.css'
// nprogress
import 'nprogress/nprogress.css'
// global style
import '@/assets/css/global.less'

createApp(App).use(router).use(store).mount('#app').$nextTick(window.removeLoading)
