# Investment Management System — Master Development Plan

Complete phased blueprint for the Investment Management System: .NET 10 Web API monolith, PostgreSQL 16+, React (Vite) web, React Native (Expo) mobile, Docker Compose orchestration.

---

## Technical stack

| Layer | Technology |
|-------|------------|
| Backend | .NET 10, EF Core 10, ASP.NET Core SignalR, Quartz.NET or `IHostedService` |
| Database | PostgreSQL 16+ |
| Web | React (Vite), TailwindCSS, Redux Toolkit or Zustand, `@microsoft/signalr` |
| Mobile | React Native (Expo), NativeWind, `@microsoft/signalr` |
| Containers | Docker Compose |
| Testing bypass | `FeatureManagement:UseMockPayment` = `true` / `false` |

---

## Repository layout

```text
investment_management_system/
├── MASTER_PLAN.md              # This file
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── InvestmentManagement.slnx
│   └── src/InvestmentManagement.Api/
└── frontend-web/               # Phase 6 expands
    └── (frontend-mobile/ in Phase 6)
```

---

## Domain model (reference)

### User
`Id`, `Email`, `PasswordHash`, `Role` (`Admin` | `Company` | `Investor`), `BKashNumber` (admin receiving number)

### CompanyProfile
`Id`, `UserId`, `DocumentationUrl`, `ApprovalStatus` (`Pending` | `Approved` | `Rejected`)

### Campaign
`Id`, `CompanyId` → `CompanyProfile.Id`, `TotalShares`, `AvailableShares`, `PricePerShare`, `MinInvestmentThreshold`, `PaymentStatus` (`Pending` | `Paid`), `BKashTransactionId`, `IsActive`

### Booking
`Id`, `InvestorId`, `CampaignId`, `ReservedShares`, `TotalPrice`, `Status` (`PreBooked` | `Contacted` | `Confirmed` | `Cancelled` | `Returned` in Phase 4), `CreatedAt`, `UpdatedAt`

### Notification (Phase 5)
`Id`, `UserId`, `Message`, `IsRead`, `CreatedAt`

---

## Phase 1: Docker orchestration and DB schema — COMPLETE

**Goal:** Runnable stack + EF Code-First schema + admin seed.

**Deliverables:**
- [x] `docker-compose.yml`: `db`, `backend` (:5000), `frontend-web` (:3000)
- [x] EF entities, configurations, `InitialCreate` migration
- [x] Admin seed: `admin@investment.local` / `Admin@12345`
- [x] `GET /health`, auto-migrate on startup

**Verification:**
```bash
docker compose up --build
curl http://localhost:5000/health
echo 'SELECT "Email", "Role" FROM "Users";' | docker compose exec -T db psql -U ims_user -d investment_management
```

---

## Phase 2: Core backend engine and authentication — COMPLETE

**Goal:** JWT auth, role-based registration, admin company approval and profile APIs.

### Authentication
- JWT bearer authentication (`Jwt` section in `appsettings`)
- `POST /api/auth/login` — email + password → access token
- `POST /api/auth/register/investor` — active immediately (`UserRole.Investor`)
- `POST /api/auth/register/company` — requires `documentationUrl`; creates `CompanyProfile` with `ApprovalStatus.Pending`

### Authorization policies
- `Admin` — admin endpoints only
- `Company` — company-scoped actions (Phase 4+)
- `Investor` — investor-scoped actions (Phase 4+)

### Admin endpoints (Admin role required)
| Method | Route | Description |
|--------|-------|-------------|
| `PUT` | `/api/admin/profile` | Update admin email, password (optional), system `BKashNumber` |
| `GET` | `/api/admin/companies/pending` | List companies with `ApprovalStatus.Pending` |
| `POST` | `/api/admin/companies/{id}/approve` | Body: `{ "approve": true }` or `{ "approve": false }` → `Approved` / `Rejected` |

### Configuration
```json
"Jwt": {
  "Issuer": "InvestmentManagement",
  "Audience": "InvestmentManagement",
  "SecretKey": "<32+ chars>",
  "ExpirationMinutes": 60
}
```

### Seed admin (unchanged)
| Email | Password |
|-------|----------|
| `admin@investment.local` | `Admin@12345` |

**Verification:**
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@investment.local","password":"Admin@12345"}'

