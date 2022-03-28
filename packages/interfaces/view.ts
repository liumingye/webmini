export enum WindowTypeEnum {
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
  MINI = 'mini',
  FEED = 'feed',
  LOGIN = 'login',
}

export type WindowType = Record<WindowTypeEnum, number[]>

export const WindowTypeDefault: WindowType = {
  [WindowTypeEnum.MOBILE]: [376, 500],
  [WindowTypeEnum.DESKTOP]: [1100, 600],
  [WindowTypeEnum.MINI]: [300, 170],
  [WindowTypeEnum.FEED]: [650, 760],
  [WindowTypeEnum.LOGIN]: [490, 394],
}
