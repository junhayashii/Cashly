import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const priceId = process.env.STRIPE_PRICE_ID;
const defaultAppUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiVersion: "2024-10-28.acacia" as any,
    })
  : null;

export async function POST(request: Request) {
  if (!stripe || !priceId) {
    return NextResponse.json(
      {
        error:
          "Stripe environment variables are missing. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID.",
      },
      { status: 500 }
    );
  }

  try {
    const { customerEmail, successUrl, cancelUrl, userId } = await request
      .json()
      .catch(() => ({}));

    if (!userId) {
      return NextResponse.json(
        { error: "Missing user identifier for checkout session." },
        { status: 400 }
      );
    }

    const origin =
      request.headers.get("origin") ??
      request.headers.get("referer") ??
      defaultAppUrl;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          user_id: userId,
        },
      },
      success_url:
        successUrl ??
        `${origin.replace(
          /\/$/,
          ""
        )}/settings?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancelUrl ?? `${origin.replace(/\/$/, "")}/settings?upgrade=cancelled`,
      customer_email: customerEmail ?? undefined,
      metadata: {
        product: "cashly-pro",
        user_id: userId,
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error("[Stripe] Failed to create checkout session", error);
    return NextResponse.json(
      { error: "Failed to create Stripe checkout session" },
      { status: 500 }
    );
  }
}
