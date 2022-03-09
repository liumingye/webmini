import { isString } from 'lodash'

export const matchPattern = (str: string) => {
  return (pattern: string | RegExp) => {
    if (isString(pattern)) {
      return str.includes(pattern)
    }
    return pattern.test(str)
  }
}
