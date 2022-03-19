type RevisionId = string

export interface Model {
  _id: string
  data: any
  _rev?: string
}

export interface DBError {
  /**
   * HTTP Status Code during HTTP or HTTP-like operations
   */
  status?: number | undefined
  name?: string | undefined
  message?: string | undefined
  reason?: string | undefined
  error?: string | boolean | undefined
  id?: string | undefined
  rev?: RevisionId | undefined
}
