# Authentication API

For the current authentication endpoints, request fields, email verification
flow, token usage, and security notes, see the canonical
[Backend API Documentation](./API_DOCUMENTATION.md#authentication).

To run the backend locally, configure `MONGODB_URL` and a private `JWT_SECRET`
of at least 32 bytes in `.env`, then run `npm run dev`. The server defaults to
port 5000 unless `PORT` is set.
