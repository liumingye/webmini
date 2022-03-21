import path from 'path'
import { app } from 'electron'

const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`
  } else {
    return `file://${path.join(app.getAppPath(), 'dist/renderer')}`
  }
}

const getUrl = (pageName: string, route: string) => {
  const baseUrl = getBaseUrl()
  return `${path.join(baseUrl, `${pageName}.html`)}${route ? `#/${route}` : ''}`
}

export { getBaseUrl, getUrl }
