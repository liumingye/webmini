import Storage from 'electron-json-storage'
import Logger from '~/common/logger'
import { isValidKey } from '~/common/object'
import is from 'electron-is'

const electron = is.renderer() ? require('@electron/remote') : require('electron')

export class StorageService {
  public static instance = new this()

  public key = 'app'

  public constructor() {
    Storage.setDataPath(electron.app.getPath('userData') + '/config')
  }

  public get = (key = this.key) => {
    const config = Storage.getSync(key)
    return config
  }

  public remove = (data: string, key = this.key) => {
    const json = this.get(key)

    if (!isValidKey(data, json)) return

    delete json[data]

    Storage.set(key, { ...json }, (error: any) => {
      if (error) {
        Logger.error(error)
        throw error
      }
    })
  }

  public find = (data: string, key = this.key) => {
    const json = this.get(key)

    if (!isValidKey(data, json)) {
      return null
    }

    return json[data]
  }

  public update = (data: Record<string, any>, key = this.key) => {
    const oldJson = this.get(key)

    Storage.set(key, { ...oldJson, ...data }, (error: any) => {
      if (error) {
        Logger.error(error)
        throw error
      }
    })
  }
}
