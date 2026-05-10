"""Tests pour src/services/stripe_service.py — couverture complète."""
import os
from unittest.mock import MagicMock, patch

import stripe

from src.services.stripe_service import (
    create_checkout_session,
    is_configured,
    verify_webhook_signature,
)


# ── is_configured ─────────────────────────────────────────────────────────────

def test_is_configured_no_keys(monkeypatch):
    monkeypatch.delenv("STRIPE_SECRET_KEY", raising=False)
    monkeypatch.delenv("STRIPE_PRICE_ID", raising=False)
    monkeypatch.delenv("ENABLE_STRIPE_CHECKOUT", raising=False)
    monkeypatch.setenv("APP_BASE_URL", "http://localhost:5173")
    assert is_configured() is False


def test_is_configured_localhost_without_enable_flag(monkeypatch):
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_xxx")
    monkeypatch.setenv("STRIPE_PRICE_ID", "price_xxx")
    monkeypatch.setenv("APP_BASE_URL", "http://localhost:5173")
    monkeypatch.delenv("ENABLE_STRIPE_CHECKOUT", raising=False)
    with patch("src.services.stripe_service.ENABLE_STRIPE_CHECKOUT", None), \
         patch("src.services.stripe_service.APP_BASE_URL", "http://localhost:5173"):
        assert is_configured() is False


def test_is_configured_production_with_valid_keys(monkeypatch):
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_live_xxx")
    monkeypatch.setenv("STRIPE_PRICE_ID", "price_xxx123")
    monkeypatch.setenv("APP_BASE_URL", "https://app.offertrail.com")
    monkeypatch.delenv("ENABLE_STRIPE_CHECKOUT", raising=False)
    assert is_configured() is True


def test_is_configured_production_no_price(monkeypatch):
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_live_xxx")
    monkeypatch.setenv("STRIPE_PRICE_ID", "prod_xxx")
    monkeypatch.setenv("APP_BASE_URL", "https://app.offertrail.com")
    monkeypatch.delenv("ENABLE_STRIPE_CHECKOUT", raising=False)
    assert is_configured() is False


def test_is_configured_enable_flag_true_valid(monkeypatch):
    monkeypatch.setenv("ENABLE_STRIPE_CHECKOUT", "1")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_xxx")
    monkeypatch.setenv("STRIPE_PRICE_ID", "price_xxx123")
    assert is_configured() is True


def test_is_configured_enable_flag_true_invalid_price(monkeypatch, caplog):
    monkeypatch.setenv("ENABLE_STRIPE_CHECKOUT", "true")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_xxx")
    monkeypatch.setenv("STRIPE_PRICE_ID", "prod_not_a_price")
    import logging
    with caplog.at_level(logging.WARNING, logger="src.services.stripe_service"):
        result = is_configured()
    assert result is False


def test_is_configured_enable_flag_false(monkeypatch):
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_live_xxx")
    monkeypatch.setenv("STRIPE_PRICE_ID", "price_xxx")
    with patch("src.services.stripe_service.ENABLE_STRIPE_CHECKOUT", "false"):
        assert is_configured() is False


def test_is_configured_enable_flag_zero(monkeypatch):
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_live_xxx")
    monkeypatch.setenv("STRIPE_PRICE_ID", "price_xxx")
    with patch("src.services.stripe_service.ENABLE_STRIPE_CHECKOUT", "0"):
        assert is_configured() is False


def test_is_configured_127_0_0_1(monkeypatch):
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_live_xxx")
    monkeypatch.setenv("STRIPE_PRICE_ID", "price_xxx123")
    monkeypatch.setenv("APP_BASE_URL", "http://127.0.0.1:8000")
    monkeypatch.delenv("ENABLE_STRIPE_CHECKOUT", raising=False)
    with patch("src.services.stripe_service.ENABLE_STRIPE_CHECKOUT", None), \
         patch("src.services.stripe_service.APP_BASE_URL", "http://127.0.0.1:8000"):
        assert is_configured() is False


# ── create_checkout_session ───────────────────────────────────────────────────

def test_create_checkout_session_with_customer_id():
    mock_session = MagicMock()
    mock_session.url = "https://checkout.stripe.com/pay/cs_test"
    with patch("stripe.checkout.Session.create", return_value=mock_session) as mock_create:
        url = create_checkout_session("user-1", "test@example.com", stripe_customer_id="cus_123")
    assert url == "https://checkout.stripe.com/pay/cs_test"
    kwargs = mock_create.call_args.kwargs
    assert kwargs.get("customer") == "cus_123"
    assert "customer_email" not in kwargs


def test_create_checkout_session_without_customer_id():
    mock_session = MagicMock()
    mock_session.url = "https://checkout.stripe.com/pay/cs_test2"
    with patch("stripe.checkout.Session.create", return_value=mock_session) as mock_create:
        url = create_checkout_session("user-1", "test@example.com")
    assert url == "https://checkout.stripe.com/pay/cs_test2"
    kwargs = mock_create.call_args.kwargs
    assert kwargs.get("customer_email") == "test@example.com"
    assert "customer" not in kwargs


# ── verify_webhook_signature ──────────────────────────────────────────────────

def test_verify_webhook_signature_valid():
    mock_event = {"type": "checkout.session.completed", "data": {}}
    with patch("stripe.Webhook.construct_event", return_value=mock_event) as mock_construct:
        result = verify_webhook_signature(b"payload", "sig_header")
    assert result == mock_event
    mock_construct.assert_called_once()


def test_verify_webhook_signature_invalid():
    with patch(
        "stripe.Webhook.construct_event",
        side_effect=stripe.error.SignatureVerificationError("bad sig", "sig_header"),
    ):
        try:
            verify_webhook_signature(b"payload", "bad_sig")
            assert False, "Should have raised"
        except stripe.error.SignatureVerificationError:
            pass
