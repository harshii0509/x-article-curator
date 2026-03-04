import { Resend } from "resend";

const FROM_EMAIL = "onboarding@resend.dev";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(apiKey);
}

export async function sendOtpEmail(email: string, code: string) {
  const resend = getResend();

  const subject = "Your Nightstand sign-in code";
  const text = [
    "Use this code to sign in to Nightstand:",
    "",
    code,
    "",
    "This code will expire in 10 minutes.",
  ].join("\n");

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject,
    text,
  });
}

export async function sendTestEmail(to: string) {
  const resend = getResend();

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Hello World",
    html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
  });
}


