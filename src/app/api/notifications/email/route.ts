import { NextRequest, NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM =
  process.env.NOTIFICATION_EMAIL_FROM ?? "Cashly Notifications <onboarding@resend.dev>";

type EmailPayload = {
  email: string;
  subject?: string;
  message?: string;
};

export async function POST(request: NextRequest) {
  if (!RESEND_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Missing RESEND_API_KEY environment variable. Set it to enable notification emails.",
      },
      { status: 200 }
    );
  }

  const body = (await request.json().catch(() => null)) as EmailPayload | null;
  if (!body?.email || typeof body.email !== "string") {
    return NextResponse.json(
      { error: "Request body must include a valid 'email' field." },
      { status: 400 }
    );
  }

  const subject =
    typeof body.subject === "string" && body.subject.trim().length > 0
      ? body.subject.trim()
      : "Cashly notifications enabled";
  const message =
    typeof body.message === "string" && body.message.trim().length > 0
      ? body.message.trim()
      : "You turned on email notifications in Cashly. We'll keep you posted about important updates.";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [body.email],
        subject,
        text: message,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      console.error("[Notifications] Resend API error.", errorBody);
      const errorMessage =
        (errorBody && (errorBody.error || errorBody.message)) ??
        "Failed to dispatch notification email.";
      return NextResponse.json({ success: false, error: errorMessage }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Notifications] An unexpected error occurred while sending email.", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notification email." },
      { status: 500 }
    );
  }
}
