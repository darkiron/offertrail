import os

import stripe

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:5173")
LAUNCH_TRIAL_DAYS = int(os.getenv("STRIPE_LAUNCH_TRIAL_DAYS", "0"))

PRICE_MAP = {
    "pro_monthly": os.getenv("STRIPE_PRICE_PRO_MONTHLY", ""),
    "pro_yearly": os.getenv("STRIPE_PRICE_PRO_YEARLY", ""),
    "ultimate_monthly": os.getenv("STRIPE_PRICE_ULTIMATE_MONTHLY", ""),
    "ultimate_yearly": os.getenv("STRIPE_PRICE_ULTIMATE_YEARLY", ""),
}


def create_checkout_session(
    user_id: str,
    user_email: str,
    plan: str,
    period: str,
    coupon_id: str | None = None,
) -> str:
    price_key = f"{plan}_{period}"
    price_id = PRICE_MAP.get(price_key)
    if not price_id:
        raise ValueError(f"Prix inconnu : {price_key}")

    params = {
        "line_items": [{"price": price_id, "quantity": 1}],
        "mode": "subscription",
        "integration_identifier": "offertrail_qzmpvnak",
        "customer_email": user_email,
        "success_url": f"{APP_BASE_URL}/app/mon-compte?payment=success",
        "cancel_url": f"{APP_BASE_URL}/app/pricing?payment=cancelled",
        "metadata": {"user_id": user_id, "plan": plan, "period": period},
        "subscription_data": {
            "metadata": {"user_id": user_id, "plan": plan, "period": period},
        },
        "consent_collection": {"terms_of_service": "required"},
    }

    if LAUNCH_TRIAL_DAYS > 0:
        params["subscription_data"]["trial_period_days"] = LAUNCH_TRIAL_DAYS

    if coupon_id:
        params["discounts"] = [{"coupon": coupon_id}]

    session = stripe.checkout.Session.create(**params)
    return session.url


def verify_webhook(payload: bytes, sig: str) -> stripe.Event:
    return stripe.Webhook.construct_event(payload, sig, WEBHOOK_SECRET)


def is_configured() -> bool:
    return bool(os.getenv("STRIPE_SECRET_KEY")) and bool(WEBHOOK_SECRET) and all(PRICE_MAP.values())
