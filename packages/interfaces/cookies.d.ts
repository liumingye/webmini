interface CookiesApi {
  get: (filter: Electron.CookiesGetFilter) => Promise<Electron.Cookie[]>
}

export { CookiesApi }
