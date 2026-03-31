import os

import resend

resend.api_key = os.getenv("RESEND_API_KEY", "")


def send_password_reset(to_email: str, reset_url: str) -> bool:
    """
    En local sans RESEND_API_KEY : affiche le lien dans la console.
    En prod : envoie l'email via Resend.
    """
    if not resend.api_key:
        print(f"\n{'=' * 50}")
        print(f"[RESET PASSWORD] Email simulé -> {to_email}")
        print(f"[RESET PASSWORD] Lien : {reset_url}")
        print(f"{'=' * 50}\n")
        return True

    try:
        resend.Emails.send(
            {
                "from": "OfferTrail <noreply@offertrail.fr>",
                "to": [to_email],
                "subject": "Réinitialisation de ton mot de passe OfferTrail",
                "html": f"""
                    <h2>Réinitialisation de mot de passe</h2>
                    <p>Tu as demandé à réinitialiser ton mot de passe.</p>
                    <p>
                        <a href="{reset_url}"
                           style="background:#3B8BD4;color:white;padding:12px 24px;
                                  text-decoration:none;border-radius:6px;">
                            Réinitialiser mon mot de passe
                        </a>
                    </p>
                    <p style="color:#999;font-size:12px;">
                        Ce lien expire dans 1 heure.<br>
                        Si tu n'as pas demandé cette réinitialisation, ignore cet email.
                    </p>
                """,
            }
        )
        return True
    except Exception as exc:
        print(f"[EMAIL ERROR] {exc}")
        return False
