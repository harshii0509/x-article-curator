import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "Nightstand <onboarding@resend.dev>";

export async function sendWaitlistConfirmation(to: string): Promise<void> {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "You're on the Nightstand waitlist",
    text: waitlistText,
    html: waitlistHtml,
  });

  if (error) {
    // Surface the full Resend error so it appears in server logs
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }

  console.log("[waitlist] email sent, id:", data?.id);
}

// ── Plain-text fallback ────────────────────────────────────────────────────
const waitlistText = `
Nightstand

You're in.

Every week you find articles worth reading. By Saturday they're buried and
forgotten. Nightstand saves them and groups them by week so when you finally
have an hour, your list is already waiting.

No algorithm. No social layer. Just the articles you picked, ready to read.

I'm shipping this soon — you'll be the first to know when it opens.

—
brought to you by Harshvardhan Agarwal
`.trim();

// ── HTML email ─────────────────────────────────────────────────────────────
// Design mirrors the landing page exactly: same palette, same section-label
// pattern (Newsreader-style serif labels + Inter-style sans body), same footer.
// Inline styles only — email clients strip external / <head> CSS.
//
// Design token reference (matches globals.css):
//   #f7f2e8              → ns-bg      (warm cream page background)
//   #ede5d4              → ns-surface (input/card bg → used as hairline divider)
//   #2c1f0e              → ns-ink     (dark brown primary text)
//   rgba(44,31,14,0.4)   → ns-ink/40  (muted footer text)
//   #c9956a              → ns-accent  (terracotta wordmark + links)
//
const waitlistHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>You're on the Nightstand waitlist</title>
</head>
<body style="margin:0;padding:0;background:#f7f2e8;">
  <!--[if mso]><table width="100%"><tr><td><![endif]-->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:#f7f2e8;min-height:100vh;">
    <tr>
      <td align="left" style="padding:80px 80px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:540px;">

          <!-- Wordmark — mirrors the "Nightstand" section label on the landing page:
               Georgia ≈ Newsreader, 14px, #c9956a terracotta, tracking 0.28px -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0;
                         font-family:Georgia,'Times New Roman',serif;
                         font-size:14px;font-weight:500;
                         color:#c9956a;
                         letter-spacing:0.28px;line-height:1.2;">
                Nightstand
              </p>
            </td>
          </tr>

          <!-- Hairline divider — ns-surface colour, same as input backgrounds -->
          <tr>
            <td style="padding-bottom:32px;">
              <div style="height:1px;background:#ede5d4;"></div>
            </td>
          </tr>

          <!-- Section: "You're in." — mirrors the "Nightstand" section on the page:
               Georgia label + Helvetica Neue body, 8px gap, same weights/sizes -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 8px;
                         font-family:Georgia,'Times New Roman',serif;
                         font-size:14px;font-weight:500;
                         color:#2c1f0e;
                         letter-spacing:0.28px;line-height:1.2;">
                You're in.
              </p>
              <p style="margin:0;
                         font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;
                         font-size:13px;font-weight:400;
                         color:#2c1f0e;
                         letter-spacing:-0.1px;line-height:1.5;">
                I'm shipping this soon. No more bookmarks you'll never open. Finally :)
              </p>
            </td>
          </tr>

          <!-- Section: "About" — mirrors the About section on the landing page verbatim -->
          <tr>
            <td style="padding-bottom:40px;">
              <p style="margin:0 0 8px;
                         font-family:Georgia,'Times New Roman',serif;
                         font-size:14px;font-weight:500;
                         color:#2c1f0e;
                         letter-spacing:0.28px;line-height:1.2;">
                About
              </p>
              <p style="margin:0;
                         font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;
                         font-size:13px;font-weight:400;
                         color:#2c1f0e;
                         letter-spacing:-0.1px;line-height:1.5;">
                Every week you find articles worth reading. By Saturday
                they're buried and forgotten. Nightstand saves them and
                groups them by week so when you finally have an hour,
                your list is already waiting.
              </p>
            </td>
          </tr>

          <!-- Hairline divider before footer -->
          <tr>
            <td style="padding-bottom:24px;">
              <div style="height:1px;background:#ede5d4;"></div>
            </td>
          </tr>

          <!-- Footer — mirrors landing page footer exactly:
               "brought to you by Harshvardhan Agarwal" left + "©2026" right,
               both in ns-ink/40 muted text -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;
                              font-size:13px;font-weight:400;
                              color:rgba(44,31,14,0.4);
                              letter-spacing:-0.1px;line-height:1.2;">
                    brought to you by&nbsp;<a
                      href="https://x.com/harshii04"
                      style="color:rgba(44,31,14,0.4);text-decoration:none;"
                    >Harshvardhan Agarwal</a>
                  </td>
                  <td align="right"
                      style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;
                             font-size:13px;font-weight:400;
                             color:rgba(44,31,14,0.4);
                             letter-spacing:-0.1px;line-height:1.2;">
                    ©2026
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
  <!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`;
