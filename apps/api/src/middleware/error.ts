import { ErrorHandler } from 'hono'
import { logger } from '../lib/logger'

export const errorHandler: ErrorHandler = (err, c) => {
  logger.error(err)
  
  return c.json({
    error: 'Internal Server Error',
    message: err.message
  }, 500)
}
