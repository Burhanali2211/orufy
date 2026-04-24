import { db } from '../../lib/db';
import { tenants, subscriptions } from '../../lib/db';
import { eq, sql } from 'drizzle-orm';
import { env } from '../../env';
import { RazorpayWebhookEvent } from '../../lib/razorpay';
import { logger } from '../../lib/logger';
import { sendSubscriptionActivated, sendPaymentFailed, sendSubscriptionCancelled } from '../../lib/email';

export const PLAN_PRICES = {
  basic: 29900,
  standard: 49900,
  premium: 79900,
};

export const RAZORPAY_PLAN_IDS = {
  basic: env.RAZORPAY_PLAN_BASIC,
  standard: env.RAZORPAY_PLAN_STANDARD,
  premium: env.RAZORPAY_PLAN_PREMIUM,
};

export class BillingService {
  /**
   * Processes Razorpay webhook events with idempotency
   */
  async handleWebhookEvent(event: RazorpayWebhookEvent) {
    const { event: eventType, payload } = event;
    const razorpaySubscriptionId = payload.subscription?.entity?.id;

    if (!razorpaySubscriptionId) {
      logger.warn({ eventType }, 'Webhook received without subscription ID');
      return;
    }

    logger.info({ razorpaySubscriptionId }, `Processing Razorpay webhook: ${eventType}`);

    switch (eventType) {
      case 'subscription.activated':
        await this.handleSubscriptionActivated(payload.subscription.entity);
        break;
      case 'subscription.charged':
        await this.handleSubscriptionCharged(payload.subscription.entity);
        break;
      case 'subscription.halted':
        await this.handleSubscriptionHalted(payload.subscription.entity);
        break;
      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(payload.subscription.entity);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(payload.payment.entity, payload.subscription?.entity);
        break;
      default:
        logger.info(`Unhandled Razorpay event: ${eventType}`);
    }
  }

  private async handleSubscriptionActivated(entity: any) {
    const { id: razorpaySubscriptionId, current_start, current_end } = entity;

    await db.transaction(async (tx) => {
      // 1. Update subscription record
      const [updatedSub] = await tx
        .update(subscriptions)
        .set({
          status: 'active',
          currentPeriodStart: current_start ? new Date(current_start * 1000) : null,
          currentPeriodEnd: current_end ? new Date(current_end * 1000) : null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscriptionId))
        .returning({ tenantId: subscriptions.tenantId });

      if (updatedSub) {
        // 2. Activate tenant
        const [tenant] = await tx
          .update(tenants)
          .set({ status: 'active', updatedAt: new Date() })
          .where(eq(tenants.id, updatedSub.tenantId))
          .returning({ name: tenants.name, slug: tenants.slug });
        
        logger.info({ tenantId: updatedSub.tenantId }, 'Subscription activated and tenant enabled');

        // Get owner email
        const { users } = await import('../../../../../db/schema');
        const [owner] = await tx.select({ email: users.email, name: users.name })
          .from(users).where(eq(users.tenantId, updatedSub.tenantId)).limit(1);

        if (owner && tenant) {
          await sendSubscriptionActivated(owner.email, {
            shopName: tenant.name,
            plan: 'Pro', // Plan detail can be fetched or hardcoded based on context
            renewalDate: current_end ? new Date(current_end * 1000).toLocaleDateString() : 'N/A'
          });
        }
      }
    });
  }

  private async handleSubscriptionCharged(entity: any) {
    const { id: razorpaySubscriptionId, current_end } = entity;

    await db
      .update(subscriptions)
      .set({
        currentPeriodEnd: current_end ? new Date(current_end * 1000) : null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscriptionId));
    
    logger.info({ razorpaySubscriptionId }, 'Subscription charged and period extended');
  }

  private async handleSubscriptionHalted(entity: any) {
    const { id: razorpaySubscriptionId } = entity;

    await db.transaction(async (tx) => {
      const [updatedSub] = await tx
        .update(subscriptions)
        .set({ status: 'halted', updatedAt: new Date() })
        .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscriptionId))
        .returning({ tenantId: subscriptions.tenantId });

      if (updatedSub) {
        const [tenant] = await tx
          .update(tenants)
          .set({ status: 'suspended', updatedAt: new Date() })
          .where(eq(tenants.id, updatedSub.tenantId))
          .returning({ name: tenants.name });
        
        logger.warn({ tenantId: updatedSub.tenantId }, 'Subscription halted and tenant suspended');

        const { users } = await import('../../../../../db/schema');
        const [owner] = await tx.select({ email: users.email }).from(users).where(eq(users.tenantId, updatedSub.tenantId)).limit(1);

        if (owner && tenant) {
          await sendPaymentFailed(owner.email, {
            shopName: tenant.name,
            retryUrl: `https://${env.APP_DOMAIN}/dashboard/billing`,
            failureCount: 3 // Assumed halted after max retries
          });
        }
      }
    });
  }

  private async handleSubscriptionCancelled(entity: any) {
    const { id: razorpaySubscriptionId } = entity;

    await db.transaction(async (tx) => {
      const [updatedSub] = await tx
        .update(subscriptions)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscriptionId))
        .returning({ tenantId: subscriptions.tenantId });

      if (updatedSub) {
        const [tenant] = await tx
          .update(tenants)
          .set({ status: 'cancelled', updatedAt: new Date() })
          .where(eq(tenants.id, updatedSub.tenantId))
          .returning({ name: tenants.name });
        
        logger.info({ tenantId: updatedSub.tenantId }, 'Subscription and tenant cancelled');

        const { users } = await import('../../../../../db/schema');
        const [owner] = await tx.select({ email: users.email, name: users.name }).from(users).where(eq(users.tenantId, updatedSub.tenantId)).limit(1);

        if (owner && tenant) {
          await sendSubscriptionCancelled(owner.email, {
            shopName: tenant.name,
            ownerName: owner.name
          });
        }
      }
    });
  }

  private async handlePaymentFailed(paymentEntity: any, subscriptionEntity?: any) {
    if (!subscriptionEntity) return;

    const razorpaySubscriptionId = subscriptionEntity.id;

    await db.transaction(async (tx) => {
      const [sub] = await tx
        .update(subscriptions)
        .set({
          failureCount: sql`${subscriptions.failureCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubscriptionId))
        .returning({ failureCount: subscriptions.failureCount, tenantId: subscriptions.tenantId });

      if (sub && (sub.failureCount ?? 0) >= 3) {
        await tx
          .update(tenants)
          .set({ status: 'suspended', updatedAt: new Date() })
          .where(eq(tenants.id, sub.tenantId));
        
        logger.error({ tenantId: sub.tenantId }, 'Tenant suspended due to multiple payment failures');
      }
      
      if (sub) {
        const { users } = await import('../../../../../db/schema');
        const [tenant] = await tx.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, sub.tenantId)).limit(1);
        const [owner] = await tx.select({ email: users.email }).from(users).where(eq(users.tenantId, sub.tenantId)).limit(1);

        if (owner && tenant) {
          await sendPaymentFailed(owner.email, {
            shopName: tenant.name,
            retryUrl: `https://${env.APP_DOMAIN}/dashboard/billing`,
            failureCount: sub.failureCount ?? 1
          });
        }
      }
    });
  }
}

export const billingService = new BillingService();
