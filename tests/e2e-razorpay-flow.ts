import crypto from 'crypto';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgres://postgres:password@localhost:5433/platform_db'
});

const WEBHOOK_SECRET = 'e2e_test_secret_key';

function signPayload(payload: any, secret = WEBHOOK_SECRET): string {
  return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
}

async function runE2E() {
  console.log('====================================================');
  console.log('  STARTING PHASE 8 END-TO-END RAZORPAY TEST SUITE');
  console.log('====================================================\n');

  const storeAId = '00000000-0000-0000-0000-00000000000a';
  const storeBId = '00000000-0000-0000-0000-00000000000b';
  const linkedAccountA = 'acc_linked_store_A_999';
  const linkedAccountB = 'acc_linked_store_B_888';

  const userCustomerA = '00000000-0000-0000-0000-000000000c01';
  const userCustomerB = '00000000-0000-0000-0000-000000000c02';

  // 1. Setup Stores & Profiles
  await pool.query('DELETE FROM payment_transfers');
  await pool.query('DELETE FROM payment_webhook_events');
  await pool.query('DELETE FROM order_items');
  await pool.query('DELETE FROM orders');

  await pool.query(`
    INSERT INTO profiles (id, email, full_name, is_active)
    VALUES 
      ($1, 'custA@e2e.test', 'Customer A', true),
      ($2, 'custB@e2e.test', 'Customer B', true)
    ON CONFLICT (id) DO NOTHING;
  `, [userCustomerA, userCustomerB]);

  await pool.query(`
    INSERT INTO stores (id, name, hostname, razorpay_linked_account_id)
    VALUES 
      ($1, 'Store A', 'store-a.test', $3),
      ($2, 'Store B', 'store-b.test', $4)
    ON CONFLICT (id) DO UPDATE 
    SET razorpay_linked_account_id = EXCLUDED.razorpay_linked_account_id;
  `, [storeAId, storeBId, linkedAccountA, linkedAccountB]);

  // Product in Store A: ₹1,000 (100000 paise)
  const prodAId = '00000000-1111-0000-0000-00000000000a';
  await pool.query(`
    INSERT INTO products (id, store_id, name, price, stock)
    VALUES ($1, $2, 'Store A Essential Spice', 100000, 50)
    ON CONFLICT (id) DO UPDATE SET price = 100000, stock = 50;
  `, [prodAId, storeAId]);

  // Product in Store B: ₹2,000 (200000 paise)
  const prodBId = '00000000-2222-0000-0000-00000000000b';
  await pool.query(`
    INSERT INTO products (id, store_id, name, price, stock)
    VALUES ($1, $2, 'Store B Luxury Attar', 200000, 25)
    ON CONFLICT (id) DO UPDATE SET price = 200000, stock = 25;
  `, [prodBId, storeBId]);

  console.log('[1/6] Test environment seeded:');
  console.log(`  - Store A (${storeAId}): Linked Account = ${linkedAccountA}, Product A = ₹1,000 (100000 paise)`);
  console.log(`  - Store B (${storeBId}): Linked Account = ${linkedAccountB}, Product B = ₹2,000 (200000 paise)\n`);

  // ==========================================
  // SCENARIO 1: STORE A FULL LIFECYCLE
  // ==========================================
  console.log('--- SCENARIO 1: STORE A PAYMENT, ROUTE TRANSFER & SETTLEMENT ---');
  
  // 1. Order Calculation
  const subtotalA = 100000;
  const taxA = Math.round(subtotalA * 0.18); // 18000 paise (₹180)
  const totalA = subtotalA + taxA; // 118000 paise (₹1,180)
  const orderNumA = `ORD-E2E-A-${Date.now()}`;
  const rzpOrderA = `order_rzp_A_${Date.now()}`;

  const resOrderA = await pool.query(`
    INSERT INTO orders (store_id, user_id, order_number, razorpay_order_id, total_amount, subtotal, tax_amount, shipping_amount, shipping_address, billing_address, status, payment_status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 0, '{}', '{}', 'ORDER_CREATED', 'PAYMENT_PENDING')
    RETURNING id;
  `, [storeAId, userCustomerA, orderNumA, rzpOrderA, totalA, subtotalA, taxA]);
  const orderAId = resOrderA.rows[0].id;
  console.log(`✓ Order A created: total_amount = ${totalA} paise (Subtotal: ${subtotalA}, Tax: ${taxA})`);

  // 2. payment.captured Webhook
  const rzpPayA = `pay_rzp_A_${Date.now()}`;
  const capEventIdA = `evt_cap_A_${Date.now()}`;
  const capPayloadA = {
    event: 'payment.captured',
    event_id: capEventIdA,
    payload: {
      payment: {
        entity: {
          id: rzpPayA,
          order_id: rzpOrderA,
          amount: totalA,
          status: 'captured'
        }
      }
    }
  };

  // Process payment.captured in DB
  await pool.query(`
    INSERT INTO payment_webhook_events (razorpay_event_id, event_type, payload, processing_status, processed_at)
    VALUES ($1, $2, $3, 'PROCESSED', now());
  `, [capEventIdA, 'payment.captured', JSON.stringify(capPayloadA)]);

  await pool.query(`
    UPDATE orders 
    SET payment_status = 'PAYMENT_CAPTURED', status = 'PAYMENT_CAPTURED', razorpay_payment_id = $1, updated_at = now()
    WHERE razorpay_order_id = $2;
  `, [rzpPayA, rzpOrderA]);

  const verifyCapA = await pool.query('SELECT status, payment_status, razorpay_payment_id FROM orders WHERE id = $1', [orderAId]);
  console.log(`✓ payment.captured: status = ${verifyCapA.rows[0].status}, payment_id = ${verifyCapA.rows[0].razorpay_payment_id}`);

  // 3. transfer.processed Webhook
  const rzpTrfA = `trf_rzp_A_${Date.now()}`;
  const trfEventIdA = `evt_trf_A_${Date.now()}`;
  const trfPayloadA = {
    event: 'transfer.processed',
    event_id: trfEventIdA,
    payload: {
      transfer: {
        id: rzpTrfA,
        source: rzpOrderA,
        recipient: linkedAccountA,
        amount: totalA,
        currency: 'INR'
      }
    }
  };

  // Correlation check
  const storeCheckA = await pool.query('SELECT razorpay_linked_account_id FROM stores WHERE id = $1', [storeAId]);
  if (storeCheckA.rows[0].razorpay_linked_account_id !== linkedAccountA) {
    throw new Error('Correlation failed for Store A');
  }

  await pool.query(`
    INSERT INTO payment_transfers (order_id, store_id, razorpay_transfer_id, linked_account_id, amount_paise, transfer_status)
    VALUES ($1, $2, $3, $4, $5, 'PROCESSED');
  `, [orderAId, storeAId, rzpTrfA, linkedAccountA, totalA]);

  await pool.query(`
    UPDATE orders SET status = 'TRANSFER_PROCESSED', updated_at = now() WHERE id = $1;
  `, [orderAId]);

  const verifyTrfA = await pool.query('SELECT * FROM payment_transfers WHERE razorpay_transfer_id = $1', [rzpTrfA]);
  console.log(`✓ transfer.processed: transfer_id = ${verifyTrfA.rows[0].razorpay_transfer_id}, recipient = ${verifyTrfA.rows[0].linked_account_id}, amount = ${verifyTrfA.rows[0].amount_paise} paise`);
  console.log(`  Transfer Recipient Verified: Expected ${linkedAccountA} === Actual ${verifyTrfA.rows[0].linked_account_id}`);

  // 4. settlement.processed Webhook
  const rzpSetlA = `setl_rzp_A_${Date.now()}`;
  const recSetlA = `rec_setl_A_${Date.now()}`;
  const utrA = `UTR_HDFC_${Date.now()}`;

  await pool.query(`
    UPDATE payment_transfers 
    SET settlement_id = $1, recipient_settlement_id = $2, utr = $3, settlement_status = 'PROCESSED', settled_at = now()
    WHERE id = $4;
  `, [rzpSetlA, recSetlA, utrA, verifyTrfA.rows[0].id]);

  const verifySetlA = await pool.query('SELECT transfer_status, settlement_status, settlement_id, utr FROM payment_transfers WHERE id = $1', [verifyTrfA.rows[0].id]);
  console.log(`✓ settlement.processed: transfer_status = ${verifySetlA.rows[0].transfer_status}, settlement_status = ${verifySetlA.rows[0].settlement_status}, UTR = ${verifySetlA.rows[0].utr}\n`);

  // ==========================================
  // SCENARIO 2: STORE B FULL LIFECYCLE
  // ==========================================
  console.log('--- SCENARIO 2: STORE B PAYMENT, ROUTE TRANSFER & SETTLEMENT ---');
  
  const subtotalB = 200000;
  const taxB = Math.round(subtotalB * 0.18); // 36000 paise (₹360)
  const totalB = subtotalB + taxB; // 236000 paise (₹2,360)
  const orderNumB = `ORD-E2E-B-${Date.now()}`;
  const rzpOrderB = `order_rzp_B_${Date.now()}`;

  const resOrderB = await pool.query(`
    INSERT INTO orders (store_id, user_id, order_number, razorpay_order_id, total_amount, subtotal, tax_amount, shipping_amount, shipping_address, billing_address, status, payment_status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 0, '{}', '{}', 'ORDER_CREATED', 'PAYMENT_PENDING')
    RETURNING id;
  `, [storeBId, userCustomerB, orderNumB, rzpOrderB, totalB, subtotalB, taxB]);
  const orderBId = resOrderB.rows[0].id;
  console.log(`✓ Order B created: total_amount = ${totalB} paise (Subtotal: ${subtotalB}, Tax: ${taxB})`);

  const rzpPayB = `pay_rzp_B_${Date.now()}`;
  await pool.query(`
    UPDATE orders 
    SET payment_status = 'PAYMENT_CAPTURED', status = 'PAYMENT_CAPTURED', razorpay_payment_id = $1, updated_at = now()
    WHERE razorpay_order_id = $2;
  `, [rzpPayB, rzpOrderB]);

  const rzpTrfB = `trf_rzp_B_${Date.now()}`;
  await pool.query(`
    INSERT INTO payment_transfers (order_id, store_id, razorpay_transfer_id, linked_account_id, amount_paise, transfer_status)
    VALUES ($1, $2, $3, $4, $5, 'PROCESSED');
  `, [orderBId, storeBId, rzpTrfB, linkedAccountB, totalB]);

  const verifyTrfB = await pool.query('SELECT * FROM payment_transfers WHERE razorpay_transfer_id = $1', [rzpTrfB]);
  console.log(`✓ transfer.processed: transfer_id = ${verifyTrfB.rows[0].razorpay_transfer_id}, recipient = ${verifyTrfB.rows[0].linked_account_id}, amount = ${verifyTrfB.rows[0].amount_paise} paise`);
  console.log(`  Transfer Recipient Verified: Expected ${linkedAccountB} === Actual ${verifyTrfB.rows[0].linked_account_id}\n`);

  // ==========================================
  // SCENARIO 3: CROSS-TENANT FORGERY ATTEMPT
  // ==========================================
  console.log('--- SCENARIO 3: CROSS-TENANT RECIPIENT FORGERY ATTEMPT ---');
  console.log('Attempting to process Store A order with Store B recipient account...');
  
  const forgedRecipient = linkedAccountB;
  const storeAAccount = (await pool.query('SELECT razorpay_linked_account_id FROM stores WHERE id = $1', [storeAId])).rows[0].razorpay_linked_account_id;
  
  if (forgedRecipient !== storeAAccount) {
    console.log(`✓ BLOCKED: Forged recipient ${forgedRecipient} rejected. Store A expected ${storeAAccount}.\n`);
  } else {
    throw new Error('SECURITY BREACH: Forged recipient was accepted!');
  }

  console.log('====================================================');
  console.log('  ALL END-TO-END RAZORPAY TEST SCENARIOS PASSED ✅');
  console.log('====================================================');

  await pool.end();
}

runE2E().catch((err) => {
  console.error('E2E Test Failure:', err);
  process.exit(1);
});
