export type HistoryLocation = string

export enum NavigationDirection {
  back = 'back',
  forward = 'forward',
}

export enum NavigationType {
  pop = 'pop',
}

export interface NavigationInformation {
  type: NavigationType
  direction: NavigationDirection
  delta: number
}

export interface NavigationCallback {
  (to: HistoryLocation, from: HistoryLocation, information: NavigationInformation): void
}

export interface HistoryStateTypes {
  queue: HistoryLocation[]
  position: number
  listeners: NavigationCallback[]
  limit: number
}
