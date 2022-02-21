import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Main.vue'),
    meta: { title: '主窗口' },
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
