export function isURI(uriOrPath: string) {
  return /^(?<scheme>\w[\w\d+.-]*):/.test(uriOrPath)
}
