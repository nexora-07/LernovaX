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

Student accounts sign up and log in using the existing `/signup` and `/login` endpoints. Signup requires `confirmPassword`; any `role` sent by the client is ignored.

```powershell
$signup = Invoke-RestMethod -Method Post `
  -Uri http://localhost:5000/api/v1/auth/signup `
  -ContentType 'application/json' `
  -Body '{"firstname":"Ada","lastname":"Lovelace","email":"ada@example.com","password":"learning123","confirmPassword":"learning123"}'
$token = $signup.data.token
```

Instructor and admin accounts use separate signup and login endpoints. Configure private `INSTRUCTOR_SIGNUP_CODE` and `ADMIN_SIGNUP_CODE` values of at least 32 random bytes in `.env`. Deliver the applicable signup code to authorized staff through a trusted channel; never embed it in frontend code. Each staff member also has a unique personal ID, required at signup and login.

```powershell
$instructor = Invoke-RestMethod -Method Post `
  -Uri http://localhost:5000/api/v1/auth/signup/instructor `
  -ContentType 'application/json' `
  -Body '{"firstname":"Grace","lastname":"Hopper","email":"grace@example.com","password":"learning123","confirmPassword":"learning123","instructorId":"INS-1001","signupCode":"<INSTRUCTOR_SIGNUP_CODE>"}'
```

Student sign-in uses email and password:

```powershell
$login = Invoke-RestMethod -Method Post `
  -Uri http://localhost:5000/api/v1/auth/login `
  -ContentType 'application/json' `
  -Body '{"email":"ada@example.com","password":"learning123"}'
$token = $login.data.token
```

Instructor sign-in requires the registered Instructor ID as well:

```powershell
$login = Invoke-RestMethod -Method Post `
  -Uri http://localhost:5000/api/v1/auth/login/instructor `
  -ContentType 'application/json' `
  -Body '{"instructorId":"INS-1001","email":"grace@example.com","password":"learning123"}'
```

Admin signup and login use `/signup/admin` and `/login/admin`, with `adminId` and the configured `ADMIN_SIGNUP_CODE` on signup.

Use the returned token to get the current account:

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/v1/auth/me `
  -Headers @{ Authorization = "Bearer $token" }
```

`/me` returns `401` without a valid token. Protected routes can use `restrictTo("admin")` to return `403` when a signed-in account lacks the required role. Never promote an account based on a role value supplied during public signup.

The automated middleware tests cover missing and invalid tokens, deleted accounts, unauthenticated requests, forbidden roles, and allowed roles. The integration smoke test checks the running Express routes and configured CORS origin without requiring MongoDB.