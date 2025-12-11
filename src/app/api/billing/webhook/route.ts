import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const stripe = stripeSecretKey
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-10-28.acacia" as any })
  : null;

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

const resolveUserIdFromSubscription = async (
  subscription: Stripe.Subscription
): Promise<string | null> => {
  if (subscription.metadata?.user_id) {
    return subscription.metadata.user_id;
  }

  if (!supabaseAdmin) return null;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (customerId) {
    const { data } = await supabaseAdmin
      .from("settings")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .single();
    if (data?.user_id) {
      return data.user_id;
    }
  }

  const { data } = await supabaseAdmin
    .from("settings")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  return data?.user_id ?? null;
};

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    console.error("[Stripe] Missing Stripe credentials for webhook handling.");
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature header." },
      { status: 400 }
    );
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[Stripe] Invalid webhook signature.", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        if (!supabaseAdmin) {
          throw new Error(
            "Supabase admin client is not configured. Set SUPABASE_SERVICE_ROLE_KEY."
          );
        }

        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        if (!userId) {
          console.warn(
            "[Stripe] Checkout completed without user metadata. Skipping upgrade."
          );
          break;
        }

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription && "id" in session.subscription
            ? session.subscription.id
            : null;

        const { error } = await supabaseAdmin
          .from("settings")
          .upsert(
            {
              user_id: userId,
              is_pro: true,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
            },
            { onConflict: "user_id" }
          );

        if (error) {
          throw error;
        }

        console.info(`[Stripe] Upgraded user ${userId} to Pro.`);
        break;
      }
      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        if (!supabaseAdmin) {
          throw new Error(
            "Supabase admin client is not configured. Set SUPABASE_SERVICE_ROLE_KEY."
          );
        }

        const subscription = event.data.object as Stripe.Subscription;
        const userId = await resolveUserIdFromSubscription(subscription);
        if (!userId) {
          console.warn(
            "[Stripe] Subscription event missing user mapping. Skipping update."
          );
          break;
        }

        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id ?? null;

        const isCanceled =
          event.type === "customer.subscription.deleted" ||
          subscription.status === "canceled";
        const shouldEnablePro =
          subscription.status === "active" ||
          subscription.status === "trialing";

        if (isCanceled) {
          await supabaseAdmin
            .from("settings")
            .update({
              is_pro: false,
              stripe_subscription_id: null,
              stripe_customer_id: customerId,
            })
            .eq("user_id", userId);
        } else if (shouldEnablePro) {
          await supabaseAdmin
            .from("settings")
            .update({
              is_pro: true,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: customerId,
            })
            .eq("user_id", userId);
        }

        break;
      }
      default:
        // Ignore other events
        break;
    }
  } catch (error) {
    console.error("[Stripe] Failed to process webhook event.", error);
    return NextResponse.json(
      { error: "Failed to process webhook event." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
