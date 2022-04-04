import is from 'electron-is'
const electron: typeof Electron = is.renderer()
  ? // renderer
    require('@electron/remote')
  : // main
    require('electron')

const version = `${electron.app.name}/${electron.app.getVersion()}`

export const userAgent = {
  desktop: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.3 ${version} Safari/605.1.15`,
  mobile: `Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 ${version} Safari/604.1`,
}

export const ERROR_PROTOCOL = 'webmini-error'

export const NETWORK_ERROR_HOST = 'network-error'
