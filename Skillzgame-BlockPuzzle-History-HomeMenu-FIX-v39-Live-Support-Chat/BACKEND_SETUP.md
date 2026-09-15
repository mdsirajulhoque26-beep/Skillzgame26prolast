# Skillzgame — MongoDB + Vercel setup

This build keeps the existing game screens and Admin Panel, but makes the important account, wallet, request, match and admin actions server-authoritative through the `/api` backend.

## Required Vercel Environment Variables

Set these in **Vercel → Project → Settings → Environment Variables** for Production (and Preview if you test there):

- `MONGODB_URI` — your MongoDB Atlas connection string
- `ADMIN_PHONE` — the admin login phone number
- `ADMIN_PASSWORD` — the admin login password
- `TOKEN_SECRET` — a long random secret (at least 32 random characters is recommended)

## Optional

- `MONGODB_DB` — defaults to `skillzgame`
- `MONGODB_COLLECTION` — defaults to `app_state`
- `VITE_API_BASE_URL` — normally leave unset; production uses same-origin `/api`

## Admin Panel

The Admin Panel can:

- See registered users stored in MongoDB
- Ban/unban users
- Reset a user's password
- Add/deduct gaming or winning balance
- See and approve/reject deposit requests
- See and approve/reject withdrawal requests (rejection refunds winning balance)
- See and approve/reject result submissions
- Create matches, set Room ID, cancel/refund matches and delete unjoined matches
- Edit payment/support settings and notices

## Online Matchmaking

The match lobby is backed by MongoDB. Joining a match is performed by the server: the entry fee is deducted on the server, the player is added to the match, and the updated match state is returned. The frontend polls the lobby so users on different devices can see updated seats/status.

## Important security notes

- Admin credentials are no longer hardcoded into the frontend.
- Passwords are stored as scrypt hashes, never plaintext.
- Wallet balances and deposit/withdraw/result approval actions are persisted through the backend instead of relying on browser localStorage.
- Do not commit `.env` files or MongoDB credentials to GitHub.

## Deployment

After uploading this project to Vercel, set the four required environment variables, then redeploy. Test `/api/health` and log in using the `ADMIN_PHONE` / `ADMIN_PASSWORD` values you configured in Vercel.


## Deposit Transaction ID protection
- Deposit TrxID is normalized (spaces removed, uppercase) and checked server-side.
- A TrxID is globally single-use: once submitted, it cannot be submitted again even if the earlier request was rejected.
- The check is performed under the MongoDB state lock to prevent two simultaneous requests from using the same TrxID.
- This prevents reuse/duplication, but it cannot independently prove that a TrxID is genuinely issued by bKash/Nagad/Rocket/Upay. Provider-level authenticity requires the relevant payment-provider verification API or manual admin verification.
