interface StorageServiceApi {
  /**
   * 查询
   * @param id
   * @param key
   * @returns
   */
  get: (
    id: string,
    key?: string,
  ) => Promise<(Model & PouchDB.Core.IdMeta & PouchDB.Core.GetMeta) | null>

  /**
   * 更改
   * @param doc
   * @param key
   * @returns
   */
  put: (
    doc: PouchDB.Core.PutDocument<Model>,
    key?: string,
  ) => Promise<DBError | PouchDB.Core.Response>

  /**
   * 删除
   * @param doc
   * @param key
   * @returns
   */
  remove: (
    doc: PouchDB.Core.RemoveDocument,
    key?: string,
  ) => Promise<DBError | PouchDB.Core.Response>
}

export { StorageServiceApi }
