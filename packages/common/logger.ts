import { createLogger, format, transports } from 'winston'
import is from 'electron-is'
import { resolve } from 'path'
import 'winston-daily-rotate-file'
import node_console from 'console'

const electron = is.renderer() ? require('@electron/remote') : require('electron')
const level = is.dev() ? 'debug' : 'info'
const logDir = electron.app.getPath('logs')
const logName = `${electron.app.name}-%DATE%.log`

export default createLogger({
  level,
  format: format.timestamp({ format: 'YYYY-MM-dd HH:mm:ss.ms' }),
  transports: [
    new transports.DailyRotateFile({
      level: 'debug',
      filename: resolve(logDir, logName),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      json: false,
      maxSize: '10m',
      maxFiles: '7d',
      format: format.combine(
        format.printf(({ level, message, label, timestamp }) => {
          return `${timestamp} ${label ? `[${label}] ` : ''}${level}: ${message}`
        }),
      ),
    }),
    new transports.Console({
      format: format.combine(format.colorize({ all: true })),
      log: ({ level, message, label, timestamp }, next) => {
        const print = `${timestamp} ${label ? `[${label}] ` : ''}${level}: ${message}`
        console.log(print)
        node_console.log(print)
        next()
      },
    }),
  ],
})
