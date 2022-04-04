/**
 * isURI
 * @param {string} uriOrPath
 * @returns {boolean}
 */
export const isURI = (uriOrPath: string): boolean => {
  try {
    return !!new URL(uriOrPath)
  } catch (e) {
    return false
  }
}

/**
 * prefixHttp
 * @param {string} url
 * @returns {string}
 */
export const prefixHttp = (url: string): string => {
  url = url.trim()
  return url.startsWith('http') ? url : `http://${url}`
}
