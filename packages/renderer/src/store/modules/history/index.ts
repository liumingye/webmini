/**
 * memory history
 */
import {
  HistoryStateTypes,
  HistoryLocation,
  NavigationDirection,
  NavigationType,
  NavigationInformation,
  NavigationCallback,
} from './types'
import { defineStore } from 'pinia'
import { START } from '@/utils/constant'

export const useHistoryStore = defineStore('history', {
  state: (): HistoryStateTypes => ({
    queue: [START],
    position: 0,
    listeners: [],
  }),
  actions: {
    setLocation(location: HistoryLocation) {
      this.position++
      if (this.position === this.queue.length) {
        // we are at the end, we can simply append a new entry
        this.queue.push(location)
      } else {
        // we are in the middle, we remove everything from here in the queue
        this.queue.splice(this.position)
        this.queue.push(location)
      }
    },
    push(to: HistoryLocation) {
      if (this.location === to) return
      this.setLocation(to)
    },
    triggerListeners(
      to: HistoryLocation,
      from: HistoryLocation,
      { direction, delta }: Pick<NavigationInformation, 'direction' | 'delta'>,
    ): void {
      const info: NavigationInformation = {
        direction,
        delta,
        type: NavigationType.pop,
      }
      for (const callback of this.listeners) {
        callback(to, from, info)
      }
    },
    go(delta: number, shouldTrigger = true) {
      const from = this.location
      const direction: NavigationDirection =
        // we are considering delta === 0 going forward, but in abstract mode
        // using 0 for the delta doesn't make sense like it does in html5 where
        // it reloads the page
        delta < 0 ? NavigationDirection.back : NavigationDirection.forward
      this.position = Math.max(0, Math.min(this.position + delta, this.queue.length - 1))
      if (shouldTrigger) {
        this.triggerListeners(this.location, from, {
          direction,
          delta,
        })
      }
    },
    listen(callback: NavigationCallback) {
      this.listeners.push(callback)
      return () => {
        const index = this.listeners.indexOf(callback)
        if (index > -1) this.listeners.splice(index, 1)
      }
    },
    destroy() {
      this.queue = [START]
      this.position = 0
      this.listeners = []
    },
    replace(to: HistoryLocation) {
      // remove current entry and decrement position
      this.queue.splice(this.position--, 1)
      this.setLocation(to)
    },
  },
  getters: {
    location(state) {
      return state.queue[state.position]
    },
    canGoBack(state) {
      return state.position > 0
    },
    canGoForward(state) {
      return state.position < state.queue.length - 1
    },
  },
})
