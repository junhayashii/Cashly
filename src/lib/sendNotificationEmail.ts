let emailNotificationsUnavailable = false;
let lastNotificationSentAt = 0;

const buildEmailPayload = (
  userEmail: string,
  notification: { title?: string; message: string }
) => ({
  email: userEmail,
  subject: notification.title ?? "Cashly notification alert",
  message: notification.message,
});

export const sendNotificationEmail = async ({
  userId,
  email,
  notificationsEnabled,
  notification,
}: {
  userId: string;
  email?: string | null;
  notificationsEnabled?: boolean;
  notification: { title?: string; message: string };
}): Promise<void> => {
  if (!notificationsEnabled) {
    console.log("[Notifications] Email notifications disabled for user", { userId });
    return;
  }

  if (!email) {
    console.warn("[Notifications] User email missing; skipping notification email.", {
      userId,
    });
    return;
  }



  const now = Date.now();

  try {
    const response = await fetch("/api/notifications/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildEmailPayload(email, notification)),
    });

    const result = (await response.json().catch(() => null)) as
      | {
          success?: boolean;
          error?: string;
          message?: string;
        }
      | null;

    if (response.ok && (result?.success ?? true)) {
      console.log("[Notifications] Email notification dispatched.");
      lastNotificationSentAt = now;
      return;
    }

    const errorMessage =
      (result && (result.error || result.message)) ||
      `HTTP ${response.status}`;

    if (errorMessage.includes("Missing RESEND_API_KEY")) {
      emailNotificationsUnavailable = true;
      console.warn(
        "[Notifications] RESEND_API_KEY is missing; email dispatch disabled for this session.",
        { userId }
      );
      return;
    }

    if (/Too many requests/i.test(errorMessage)) {
      emailNotificationsUnavailable = true;
      console.warn(
        "[Notifications] Resend rate limit hit. Temporarily disabling email dispatch in this session.",
        { userId }
      );
      lastNotificationSentAt = now;
      return;
    }

    if (/domain\s+is\s+not\s+verified/i.test(errorMessage)) {
      emailNotificationsUnavailable = true;
      console.warn(
        "[Notifications] Email domain is not verified with Resend. Update NOTIFICATION_EMAIL_FROM to onboarding@resend.dev or verify your domain.",
        { userId }
      );
      return;
    }

    console.error("[Notifications] Failed to send email notification.", result);
  } catch (error) {
    console.error("[Notifications] Unexpected error sending notification email.", error);
  }
};
