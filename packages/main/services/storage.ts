import { app } from 'electron'
import LocalDb from '../core/db'
import type { Model } from '../core/db/types'

export class StorageService {
  public static instance = new this()

  public localDb: LocalDb

  public constructor(public key = 'WEBMINI_DB_DEFAULT') {
    this.localDb = new LocalDb(app.getPath('userData'))
  }

  public async get(id: string, key = this.key) {
    return await this.localDb.get(key, id)
  }

  public async put(doc: PouchDB.Core.PutDocument<Model>, key = this.key) {
    const result = await this.localDb.get(key, doc._id)
    doc._rev = result ? result._rev : ''
    return await this.localDb.put(key, doc)
  }
}
