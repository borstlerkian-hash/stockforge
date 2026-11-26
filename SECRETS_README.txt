Secrets (.env files) are NOT included.
backend/.env needs: MONGO_URL, DB_NAME, CORS_ORIGINS, CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY,
EMERGENT_LLM_KEY, ADMIN_CODE, ADMIN_PASSPHRASE, ADMIN_EMAIL
Optional card payments: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
Optional funding providers:
  PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENV (sandbox/live), PAYPAL_WEBHOOK_ID
  SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, SQUARE_ENV (sandbox/production), SQUARE_WEBHOOK_SIGNATURE_KEY
Bitcoin uses the receiving address set in Admin → Bitcoin wallet.
Bank transfer is configured in Admin → Wallet funding.
frontend/.env needs: REACT_APP_BACKEND_URL
