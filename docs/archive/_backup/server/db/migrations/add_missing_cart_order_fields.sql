-- ==========================================
-- Migration: Add Missing Cart & Order Fields
-- Description: Adds order_tracking table and product_snapshot column
-- Date: 2025-10-25
-- ==========================================

-- ==========================================
-- 1. Add product_snapshot to order_items
-- ==========================================

-- Add product_snapshot column to store product details at time of order
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS product_snapshot JSONB;

COMMENT ON COLUMN public.order_items.product_snapshot IS 'Snapshot of product details at time of order (name, description, images, etc.)';

-- ==========================================
-- 2. Create order_tracking table
-- ==========================================

-- Order tracking table for tracking order status history
CREATE TABLE IF NOT EXISTS public.order_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message TEXT,
  location TEXT,
  metadata JSONB,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.order_tracking IS 'Tracks order status changes and shipping updates';
COMMENT ON COLUMN public.order_tracking.order_id IS 'Reference to the order';
COMMENT ON COLUMN public.order_tracking.status IS 'Order status at this tracking point';
COMMENT ON COLUMN public.order_tracking.message IS 'Human-readable status message';
COMMENT ON COLUMN public.order_tracking.location IS 'Current location of the shipment';
COMMENT ON COLUMN public.order_tracking.metadata IS 'Additional tracking metadata (carrier info, etc.)';
COMMENT ON COLUMN public.order_tracking.created_by IS 'User who created this tracking entry';

-- ==========================================
-- 3. Add indexes for performance
-- ==========================================

-- Index for order_tracking queries
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON public.order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_created_at ON public.order_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_order_tracking_status ON public.order_tracking(status);

-- ==========================================
-- 4. Add price column to order_items (alias for unit_price)
-- ==========================================

-- Some queries use 'price' instead of 'unit_price', add as computed column or alias
-- Note: We'll handle this in the application layer for now

-- ==========================================
-- 5. Add subtotal column to order_items (alias for total_price)
-- ==========================================

-- Some queries use 'subtotal' instead of 'total_price', add as computed column or alias
-- Note: We'll handle this in the application layer for now

-- ==========================================
-- 6. Create function to automatically create tracking entry on order status change
-- ==========================================

CREATE OR REPLACE FUNCTION public.create_order_tracking_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create tracking entry if status actually changed
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR TG_OP = 'INSERT' THEN
    INSERT INTO public.order_tracking (order_id, status, message, created_at)
    VALUES (
      NEW.id,
      NEW.status,
      CASE NEW.status
        WHEN 'pending' THEN 'Order placed and awaiting confirmation'
        WHEN 'confirmed' THEN 'Order confirmed and being prepared'
        WHEN 'processing' THEN 'Order is being processed'
        WHEN 'shipped' THEN 'Order has been shipped'
        WHEN 'delivered' THEN 'Order has been delivered'
        WHEN 'cancelled' THEN 'Order has been cancelled'
        WHEN 'refunded' THEN 'Order has been refunded'
        ELSE 'Order status updated'
      END,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.create_order_tracking_on_status_change() IS 'Automatically creates tracking entry when order status changes';

-- ==========================================
-- 7. Create trigger for automatic tracking
-- ==========================================

DROP TRIGGER IF EXISTS trigger_order_status_tracking ON public.orders;

CREATE TRIGGER trigger_order_status_tracking
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_order_tracking_on_status_change();

COMMENT ON TRIGGER trigger_order_status_tracking ON public.orders IS 'Creates tracking entry when order status changes';

-- ==========================================
-- 8. Add updated_at trigger for order_tracking
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_order_tracking_updated_at ON public.order_tracking;

CREATE TRIGGER trigger_order_tracking_updated_at
  BEFORE UPDATE ON public.order_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 9. Backfill tracking data for existing orders
-- ==========================================

-- Create initial tracking entries for existing orders that don't have any
INSERT INTO public.order_tracking (order_id, status, message, created_at)
SELECT 
  o.id,
  o.status,
  CASE o.status
    WHEN 'pending' THEN 'Order placed and awaiting confirmation'
    WHEN 'confirmed' THEN 'Order confirmed and being prepared'
    WHEN 'processing' THEN 'Order is being processed'
    WHEN 'shipped' THEN 'Order has been shipped'
    WHEN 'delivered' THEN 'Order has been delivered'
    WHEN 'cancelled' THEN 'Order has been cancelled'
    WHEN 'refunded' THEN 'Order has been refunded'
    ELSE 'Order status updated'
  END,
  o.created_at
FROM public.orders o
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_tracking ot WHERE ot.order_id = o.id
);

-- ==========================================
-- 10. Grant permissions
-- ==========================================

-- Grant SELECT on order_tracking to authenticated users (they can view their own order tracking)
-- Note: Row-level security should be implemented for production

-- ==========================================
-- Migration Complete
-- ==========================================

-- Verify the migration
DO $$
BEGIN
  -- Check if order_tracking table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_tracking') THEN
    RAISE NOTICE '[OK] order_tracking table created successfully';
  ELSE
    RAISE EXCEPTION '[ERROR] order_tracking table creation failed';
  END IF;

  -- Check if product_snapshot column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'product_snapshot'
  ) THEN
    RAISE NOTICE '[OK] product_snapshot column added successfully';
  ELSE
    RAISE EXCEPTION '[ERROR] product_snapshot column addition failed';
  END IF;

  RAISE NOTICE '[SUCCESS] Migration completed successfully!';
END $$;

