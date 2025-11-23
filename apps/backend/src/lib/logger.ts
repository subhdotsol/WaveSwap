import { config } from './config'

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
} as const

type LogLevel = keyof typeof levels

const currentLevel = levels[config.LOG_LEVEL as LogLevel] || levels.info

function shouldLog(level: LogLevel): boolean {
  return levels[level] <= currentLevel
}

function formatMessage(level: LogLevel, message: string, meta?: any): string {
  const timestamp = new Date().toISOString()
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`
}

export const logger = {
  error: (message: string, meta?: any) => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, meta))
    }
  },

  warn: (message: string, meta?: any) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, meta))
    }
  },

  info: (message: string, meta?: any) => {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, meta))
    }
  },

  http: (message: string, meta?: any) => {
    if (shouldLog('http')) {
      console.log(formatMessage('http', message, meta))
    }
  },

  debug: (message: string, meta?: any) => {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, meta))
    }
  },
}