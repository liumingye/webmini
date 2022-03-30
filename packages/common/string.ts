/**
 * 批量替换字符串
 * @param text 字符串
 * @param map 字符串替换的映射
 * @param replacer 替换的字符串
 * @returns 替换后的字符串
 */
export const replaceAll = (text: string, map: string[], replacer: string): string => {
  return map.reduce((acc, cur) => acc.replace(cur, replacer), text)
}
