import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const stripe = stripeSecretKey
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-10-28.acacia" as any })
  : null;

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 500 }
    );
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase admin client is not configured." },
      { status: 500 }
    );
  }

  const { userId } = await request.json().catch(() => ({}));

  if (!userId) {
    return NextResponse.json(
      { error: "Missing user identifier." },
      { status: 400 }
    );
  }

  const { data: settings, error } = await supabaseAdmin
    .from("settings")
    .select("stripe_subscription_id,stripe_customer_id,is_pro")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("[Stripe] Failed to fetch settings for subscription lookup.", error);
    return NextResponse.json(
      { error: "We couldn't find your billing settings." },
      { status: 400 }
    );
  }

  let subscriptionId = settings?.stripe_subscription_id ?? null;

  try {
    if (!subscriptionId && settings?.stripe_customer_id) {
      const subscriptions = await stripe.subscriptions.list({
        customer: settings.stripe_customer_id,
        status: "all",
        limit: 1,
      });
      subscriptionId = subscriptions.data[0]?.id ?? null;
    }

    if (!subscriptionId) {
      const searchResult = await stripe.subscriptions.search({
        query: `metadata['user_id']:'${userId}'`,
        limit: 1,
      });
      subscriptionId = searchResult.data[0]?.id ?? null;
    }

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "No Stripe subscription is linked to this account." },
        { status: 404 }
      );
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id ?? null;

    await supabaseAdmin
      .from("settings")
      .upsert(
        {
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
        },
        { onConflict: "user_id" }
      );

    return NextResponse.json(
      {
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelAt: subscription.cancel_at,
        latestInvoiceUrl:
          typeof subscription.latest_invoice === "string"
            ? null
            : subscription.latest_invoice?.hosted_invoice_url ?? null,
        planNickname:
          subscription.items.data[0]?.price.nickname ??
          subscription.items.data[0]?.price.product,
        amount: subscription.items.data[0]?.price.unit_amount,
        currency: subscription.items.data[0]?.price.currency,
      },
      { status: 200 }
    );
  } catch (stripeError) {
    console.error("[Stripe] Failed to retrieve subscription.", stripeError);
    const message =
      stripeError instanceof Error
        ? stripeError.message
        : "Unable to fetch subscription from Stripe.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
