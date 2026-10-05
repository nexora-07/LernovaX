# Authentication API

## Run locally

From this directory, install dependencies and run the automated tests:

```powershell
npm ci
npm test
```

For signup and login requests, configure a reachable `MONGODB_URL` and a private `JWT_SECRET` containing at least 32 random bytes in `.env`, then start the API. Keep `.env` out of Git. Behind exactly one trusted reverse proxy, set `TRUST_PROXY=1` so per-IP auth limits use the client address; do not trust arbitrary forwarded headers.

```powershell
npm run dev
```

The API listens on port `5000` by default.

## Try the endpoints

Create an account. The server always assigns new accounts the `student` role; a `role` sent by the client is ignored.

```powershell
$signup = Invoke-RestMethod -Method Post `
  -Uri http://localhost:5000/api/v1/auth/signup `
  -ContentType 'application/json' `
  -Body '{"firstname":"Ada","lastname":"Lovelace","email":"ada@example.com","password":"learning123"}'
$token = $signup.data.token
```

Sign in with the same account:

```powershell
$login = Invoke-RestMethod -Method Post `
  -Uri http://localhost:5000/api/v1/auth/login `
  -ContentType 'application/json' `
  -Body '{"email":"ada@example.com","password":"learning123"}'
$token = $login.data.token
```

Use the returned token to get the current account:

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/v1/auth/me `
  -Headers @{ Authorization = "Bearer $token" }
```

`/me` returns `401` without a valid token. Protected routes can use `restrictTo("admin")` to return `403` when a signed-in account lacks the required role. Never promote an account based on a role value supplied during public signup.

The automated middleware tests cover missing and invalid tokens, deleted accounts, unauthenticated requests, forbidden roles, and allowed roles. The integration smoke test checks the running Express routes and configured CORS origin without requiring MongoDB.