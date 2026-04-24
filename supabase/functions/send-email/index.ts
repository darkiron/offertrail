import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET")!;

const FROM = "OfferTrail <noreply@craftcodes.fr>";
const BRAND_COLOR = "#89b4fa";

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OfferTrail</title>
</head>
<body style="margin:0;padding:0;background:#1e1e2e;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e1e2e;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#181825;border-radius:16px;border:1px solid #313244;padding:40px 36px;">
          <tr>
            <td>
              <div style="margin-bottom:28px;">
                <span style="font-size:20px;font-weight:900;color:#cdd6f4;letter-spacing:-0.04em;">
                  <span style="color:${BRAND_COLOR};">OT</span> OfferTrail
                </span>
              </div>
              ${content}
              <div style="margin-top:36px;padding-top:20px;border-top:1px solid #313244;color:#6c7086;font-size:12px;line-height:1.6;">
                Si tu n'es pas à l'origine de cette demande, ignore simplement cet email.<br/>
                © ${new Date().getFullYear()} OfferTrail — <a href="https://offertrail.fr" style="color:${BRAND_COLOR};text-decoration:none;">offertrail.fr</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(url: string, label: string): string {
  return `<a href="${url}"
    style="display:inline-block;margin-top:24px;padding:14px 28px;
           background:${BRAND_COLOR};color:#1e1e2e;font-weight:800;
           font-size:15px;border-radius:12px;text-decoration:none;
           letter-spacing:-0.01em;">
    ${label}
  </a>`;
}

function buildEmail(actionType: string, confirmUrl: string, tokenHash: string, redirectTo: string, siteUrl: string): { subject: string; html: string } {
  switch (actionType) {
    case "signup":
      return {
        subject: "Confirme ton adresse email — OfferTrail",
        html: baseTemplate(`
          <h2 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#cdd6f4;letter-spacing:-0.03em;">
            Bienvenue sur OfferTrail 👋
          </h2>
          <p style="color:#a6adc8;font-size:15px;line-height:1.6;margin:0 0 8px;">
            Confirme ton adresse email pour activer ton compte et commencer à suivre tes candidatures.
          </p>
          ${ctaButton(confirmUrl, "Confirmer mon email")}
          <p style="color:#6c7086;font-size:13px;margin-top:20px;">
            Ce lien expire dans <strong style="color:#a6adc8;">24h</strong>.
          </p>
        `),
      };

    case "recovery":
      return {
        subject: "Réinitialise ton mot de passe — OfferTrail",
        html: baseTemplate(`
          <h2 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#cdd6f4;letter-spacing:-0.03em;">
            Réinitialisation du mot de passe
          </h2>
          <p style="color:#a6adc8;font-size:15px;line-height:1.6;margin:0 0 8px;">
            Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous.
          </p>
          ${ctaButton(confirmUrl, "Réinitialiser mon mot de passe")}
          <p style="color:#6c7086;font-size:13px;margin-top:20px;">
            Ce lien expire dans <strong style="color:#a6adc8;">1h</strong>.
          </p>
        `),
      };

    case "magiclink":
      return {
        subject: "Ton lien de connexion — OfferTrail",
        html: baseTemplate(`
          <h2 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#cdd6f4;letter-spacing:-0.03em;">
            Connexion sans mot de passe
          </h2>
          <p style="color:#a6adc8;font-size:15px;line-height:1.6;margin:0 0 8px;">
            Clique sur le bouton ci-dessous pour te connecter directement à OfferTrail.
          </p>
          ${ctaButton(confirmUrl, "Se connecter")}
          <p style="color:#6c7086;font-size:13px;margin-top:20px;">
            Ce lien est à usage unique et expire dans <strong style="color:#a6adc8;">1h</strong>.
          </p>
        `),
      };

    case "invite":
      return {
        subject: "Tu es invité sur OfferTrail",
        html: baseTemplate(`
          <h2 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#cdd6f4;letter-spacing:-0.03em;">
            Tu as été invité sur OfferTrail
          </h2>
          <p style="color:#a6adc8;font-size:15px;line-height:1.6;margin:0 0 8px;">
            Clique ci-dessous pour créer ton compte et rejoindre OfferTrail.
          </p>
          ${ctaButton(confirmUrl, "Accepter l'invitation")}
        `),
      };

    case "email_change_current":
    case "email_change_new":
      return {
        subject: "Confirme le changement d'email — OfferTrail",
        html: baseTemplate(`
          <h2 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#cdd6f4;letter-spacing:-0.03em;">
            Changement d'adresse email
          </h2>
          <p style="color:#a6adc8;font-size:15px;line-height:1.6;margin:0 0 8px;">
            Confirme ce changement d'adresse email sur ton compte OfferTrail.
          </p>
          ${ctaButton(confirmUrl, "Confirmer le changement")}
          <p style="color:#6c7086;font-size:13px;margin-top:20px;">
            Ce lien expire dans <strong style="color:#a6adc8;">24h</strong>.
          </p>
        `),
      };

    default:
      return {
        subject: "Action requise — OfferTrail",
        html: baseTemplate(`
          <h2 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#cdd6f4;">Action requise</h2>
          <p style="color:#a6adc8;font-size:15px;line-height:1.6;">
            Une action est requise sur ton compte OfferTrail.
          </p>
          ${ctaButton(confirmUrl, "Accéder à OfferTrail")}
        `),
      };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  // Vérification de signature webhook
  const wh = new Webhook(hookSecret);
  let msg: Record<string, unknown>;
  try {
    msg = wh.verify(payload, headers) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = msg.user as { email: string } | undefined;
  const emailData = msg.email_data as {
    token?: string;
    token_hash?: string;
    redirect_to?: string;
    email_action_type?: string;
    site_url?: string;
  } | undefined;

  if (!user?.email || !emailData?.email_action_type) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { email_action_type, token_hash, redirect_to, site_url } = emailData;
  // site_url from Supabase = "https://<project>.supabase.co/auth/v1" (already includes /auth/v1)
  const authBase = site_url ?? "https://plctgoibhbbmozzagfcm.supabase.co/auth/v1";
  const redirectUrl = redirect_to ?? "https://offertrail.craftcodes.fr/app";
  const confirmUrl = `${authBase}/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirectUrl}`;

  const { subject, html } = buildEmail(
    email_action_type!,
    confirmUrl,
    token_hash ?? "",
    redirectUrl,
    siteUrl,
  );

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Email send failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
