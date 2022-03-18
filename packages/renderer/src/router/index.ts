import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Browser',
    component: () => import('@/views/Main.vue'),
    meta: { title: '浏览器' },
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/pages/home/Home.vue'),
        meta: { title: 'webmini' },
      },
      {
        path: 'home/webnav',
        name: 'WebNav',
        component: () => import('@/views/pages/home/WebNav.vue'),
        meta: { title: '导航' },
      },
      {
        path: 'home/plugin',
        name: 'Plugin',
        component: () => import('@/views/pages/plugin/Plugin.vue'),
        meta: { title: '插件市场' },
      },
      {
        path: 'home/settings',
        name: 'Settings',
        component: () => import('@/views/pages/settings/Settings.vue'),
        meta: { title: '设置' },
      },
      {
        path: 'home/settings/about',
        name: 'About',
        component: () => import('@/views/pages/settings/About.vue'),
        meta: { title: '关于' },
      },
    ],
  },
  {
    path: '/select-part',
    name: 'SelectPart',
    component: () => import('@/views/SelectPart.vue'),
    meta: { title: '选p窗口' },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
})

export default router
