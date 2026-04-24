import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
    },
  }),
  ...(!isDev && {
    // Production: structured JSON with standard field names
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: { service: 'saas-api' },
  }),
})

export interface RequestLogFields {
  method: string
  path: string
  status: number
  duration: number   // ms
  tenantSlug: string | null
  userId: string | null
  ip: string
}

export function logRequest(fields: RequestLogFields): void {
  const level = fields.status >= 500 ? 'error' : fields.status >= 400 ? 'warn' : 'info'
  logger[level](fields, `${fields.method} ${fields.path} ${fields.status} ${fields.duration}ms`)
}
