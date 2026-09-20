ALTER TABLE "admin_dashboard_settings" ADD CONSTRAINT "unq_admin_settings_store_key" UNIQUE("store_id","setting_key");--> statement-breakpoint
ALTER TABLE "business_hours" ADD CONSTRAINT "unq_business_hours_store_day" UNIQUE("store_id","day_of_week");--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "unq_cart_user_product_variant" UNIQUE("store_id","user_id","product_id","variant_id");--> statement-breakpoint
ALTER TABLE "checkout_idempotency" ADD CONSTRAINT "unq_store_idempotency" UNIQUE("store_id","idempotency_key");--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "unq_notif_store_user" UNIQUE("store_id","user_id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "unq_store_slug" UNIQUE("store_id","slug");--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "unq_site_settings_store_key" UNIQUE("store_id","setting_key");--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "unq_wishlist_user_product" UNIQUE("store_id","user_id","product_id");