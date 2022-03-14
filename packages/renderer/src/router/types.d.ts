import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    transition?: 'slide-right' | 'slide-left'
    scrollTop?: number
  }
}
