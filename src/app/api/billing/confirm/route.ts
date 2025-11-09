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
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
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

  const { sessionId } = await request.json().catch(() => ({}));
  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing Stripe session id." },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Checkout session is not paid yet." },
        { status: 400 }
      );
    }

    const userId = session.metadata?.user_id;
    if (!userId) {
      return NextResponse.json(
        { error: "Checkout session is missing user metadata." },
        { status: 400 }
      );
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
        { onConflict: ["user_id"] }
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({ upgraded: true }, { status: 200 });
  } catch (error) {
    console.error("[Stripe] Failed to confirm checkout session.", error);
    return NextResponse.json(
      { error: "Failed to confirm checkout session." },
      { status: 500 }
    );
  }
}
