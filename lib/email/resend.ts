type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type SendEmailResult =
  | { sent: true; id: string }
  | { sent: false; reason: string };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return {
      sent: false,
      reason: "Email provider is not configured. Set RESEND_API_KEY and EMAIL_FROM."
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text
      }),
      signal: AbortSignal.timeout(7000)
    });
    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };

    if (!response.ok || !payload.id) {
      return {
        sent: false,
        reason: payload.message ?? `Email provider returned HTTP ${response.status}.`
      };
    }

    return { sent: true, id: payload.id };
  } catch {
    return {
      sent: false,
      reason: "Email provider request failed or timed out."
    };
  }
}
