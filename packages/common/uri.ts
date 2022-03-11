export const isURI = (uriOrPath: string): boolean => {
  return /^(?<scheme>\w[\w\d+.-]*):/.test(uriOrPath)
}

export const prefixHttp = (url: string): string => {
  url = url.trim()
  return url.includes('://') ? url : `http://${url}`
}
