import { createLogger, format, transports } from 'winston'
import { app } from '@electron/remote'
import { resolve } from 'path'
import 'winston-daily-rotate-file'
import node_console from 'console'

const logDir = app.getPath('logs')
const isDev = process.env.NODE_ENV !== 'production'

export default createLogger({
  level: isDev ? 'debug' : 'info',
  transports: [
    new transports.DailyRotateFile({
      level: 'debug',
      filename: resolve(logDir, '%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '7d',
      format: format.combine(format.timestamp(), format.json()),
    }),
    new transports.Console({
      format: format.combine(format.colorize({ all: true }), format.timestamp()),
      log: ({ level, message, label, timestamp }, next) => {
        const print = `${timestamp} ${label ? `[${label}] ` : ''}${level}: ${message}`
        console.log(print)
        node_console.log(print)
        next()
      },
    }),
  ],
})
