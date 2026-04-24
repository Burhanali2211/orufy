import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hmacSha256(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID")!;
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const razorpayWebhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") || razorpayKeySecret;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Create Order Action
    if (action === "create-order") {
      const { amount, currency = "INR", receipt, notes } = await req.json();
      
      const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency,
          receipt,
          notes,
        }),
      });

      const order = await res.json();
      return new Response(JSON.stringify({ success: true, data: order }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 2. Verify Payment Action
    if (action === "verify-payment") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = await req.json();

      const expectedSignature = await hmacSha256(
        `${razorpay_order_id}|${razorpay_payment_id}`,
        razorpayKeySecret
      );

      if (expectedSignature !== razorpay_signature) {
        return new Response(JSON.stringify({ success: false, error: "Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Update order in database
      if (order_id) {
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            razorpay_payment_id,
            razorpay_order_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order_id);

        if (updateError) {
          console.error("Error updating order:", updateError);
        }
      }

      return new Response(JSON.stringify({ success: true, message: "Payment verified" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 3. Webhook Handling (default action or specific)
    if (req.method === "POST" && !action) {
      const signature = req.headers.get("x-razorpay-signature");
      const rawBody = await req.text();
      
      const expectedSignature = await hmacSha256(rawBody, razorpayWebhookSecret);

      if (expectedSignature !== signature) {
        console.error("Invalid webhook signature");
        return new Response(JSON.stringify({ success: false, error: "Invalid signature" }), {
          status: 400,
        });
      }

      const payload = JSON.parse(rawBody);
      const event = payload.event;

      console.log("Razorpay Webhook Event:", event);

      if (event === "payment.captured" || event === "order.paid") {
        const payment = payload.payload.payment.entity;
        const razorpayOrderId = payment.order_id;
        
        // Update order status in DB
        const { error: updateError } = await supabase
          .from("orders")
          .update({ payment_status: "paid" })
          .eq("razorpay_order_id", razorpayOrderId);

        if (updateError) console.error("Webhook update error:", updateError);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
