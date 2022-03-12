import { protocol } from 'electron'
import { join } from 'path'
import { ERROR_PROTOCOL } from '~/common/constant'

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'webmini',
    privileges: {
      bypassCSP: true,
      secure: true,
      standard: true,
      supportFetchAPI: true,
      allowServiceWorkers: true,
      corsEnabled: false,
    },
  },
])

export const registerProtocol = (session: Electron.Session) => {
  session.protocol.registerFileProtocol(ERROR_PROTOCOL, (request, callback: any) => {
    const _URL = new URL(request.url)
    if (_URL.hostname === 'network-error') {
      return callback({
        path: join(__dirname, '../../resources/pages/', `network-error.html`),
      })
    }
  })
}
