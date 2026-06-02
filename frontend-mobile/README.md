# Investment Management — Mobile (Expo)

React Native client with feature parity to `frontend-web`.

## Setup

```bash
npm install
npm start
```

Scan the QR code with Expo Go (Android/iOS).

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | `http://localhost:5000` | Backend API (use LAN IP on device) |
| `EXPO_PUBLIC_HUB_URL` | `{API}/hubs/investment` | SignalR hub |
| `EXPO_PUBLIC_IS_TESTING` | `false` | Show `[DEBUG] Bypass Payment` |

Example `.env` (create locally):

```
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:5000
EXPO_PUBLIC_IS_TESTING=true
```

## Screens

- Login / Register (Investor or Company)
- Investor — campaigns, share calculator, bookings, notification badge
- Company — create campaign + payment
- Admin — approve pending companies
