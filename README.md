# Notification Panel

React admin panel for Elara notification management, connected to the Nest backend.

## Stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Run locally

```sh
cd notification-panel
npm install
npm run dev
```

By default, the frontend calls:

`http://localhost:6900/api/v2`

To override, create `notification-panel/.env`:

```sh
VITE_API_BASE_URL=http://localhost:6900/api/v2
VITE_FIREBASE_VAPID_KEY=your_web_push_vapid_public_key
```

`VITE_FIREBASE_VAPID_KEY` is required for the `Get Web FCM Token` button in `Device Tokens` page.

## Backend prerequisites

1. Start backend at `http://localhost:6900`.
2. Ensure Redis and Mongo are available.
3. Ensure Firebase Admin is configured in backend (`FIREBASE_CREDENTIALS_PATH` or key env vars).

## Login

Use an admin account in the panel login screen.

- Endpoint used: `POST /api/auth/login` (see `backend-admin` `AuthController`)
- Seed one if needed (from backend repo):

```sh
ADMIN_EMAIL='admin@test.com' ADMIN_PASSWORD='AdminPass12345!' \
npx ts-node -r tsconfig-paths/register src/scripts/seed-admin.ts
```

## Web delivery test flow (real push)

1. Sign in to this panel with an admin account.
2. Go to `Device Tokens` page.
3. Register a real browser FCM token for the logged-in admin user.
4. Copy the logged-in admin user ID shown on that page.
5. Go to `Notifications -> Create`.
6. Choose platform `web`.
7. Set target type to `specific_users` and paste the copied user ID.
8. Send now.
9. Open notification detail and verify delivery stats/logs.

## How to get a real browser FCM token

1. In Firebase console, enable Cloud Messaging and create/get VAPID public key.
2. In your web app, initialize Firebase Messaging and call `getToken(...)`.
3. Use the returned token in `Device Tokens` page.

Important: placeholder tokens (for example `fcm_test_token_...` or `fcm_token_abc123xyz`) are invalid and will fail with `messaging/invalid-argument`.
