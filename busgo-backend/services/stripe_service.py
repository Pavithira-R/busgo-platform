import stripe
from config import get_settings

settings = get_settings()
stripe.api_key = settings.stripe_secret_key

async def create_payment_intent(amount_cents: int, metadata: dict) -> dict:
    try:
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="lkr",
            metadata=metadata,
            automatic_payment_methods={"enabled": True},
        )
        return {"client_secret": intent.client_secret, "payment_intent_id": intent.id}
    except stripe.error.StripeError as e:
        raise Exception(f"Stripe error: {str(e)}")

async def refund_payment(payment_intent_id: str) -> dict:
    try:
        refund = stripe.Refund.create(payment_intent=payment_intent_id)
        return {"refund_id": refund.id, "status": refund.status}
    except stripe.error.StripeError as e:
        raise Exception(f"Stripe refund error: {str(e)}")

def verify_webhook(payload: bytes, sig_header: str) -> dict:
    try:
        return stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        raise Exception(f"Webhook error: {str(e)}")
