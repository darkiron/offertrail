import logging
import os

import resend

resend.api_key = os.getenv("RESEND_API_KEY", "")

logger = logging.getLogger(__name__)


def send_password_reset(to_email: str, reset_url: str) -> bool:
    """
    En local sans RESEND_API_KEY : journalise le lien de reset.
    En prod : envoie l'email via Resend.
    """
    if not resend.api_key:
        logger.info("Password reset simulated for %s: %s", to_email, reset_url)
        return True

    try:
        resend.Emails.send(
            {
                "from": "OfferTrail <noreply@offertrail.fr>",
                "to": [to_email],
                "subject": "Reinitialisation de ton mot de passe OfferTrail",
                "html": f"""
                    <h2>Reinitialisation de mot de passe</h2>
                    <p>Tu as demande a reinitialiser ton mot de passe.</p>
                    <p>
                        <a href="{reset_url}"
                           style="background:#3B8BD4;color:white;padding:12px 24px;
                                  text-decoration:none;border-radius:6px;">
                            Reinitialiser mon mot de passe
                        </a>
                    </p>
                    <p style="color:#999;font-size:12px;">
                        Ce lien expire dans 1 heure.<br>
                        Si tu n'as pas demande cette reinitialisation, ignore cet email.
                    </p>
                """,
            }
        )
        return True
    except Exception:
        logger.exception("Password reset email failed")
        return False
