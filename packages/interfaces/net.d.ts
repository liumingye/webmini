interface FetchOptions {
  method: string
  body: string | null
  headers: { [key: string]: string } | null
}

interface NetReturn<T> {
  ok: boolean
  status: number
  statusText: string
  headers: Record<string, string | string[]>
  text: () => Promise<string>
  json: () => Promise<T>
}

interface NetApi {
  fetch: <T>(url: string, options: Partial<FetchOptions>) => Promise<NetReturn<T>>
}

export { NetApi, FetchOptions, NetReturn }
