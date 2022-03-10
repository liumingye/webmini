import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Main.vue'),
    meta: { title: 'bilimini' },
    children: [
      {
        path: 'web-nav',
        name: 'WebNav',
        component: () => import('@/views/pages/WebNav.vue'),
        meta: { title: '导航' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/pages/settings/Settings.vue'),
        meta: { title: '设置' },
      },
      {
        path: 'settings/about',
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
