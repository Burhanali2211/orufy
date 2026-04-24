import { z } from 'zod'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '../../.env') })

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.string().url(),
  RAZORPAY_KEY_ID: z.string(),
  RAZORPAY_KEY_SECRET: z.string(),
  RAZORPAY_WEBHOOK_SECRET: z.string(),
  R2_ACCOUNT_ID: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_BUCKET_NAME: z.string(),
  R2_PUBLIC_DOMAIN: z.string(),
  RESEND_API_KEY: z.string(),
  RAZORPAY_PLAN_BASIC: z.string(),
  RAZORPAY_PLAN_STANDARD: z.string(),
  RAZORPAY_PLAN_PREMIUM: z.string(),
  APP_DOMAIN: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const env = envSchema.parse(process.env)
