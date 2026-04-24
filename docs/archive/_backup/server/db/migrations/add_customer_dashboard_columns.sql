-- Migration: Add customer dashboard columns
-- Date: 2024

-- Add price_alerts to notification_preferences
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notification_preferences' AND column_name = 'price_alerts') THEN
        ALTER TABLE public.notification_preferences ADD COLUMN price_alerts BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add card_brand to payment_methods
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payment_methods' AND column_name = 'card_brand') THEN
        ALTER TABLE public.payment_methods ADD COLUMN card_brand TEXT;
    END IF;
END $$;

-- Add upi_id to payment_methods
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payment_methods' AND column_name = 'upi_id') THEN
        ALTER TABLE public.payment_methods ADD COLUMN upi_id TEXT;
    END IF;
END $$;
