import { app } from 'electron'
import LocalDb from '../core/db'
import type { Model } from '../core/db/types'

export class StorageService {
  public static instance = new this()

  public readonly localDb: LocalDb

  public constructor(public key = 'WEBMINI_DB_DEFAULT') {
    this.localDb = new LocalDb(app.getPath('userData'))
  }

  /**
   * 查询
   * @param id
   * @param key
   * @returns
   */
  public async get(id: string, key = this.key) {
    return await this.localDb.get(key, id)
  }

  /**
   * 更改
   * @param doc
   * @param key
   * @returns
   */
  public async put(doc: PouchDB.Core.PutDocument<Model>, key = this.key) {
    const allDocs = await this.localDb.get(key, doc._id)
    if (allDocs) {
      doc.data = { ...allDocs.data, ...doc.data }
      doc._rev = allDocs._rev
    } else {
      doc._rev = ''
    }
    return await this.localDb.put(key, doc)
  }

  /**
   * 删除
   * @param doc
   * @param key
   * @returns
   */
  public async remove(doc: PouchDB.Core.RemoveDocument, key = this.key) {
    return await this.localDb.remove(key, doc)
  }
}
