export type HistoryLocation = string;

interface HistoryStateArray extends Array<HistoryStateValue> {}

type HistoryStateValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | HistoryStateArray;

export enum NavigationDirection {
  back = "back",
  forward = "forward",
  unknown = "",
}

export enum NavigationType {
  pop = "pop",
  push = "push",
}

export interface NavigationInformation {
  type: NavigationType;
  direction: NavigationDirection;
  delta: number;
}

export interface NavigationCallback {
  (
    to: HistoryLocation,
    from: HistoryLocation,
    information: NavigationInformation
  ): void;
}

export interface HistoryStateTypes {
  queue: HistoryLocation[];
  position: number;
  listeners: NavigationCallback[];
}
