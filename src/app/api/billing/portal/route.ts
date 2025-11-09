import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const defaultAppUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
    .select("stripe_customer_id,stripe_subscription_id")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("[Stripe] Failed to fetch settings for portal session.", error);
    return NextResponse.json(
      { error: "Unable to find your billing profile." },
      { status: 400 }
    );
  }

  let stripeCustomerId = settings?.stripe_customer_id ?? null;
  let stripeSubscriptionId = settings?.stripe_subscription_id ?? null;

  const resolveCustomerFromSubscription = async (
    subscriptionId: string | null
  ) => {
    if (!subscriptionId) return;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    stripeCustomerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id ?? null;
    stripeSubscriptionId = subscription.id;
  };

  const searchSubscriptionByMetadata = async () => {
    const searchResult = await stripe.subscriptions.search({
      query: `metadata['user_id']:'${userId}'`,
      limit: 1,
    });
    const subscription = searchResult.data[0];
    if (subscription) {
      stripeSubscriptionId = subscription.id;
      stripeCustomerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id ?? null;
    }
  };

  const ensureCustomerExists = async () => {
    if (!stripeCustomerId) return;
    try {
      await stripe.customers.retrieve(stripeCustomerId);
    } catch (error) {
      const stripeError = error as Stripe.errors.StripeError & {
        code?: string;
        type?: string;
      };
      const isMissing =
        stripeError?.type === "StripeInvalidRequestError" &&
        stripeError?.code === "resource_missing";
      if (isMissing) {
        stripeCustomerId = null;
      } else {
        throw error;
      }
    }
  };

  try {
    await ensureCustomerExists();

    if (!stripeCustomerId && stripeSubscriptionId) {
      await resolveCustomerFromSubscription(stripeSubscriptionId);
    }

    if (!stripeCustomerId) {
      await searchSubscriptionByMetadata();
    }

    if (stripeCustomerId) {
      await supabaseAdmin
        .from("settings")
        .upsert(
          {
            user_id: userId,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
          },
          { onConflict: ["user_id"] }
        );
    }
  } catch (lookupError) {
    console.error("[Stripe] Failed to recover customer for portal.", lookupError);
  }

  if (!stripeCustomerId) {
    return NextResponse.json(
      {
        error:
          "Unable to locate a Stripe customer for this account. Please contact support so we can help cancel.",
      },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${defaultAppUrl.replace(/\/$/, "")}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (portalError) {
    console.error("[Stripe] Failed to create billing portal session.", portalError);
    const message =
      portalError instanceof Error
        ? portalError.message
        : "Unable to load the billing portal. Please try again.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
