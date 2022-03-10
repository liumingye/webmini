export function isURI(uriOrPath: string): boolean {
  return /^(?<scheme>\w[\w\d+.-]*):/.test(uriOrPath)
}