# Register investor / company, then admin approve company
```

---

## Phase 3: Payment abstraction and testing bypass — COMPLETE

**Goal:** Strategy pattern for bKash vs mock payments.

### Interface
```csharp
IPaymentStrategy {
  Task<PaymentInitResult> InitiatePaymentAsync(PaymentRequest request);
  Task<PaymentVerifyResult> VerifyPaymentAsync(string transactionId);
}
```

### Implementations
- **`BkashPaymentStrategy`** — simulates bKash using admin profile `BKashNumber`
- **`MockPaymentStrategy`** — when `FeatureManagement:UseMockPayment` is `true`: auto `MOCK_TRX_XXXX`, instant success redirect

### DI (Program.cs)
```csharp
if (configuration.GetValue<bool>("FeatureManagement:UseMockPayment"))
    services.AddScoped<IPaymentStrategy, MockPaymentStrategy>();
else
    services.AddScoped<IPaymentStrategy, BkashPaymentStrategy>();
```

### API endpoints (Phase 3)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/payments/mode` | Public | Returns `useMockPayment` and active `provider` |
| `POST` | `/api/payments/initiate` | JWT | Start payment; returns `transactionId`, `redirectUrl`, `bKashNumber` (bKash only) |
| `POST` | `/api/payments/verify` | JWT | Verify by `transactionId` |
| `GET` | `/api/payments/callback` | Public | Gateway redirect; verifies and forwards to frontend success/failure URL |
| `GET` | `/api/payments/bkash/simulate` | Public | Simulated bKash checkout page (bKash mode only) |

**Verification:**
```bash
curl http://localhost:5000/api/payments/mode
# Login, then:
curl -X POST http://localhost:5000/api/payments/initiate -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" -d '{"amount":500,"description":"Campaign fee"}'
curl -X POST http://localhost:5000/api/payments/verify -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" -d '{"transactionId":"MOCK_TRX_XXXXXXXX"}'
```

---

## Phase 4: Business logic, concurrency and state machine — COMPLETE

**Goal:** Campaign payment, booking rules, expiration worker, resell.

### Campaign creation
- `POST /api/campaigns` — 500 Taka fee via `IPaymentStrategy`; `IsActive = false` until `PaymentStatus = Paid`

### Booking creation (`POST /api/bookings`)
Inside **serializable** transaction or `SELECT ... FOR UPDATE` on campaign row:
1. Investor has **≤ 3** active bookings (`Status` in `PreBooked`, `Contacted`)
2. `ReservedShares` ≤ `AvailableShares`
3. `TotalPrice` = shares × `PricePerShare` ≥ `MinInvestmentThreshold`
4. Deduct `AvailableShares`; booking → `PreBooked`

### Booking management
| Actor | Action |
|-------|--------|
| Investor | Cancel/free if `PreBooked` or `Contacted` → restore shares |
| Company | `PreBooked` → `Contacted` → `Confirmed` |

### Background worker
- `IHostedService` or Quartz — **hourly**
- Cancel `PreBooked` bookings **older than 3 days** → `Cancelled`, restore shares

### Resell
- Investor returns `Confirmed` shares → status `Returned`, shares back to campaign pool

### Enum addition
- `BookingStatus.Returned` added (string-stored enum; migration `AddReturnedBookingStatus`)

### API endpoints (Phase 4)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/campaigns` | Public | Active paid campaigns |
| `GET` | `/api/campaigns/{id}` | Public | Campaign detail |
| `POST` | `/api/campaigns` | Company | Create campaign + initiate 500 BDT payment |
| `POST` | `/api/campaigns/{id}/confirm-payment` | Company | Verify payment, activate campaign |
| `POST` | `/api/bookings` | Investor | Create booking (serializable + `FOR UPDATE`) |
| `GET` | `/api/bookings/mine` | Investor | List own bookings |
| `GET` | `/api/bookings/company` | Company | List bookings for company campaigns |
| `POST` | `/api/bookings/{id}/cancel` | Investor | Cancel PreBooked/Contacted, restore shares |
| `PATCH` | `/api/bookings/{id}/status` | Company | `Contacted` or `Confirmed` |
| `POST` | `/api/bookings/{id}/resell` | Investor | Return Confirmed shares (`Returned`) |

**Background:** `BookingExpirationHostedService` runs hourly; cancels `PreBooked` older than 3 days.

---

## Phase 5: Real-time SignalR notification layer — COMPLETE

**Goal:** Persist notifications + push to investor clients.

