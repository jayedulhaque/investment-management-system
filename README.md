# Investment Management System

Phase 1–6 deliver the full stack: API, payments, bookings, SignalR, and web/mobile UIs.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Compose v2)
- Optional: [.NET 10 SDK](https://dotnet.microsoft.com/download) for local EF CLI and API development

## Quick start

1. Copy environment defaults:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Start the stack:

   ```bash
   docker compose up --build
   ```

3. Open services:

   | Service | URL |
   |---------|-----|
   | Web (Vite) | http://localhost:3000 |
   | API | http://localhost:5000 |
   | API health | http://localhost:5000/health |
   | PostgreSQL | `localhost:5432` |

Migrations run automatically when the backend container starts.

## Seed admin account

| Field | Value |
|-------|--------|
| Email | `admin@investment.local` |
| Password | `Admin@12345` |
| Role | Admin |
| bKash number | `01700000000` |

Change these credentials before any production deployment.

## Verification

```bash
curl http://localhost:5000/health
curl http://localhost:3000
```

Confirm admin seed in PostgreSQL:

```bash
docker compose exec db psql -U ims_user -d investment_management -c "SELECT \"Email\", \"Role\" FROM \"Users\";"
```

List tables:

```bash
docker compose exec db psql -U ims_user -d investment_management -c "\dt"
```

Expected tables: `Users`, `CompanyProfiles`, `Campaigns`, `Bookings`, `__EFMigrationsHistory`.

## Project layout

```text
backend/                          # .NET 10 Web API
  InvestmentManagement.slnx
  src/InvestmentManagement.Api/   # EF Core entities, migrations, Dockerfile
frontend-web/                     # React + Vite (Phase 6 expands UI)
docker-compose.yml
.env.example
```

## Architecture & diagrams

### System architecture

End-to-end flow across clients, Docker services, and internal API components.

```mermaid
flowchart TB
    subgraph Clients
        Web["frontend-web<br/>React · Vite · Tailwind · Zustand"]
        Mobile["frontend-mobile<br/>Expo · React Native · NativeWind"]
    end

    subgraph DockerCompose["Docker Compose"]
        Web -->|REST + SignalR| API
        Mobile -->|REST + SignalR| API
        API["ims-backend<br/>.NET 10 Web API"]
        API -->|EF Core| DB[(PostgreSQL 16<br/>ims-db)]
    end

    subgraph APIInternals["API internals"]
        API --> Auth["JWT auth<br/>Admin · Company · Investor"]
        API --> Controllers["REST controllers<br/>auth · admin · campaigns · bookings · payments · notifications"]
        API --> Hub["SignalR InvestmentHub<br/>/hubs/investment"]
        API --> Worker["BookingExpirationHostedService<br/>hourly · 3-day PreBooked expiry"]
        Controllers --> Services["Domain services"]
        Services --> Payment["IPaymentStrategy<br/>Mock or bKash"]
        Payment --> SessionStore["In-memory payment sessions"]
    end

    subgraph Roles["User roles"]
        Admin["Admin — approve companies, bKash profile"]
        Company["Company — create campaigns, manage bookings"]
        Investor["Investor — browse, book shares, notifications"]
    end

    Web --> Roles
    Mobile --> Roles
```

| Layer | Technology |
|-------|------------|
| Backend | .NET 10, EF Core 10, ASP.NET Core SignalR |
| Database | PostgreSQL 16 |
| Web | React 19, Vite, TailwindCSS, Zustand, React Router, `@microsoft/signalr` |
| Mobile | Expo, React Native, NativeWind, Zustand, React Navigation |
| Containers | Docker Compose (`db`, `backend`, `frontend-web`) |

### Entity-relationship diagram

Five persisted tables. Payment sessions are held in memory only (not in the database).

```mermaid
erDiagram
    User ||--o| CompanyProfile : "has when Company role"
    User ||--o{ Booking : "invests as Investor"
    CompanyProfile ||--o{ Campaign : "owns"
    Campaign ||--o{ Booking : "receives"
    User ||--o{ Notification : "receives"
    Campaign ||--o{ Notification : "optional reference"

    User {
        uuid Id PK
        string Email UK
        string PasswordHash
        enum Role "Admin | Company | Investor"
        string BKashNumber "nullable, admin receiving number"
    }

    CompanyProfile {
        uuid Id PK
        uuid UserId FK UK
        string DocumentationUrl
        enum ApprovalStatus "Pending | Approved | Rejected"
    }

    Campaign {
        uuid Id PK
        uuid CompanyId FK
        int TotalShares
        int AvailableShares
        decimal PricePerShare
        decimal MinInvestmentThreshold
        enum PaymentStatus "Pending | Paid"
        string BKashTransactionId "nullable"
        bool IsActive
    }

    Booking {
        uuid Id PK
        uuid InvestorId FK
        uuid CampaignId FK
        int ReservedShares
        decimal TotalPrice
        enum Status "PreBooked | Contacted | Confirmed | Cancelled | Returned"
        datetime CreatedAt
        datetime UpdatedAt
    }

    Notification {
        uuid Id PK
        uuid UserId FK
        uuid CampaignId FK "nullable"
        string Message
        bool IsRead
        datetime CreatedAt
    }
```

**Relationships**

| From | To | Cardinality | Notes |
|------|----|-------------|-------|
| User | CompanyProfile | 1:1 | Company role only; cascade delete |
| User | Booking | 1:N | Investor role |
| CompanyProfile | Campaign | 1:N | Company must be Approved to create |
| Campaign | Booking | 1:N | Shares deducted on PreBooked |
| User | Notification | 1:N | Cascade delete |
| Campaign | Notification | 1:N | Optional; set null on campaign delete |

**Booking status flow:** `PreBooked` → `Contacted` → `Confirmed` · `PreBooked`/`Contacted` → `Cancelled` · `Confirmed` → `Returned` (resell)

### Sequence diagrams

#### 1. Authentication and company onboarding

```mermaid
sequenceDiagram
    actor Investor as Investor / Company
    actor Admin
    participant UI as Web / Mobile
    participant API as Auth & Admin API
    participant DB as PostgreSQL

    Investor->>UI: Register
    UI->>API: POST /api/auth/register/investor or /company
    API->>DB: Create User (+ CompanyProfile if company, Pending)
    API-->>UI: JWT + role

    alt Company registration
        Admin->>UI: Review pending companies
        UI->>API: GET /api/admin/companies/pending
        API->>DB: List Pending profiles
        Admin->>UI: Approve or reject
        UI->>API: POST /api/admin/companies/{id}/approve
        API->>DB: ApprovalStatus = Approved | Rejected
    end

    Investor->>UI: Login
    UI->>API: POST /api/auth/login
    API->>DB: Verify credentials
    API-->>UI: JWT (Bearer on subsequent requests)
```

#### 2. Campaign creation, payment, and activation

Listing fee is **500 BDT**. Campaign stays inactive until payment is verified.

```mermaid
sequenceDiagram
    actor Company
    actor Investors
    participant UI as Company UI
    participant API as Campaigns & Payments API
    participant Pay as IPaymentStrategy
    participant DB as PostgreSQL
    participant Hub as SignalR Hub

    Company->>UI: Create campaign
    UI->>API: POST /api/campaigns
    API->>DB: Insert Campaign (PaymentStatus=Pending, IsActive=false)
    API->>Pay: Initiate 500 BDT (reference: campaign:{id})
    Pay-->>UI: transactionId + redirectUrl

    Company->>Pay: Complete payment (mock callback or bKash simulate)
    Company->>UI: Confirm payment
    UI->>API: POST /api/campaigns/{id}/confirm-payment
    API->>Pay: Verify transaction
    API->>DB: PaymentStatus=Paid, IsActive=true
    API->>DB: Insert Notification per investor
    API->>Hub: CampaignActivated → Investors group
    Hub-->>Investors: Real-time event (bell badge++)
```

Payment mode is controlled by `FeatureManagement__UseMockPayment`: **mock** auto-verifies via callback; **bKash** uses the simulated checkout page and admin `BKashNumber`.

#### 3. Investor booking flow

```mermaid
sequenceDiagram
    actor Investor
    actor Company
    participant UI as Investor / Company UI
    participant API as Bookings API
    participant DB as PostgreSQL
    participant Worker as Expiration worker

    Investor->>UI: Browse campaigns
    UI->>API: GET /api/campaigns
    API->>DB: Active paid campaigns
    API-->>UI: Campaign list

    Investor->>UI: Reserve shares (share calculator)
    UI->>API: POST /api/bookings
    API->>DB: SERIALIZABLE tx + row lock on Campaign
    Note over API,DB: Max 3 active bookings · shares available · min threshold
    API->>DB: Decrement AvailableShares, Status=PreBooked
    API-->>UI: Booking created

    Company->>UI: Update booking status
    UI->>API: PATCH /api/bookings/{id}/status
    API->>DB: PreBooked → Contacted → Confirmed

    opt Investor cancels
        Investor->>UI: Cancel booking
        UI->>API: POST /api/bookings/{id}/cancel
        API->>DB: Cancelled, restore AvailableShares
    end

    opt Auto-expire (hourly)
        Worker->>DB: PreBooked older than 3 days → Cancelled
        Worker->>DB: Restore AvailableShares
    end

    opt Resell confirmed shares
        Investor->>UI: Return shares
        UI->>API: POST /api/bookings/{id}/resell
        API->>DB: Status=Returned, restore AvailableShares
    end
```

#### 4. Notifications and SignalR

```mermaid
sequenceDiagram
    participant UI as Web / Mobile
    participant Hub as /hubs/investment
    participant API as Notifications API
    participant DB as PostgreSQL

    UI->>Hub: Connect with JWT (?access_token=)
    Note over Hub: Join role group: Investors · Companies · Admins

    UI->>API: GET /api/notifications/unread-count
    API->>DB: Count unread
    API-->>UI: Unread count

    Note over Hub,UI: On campaign activation
    Hub-->>UI: CampaignActivated event
    UI->>UI: Increment bell badge

    UI->>API: GET /api/notifications
    API->>DB: List user notifications
    API-->>UI: Notification list

    UI->>API: PATCH /api/notifications/{id}/read
    UI->>API: POST /api/notifications/read-all
    API->>DB: Mark read
```

## Local EF migrations

From `backend/src/InvestmentManagement.Api`:

```bash
# Ensure PostgreSQL is running (e.g. docker compose up db)
$env:ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=investment_management;Username=ims_user;Password=ims_dev_password"

dotnet ef migrations add <MigrationName> --output-dir Migrations
dotnet ef database update
```

## Configuration

| Variable | Purpose |
|----------|---------|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection for the API |
| `FeatureManagement__UseMockPayment` | Reserved for Phase 3 payment bypass (`true` / `false`) |
| `VITE_API_BASE_URL` | Frontend API base URL (default `http://localhost:5000`) |

## Phase 6 — Web and mobile UI

### Web (`frontend-web`)
- **Stack:** React, Vite, TailwindCSS, Zustand, React Router, `@microsoft/signalr`
- **URL:** http://localhost:3000
- **Testing mode:** `VITE_IS_TESTING=true` shows `[DEBUG] Bypass Payment` on company payment flow

| Route | Role |
|-------|------|
| `/login`, `/register` | Public |
| `/investor` | Browse campaigns, share calculator, bookings, notification bell |
| `/company` | Create campaign (500 BDT), manage booking status |
| `/admin` | Approve companies, update bKash profile |

Local dev (without Docker): `cd frontend-web && npm install && npm run dev`

### Mobile (`frontend-mobile`)
- **Stack:** Expo, NativeWind, Zustand, React Navigation, `@microsoft/signalr`
- **Run:** `cd frontend-mobile && npm install && npm start`
- On a physical device, set `EXPO_PUBLIC_API_BASE_URL=http://<your-lan-ip>:5000`
- **Testing mode:** `EXPO_PUBLIC_IS_TESTING=true` enables debug payment bypass

Feature parity with web: auth, investor/company/admin screens, share calculator, SignalR unread badge, payment bypass in testing mode.

## Phase 5 API (notifications and SignalR)

| Method | Route | Auth |
|--------|-------|------|
| `GET` | `/api/notifications` | JWT |
| `GET` | `/api/notifications/unread-count` | JWT |
| `PATCH` | `/api/notifications/{id}/read` | JWT |
| `POST` | `/api/notifications/read-all` | JWT |

**Hub:** `ws/http://localhost:5000/hubs/investment?access_token=<jwt>`

When a company confirms campaign payment, all investors receive a DB notification and a real-time `CampaignActivated` event.

**Web UI:** `frontend-web` includes a notification bell — paste an investor JWT in the dev panel to connect.

## Phase 4 API (campaigns and bookings)

**Campaign listing fee:** 500 BDT (via payment flow from Phase 3).

| Method | Route | Auth |
|--------|-------|------|
| `GET` | `/api/campaigns` | Public |
| `POST` | `/api/campaigns` | Company (approved) |
| `POST` | `/api/campaigns/{id}/confirm-payment` | Company |
| `POST` | `/api/bookings` | Investor |
| `POST` | `/api/bookings/{id}/cancel` | Investor |
| `PATCH` | `/api/bookings/{id}/status` | Company (`Contacted` / `Confirmed`) |
| `POST` | `/api/bookings/{id}/resell` | Investor |

Booking rules: max 3 active (`PreBooked`/`Contacted`), serializable transaction + row lock, min investment threshold, 3-day auto-cancel worker.

## Phase 3 API (payments)

Controlled by `FeatureManagement__UseMockPayment` (`true` = mock, `false` = bKash simulator).

| Method | Route | Auth |
|--------|-------|------|
| `GET` | `/api/payments/mode` | Public |
| `POST` | `/api/payments/initiate` | JWT |
| `POST` | `/api/payments/verify` | JWT |
| `GET` | `/api/payments/callback` | Public (gateway redirect) |
| `GET` | `/api/payments/bkash/simulate` | Public (bKash mode) |

```bash
curl http://localhost:5000/api/payments/mode

curl -X POST http://localhost:5000/api/payments/initiate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"description":"Campaign listing fee"}'
# Open redirectUrl in browser (mock auto-verifies via callback)

curl -X POST http://localhost:5000/api/payments/verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"<transactionId from initiate>"}'
```

## Phase 2 API (authentication)

| Method | Route | Auth |
|--------|-------|------|
| `POST` | `/api/auth/login` | Public |
| `POST` | `/api/auth/register/investor` | Public |
| `POST` | `/api/auth/register/company` | Public |
| `PUT` | `/api/admin/profile` | Admin JWT |
| `GET` | `/api/admin/companies/pending` | Admin JWT |
| `POST` | `/api/admin/companies/{id}/approve` | Admin JWT |

### Example: admin login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@investment.local\",\"password\":\"Admin@12345\"}"
```

Use the returned `accessToken` as `Authorization: Bearer <token>` on admin routes.

### Example: register company and approve

```bash
# Register company (returns token; profile is Pending)
curl -X POST http://localhost:5000/api/auth/register/company \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"company@example.com\",\"password\":\"Company@123\",\"documentationUrl\":\"https://example.com/docs.pdf\"}"

# List pending (admin token)
curl http://localhost:5000/api/admin/companies/pending \
  -H "Authorization: Bearer <admin_token>"

# Approve
curl -X POST http://localhost:5000/api/admin/companies/<companyProfileId>/approve \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d "{\"approve\":true}"
```

## Master plan

See [MASTER_PLAN.md](MASTER_PLAN.md) for the full phased blueprint (Phases 1–6).

## Phase roadmap

- **Phase 1** (complete): Docker, schema, admin seed
- **Phase 2** (complete): JWT auth, registration, admin endpoints
- **Phase 3** (complete): Payment strategy (bKash / mock)
- **Phase 4** (complete): Campaigns, bookings, concurrency, background jobs
- **Phase 5** (complete): SignalR notifications
- **Phase 6** (complete): Full web + mobile UI
