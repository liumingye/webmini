import { app } from 'electron'
import { join } from 'path'

export const isDev = !app.isPackaged
export const URL = isDev
  ? `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`
  : `file://${join(app.getAppPath(), 'dist/renderer/index.html')}`