- Hub: `InvestmentHub` at `/hubs/investment`
- Groups: `Investors`, `Companies`, `Admins` (by role on connect)
- On campaign payment confirmed: insert `Notifications` row per investor + broadcast `CampaignActivated` to `Investors` group
- Web: bell icon + unread counter via `@microsoft/signalr` (`frontend-web`)

### API endpoints (Phase 5)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/notifications` | JWT | List user notifications |
| `GET` | `/api/notifications/unread-count` | JWT | Unread count |
| `PATCH` | `/api/notifications/{id}/read` | JWT | Mark one read |
| `POST` | `/api/notifications/read-all` | JWT | Mark all read |

### SignalR
- Event: `CampaignActivated` → `{ campaignId, message, createdAt }`
- Connect: `{API}/hubs/investment?access_token={jwt}`

---

## Phase 6: React web and React Native mobile UI — COMPLETE

**Goal:** Parity between web and mobile feature state.

### Folders
- `frontend-web/` — Vite, TailwindCSS, Zustand, React Router
- `frontend-mobile/` — Expo, NativeWind, Zustand, React Navigation

### Shared UX (both platforms)
- **Share calculator:** increment/decrement shares; `TotalPrice = Shares × PricePerShare`; block submit if below `MinInvestmentThreshold`
- **Notifications:** SignalR hub connection, bell + counter increment on `CampaignActivated`
- **Debug toggle:** `VITE_IS_TESTING` / `REACT_APP_IS_TESTING` (web) or `EXPO_PUBLIC_IS_TESTING` (mobile) shows gray `[DEBUG] Bypass Payment` beside payment gateway

### Web routes
| Route | Role |
|-------|------|
| `/login`, `/register` | Public |
| `/investor` | Investor — campaigns, bookings, SignalR bell |
| `/company` | Company — create campaign, payment, booking management |
| `/admin` | Admin — approve companies, profile |
| `/payment/success`, `/payment/failure` | Payment callback landing |

### Mobile
Run locally: `cd frontend-mobile && npm start` (Expo). Use device/emulator; set `EXPO_PUBLIC_API_BASE_URL` to your machine IP when not on localhost.

---

## Environment variables (compose)

| Variable | Purpose |
|----------|---------|
| `POSTGRES_*` | Database |
| `ConnectionStrings__DefaultConnection` | API → PostgreSQL |
| `Jwt__SecretKey` | JWT signing (Phase 2+) |
| `FeatureManagement__UseMockPayment` | Phase 3 payment bypass |
| `VITE_API_BASE_URL` | Web API URL |
| `REACT_APP_IS_TESTING` | Web debug payment button |

---

## API surface (cumulative)

| Phase | Endpoints |
|-------|-----------|
| 1 | `GET /health` |
| 2 | `/api/auth/*`, `/api/admin/*` |
| 3 | `/api/payments/*` |
| 4 | `/api/campaigns`, `/api/bookings` (incl. cancel, status, resell) |
| 5 | `/hubs/investment`, `/api/notifications` |
| 6 | (frontend only) |

---

## Concurrency and validation rules (must not skip)

1. **Bookings:** Serializable isolation or pessimistic row lock on campaign
2. **Max 3 active bookings** per investor (`PreBooked`, `Contacted`)
3. **Share availability** enforced atomically
4. **Min investment threshold** enforced on create
5. **3-day PreBooked expiry** — hourly job, idempotent share restore
6. **Campaign inactive** until payment verified
7. **Company campaigns** only when `ApprovalStatus.Approved`

---

## Phase completion checklist

| Phase | Status |
|-------|--------|
| 1 — Docker + schema | Complete |
| 2 — Auth + admin | Complete |
| 3 — Payments | Complete |
| 4 — Bookings + campaigns | Complete |
| 5 — SignalR | Complete |
| 6 — Web + mobile UI | Complete |

---

## Execution order for Cursor

1. Phase 1 — scaffold, compose, migrations, seed  
2. Phase 2 — JWT, register, admin APIs *(complete)*  
3. Phase 3 — `IPaymentStrategy` + conditional DI *(complete)*  
4. Phase 4 — campaigns, bookings, worker, resell *(complete)*  
5. Phase 5 — `Notification` entity, hub, broadcast  
6. Phase 6 — Tailwind web, Expo mobile, SignalR clients, share calculator *(complete)*  

After each phase: run verification commands, update this checklist, stop for review unless instructed to continue.
