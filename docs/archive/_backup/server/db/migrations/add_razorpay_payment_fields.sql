-- ==========================================
-- Migration: Add Razorpay Payment Fields
-- Description: Adds Razorpay-specific payment tracking columns
-- Date: 2025-11-04
-- ==========================================

-- ==========================================
-- 1. Add Razorpay payment tracking columns to orders table
-- ==========================================

-- Add razorpay_order_id column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

COMMENT ON COLUMN public.orders.razorpay_order_id IS 'Razorpay order ID for payment tracking';

-- Add razorpay_payment_id column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

COMMENT ON COLUMN public.orders.razorpay_payment_id IS 'Razorpay payment ID for payment tracking';

-- Add payment_method_details column for storing payment method info
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method_details JSONB;

COMMENT ON COLUMN public.orders.payment_method_details IS 'Detailed payment method information (card, UPI, etc.)';

-- ==========================================
-- 2. Create payment_logs table for audit trail
-- ==========================================

CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('order_created', 'payment_initiated', 'payment_authorized', 'payment_captured', 'payment_failed', 'refund_initiated', 'refund_completed')),
  status TEXT,
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'INR',
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON public.payment_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_razorpay_payment_id ON public.payment_logs(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type ON public.payment_logs(event_type);

COMMENT ON TABLE public.payment_logs IS 'Audit trail for all payment-related events';

-- ==========================================
-- 3. Create indexes for better query performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON public.orders(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_payment_status ON public.orders(user_id, payment_status);

-- ==========================================
-- 4. Update payment_status check constraint to include 'completed'
-- ==========================================

-- Note: If you need to add 'completed' status, you may need to recreate the constraint
-- ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
-- ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
--   CHECK (payment_status IN ('pending', 'completed', 'paid', 'failed', 'refunded'));

