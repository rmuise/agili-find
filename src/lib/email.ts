import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS = process.env.EMAIL_FROM || "AgiliFind <noreply@agilifind.com>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email via Resend. Falls back to console.log if RESEND_API_KEY is not set.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  if (!resend) {
    console.log(`[Email Stub] To: ${to} | Subject: ${subject}`);
    console.log(html);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[Email Error]", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email Error]", err);
    return false;
  }
}
