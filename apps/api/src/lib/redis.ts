import { Redis } from 'ioredis'
import { env } from '../env'

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,          // Don't connect until first use
  retryStrategy: (times) => {
    // Back off fast in dev — max 30 s
    if (times > 5) return null  // stop retrying after 5 attempts
    return Math.min(times * 500, 5000)
  },
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,  // fail fast instead of queuing commands
})

// Suppress unhandled error events so they don't kill the process
redis.on('error', (err) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[redis] connection error (Redis optional in dev):', err.message)
  }
})
