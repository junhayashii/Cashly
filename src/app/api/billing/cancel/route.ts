import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-10-28.acacia" })
  : null;

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

export async function POST(request: Request) {
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
    console.error("[Stripe] Failed to fetch settings for cancellation.", error);
    return NextResponse.json(
      { error: "We couldn't find your subscription record." },
      { status: 400 }
    );
  }

  if (!settings?.stripe_subscription_id) {
    return NextResponse.json(
      {
        error:
          "No Stripe subscription is linked to your account. Please contact support.",
      },
      { status: 400 }
    );
  }

  try {
    const subscription = await stripe.subscriptions.update(
      settings.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    await supabaseAdmin
      .from("settings")
      .update({
        stripe_subscription_id: subscription.id,
        stripe_customer_id:
          settings.stripe_customer_id ??
          (typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id),
      })
      .eq("user_id", userId);

    return NextResponse.json(
      {
        cancelled: true,
        subscriptionId: subscription.id,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end,
      },
      { status: 200 }
    );
  } catch (stripeError) {
    console.error("[Stripe] Failed to cancel subscription.", stripeError);
    const message =
      stripeError instanceof Error
        ? stripeError.message
        : "Unable to cancel subscription right now.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
