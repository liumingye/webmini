import is from 'electron-is'
import type { NetApi, FetchOptions, NetReturn } from '../interfaces'
import { merge } from 'lodash'

const DEFAULT_FETCH_CONFIG: FetchOptions = {
  method: 'GET',
  body: null,
  headers: null,
}

class Net implements NetApi {
  public electron: typeof Electron = is.renderer()
    ? require('@electron/remote')
    : require('electron')

  public fetch = <T>(url: string, options = {}) => {
    const config = merge(DEFAULT_FETCH_CONFIG, options)
    return new Promise<NetReturn<T>>((resolve, reject) => {
      const request = this.electron.net.request({
        url,
        method: config.method,
        useSessionCookies: true,
      })
      if (config.headers instanceof Object) {
        for (const [header, value] of Object.entries(config.headers)) {
          request.setHeader(header, value)
        }
      }
      request.on('login', () => {
        reject(new Error('Unauthorized'))
      })
      request.once('error', (error) => {
        request.removeAllListeners()
        reject(error)
      })
      request.on('response', (response) => {
        response.removeAllListeners()
        const chunks: Uint8Array[] = []
        response.on('data', (chunk) => {
          chunks.push(chunk)
        })
        response.on('end', () => {
          response.removeAllListeners()
          const data = Buffer.concat(chunks).toString()
          resolve({
            ok: response.statusCode === 200,
            headers: response.headers,
            status: response.statusCode,
            statusText: response.statusMessage,
            text: async () => data,
            json: async () => JSON.parse(data),
          })
        })
        response.on('error', (error: any) => {
          response.removeAllListeners()
          reject(error)
        })
      })
      if (config.body) {
        request.write(config.body.toString())
      }
      request.end()
    })
  }
}

export default Net
