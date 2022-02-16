import { createRouter, createWebHashHistory, RouteRecordRaw, RouteRecordName } from 'vue-router'

// export const keepAlive: RouteRecordName[] = ['Home', 'Explore']

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Main.vue'),
  },
  {
    path: '/select-part',
    name: 'SelectPart',
    component: () => import('@/views/SelectPart.vue'),
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
