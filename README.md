# 🚛 TransitOps — Smart Transport Operations Platform

**Built at Odoo Hackathon 2026**

A full-stack fleet operations platform that digitizes vehicle, driver, dispatch, maintenance, and expense management — replacing spreadsheets and manual logbooks with a rule-enforced, real-time system.

![Node](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-Backend-000000?logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Type--Safe-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-%2B%20PostGIS-4169E1?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-orange)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## 📖 Table of Contents

- [Business Context](#-business-context)
- [Target Users & Roles](#-target-users--roles)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Database Schema (ERD)](#-database-schema-erd)
- [Trip Lifecycle Workflow](#-trip-lifecycle-workflow)
- [Vehicle Status Workflow](#-vehicle-status-workflow)
- [End-to-End Operational Flow](#-end-to-end-operational-flow)
- [Mandatory Business Rules](#-mandatory-business-rules)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [API Reference](#-api-reference)
- [Security](#-security)
- [Roadmap / Bonus Features](#-roadmap--bonus-features)
- [Example Workflow Walkthrough](#-example-workflow-walkthrough)
- [Design Mockup](#-design-mockup)
- [Contributors](#-contributors)

---

## 🎯 Business Context

Many logistics companies still rely on spreadsheets and manual logbooks to manage transport operations. This leads to scheduling conflicts, underutilized vehicles, missed maintenance, expired driver licenses, inaccurate expense tracking, and poor operational visibility.

**TransitOps** centralizes the complete lifecycle of transport operations — from vehicle registration and driver management to dispatching, maintenance, fuel logging, and analytics — inside a single rule-driven platform.

---

## 👥 Target Users & Roles

| Role | Responsibility |
|---|---|
| 🚚 **Fleet Manager** | Oversees fleet assets, maintenance, vehicle lifecycle, and operational efficiency |
| 🧑‍✈️ **Driver** | Creates trips, gets assigned vehicles, monitors active deliveries |
| 🦺 **Safety Officer** | Ensures driver compliance, tracks license validity, monitors safety scores |
| 💰 **Financial Analyst** | Reviews operational expenses, fuel consumption, maintenance costs, and profitability |

Access is enforced through **Role-Based Access Control (RBAC)** backed by JWT authentication — every API request must carry a valid `Authorization: Bearer <token>` header, and permissions are scoped per role.

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- JWT-based authentication with secure session management
- Role-Based Access Control (RBAC) across all modules
- Only authenticated users can access the application

### 📊 Operational Dashboard
- Live KPIs: Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips, Drivers On Duty, Fleet Utilization (%)
- Filters by vehicle type, status, and region

### 🚛 Vehicle Registry
- Master list with unique Registration Number, Model, Type, Max Load Capacity, Odometer, Acquisition Cost, and Status
- Real-time location tracking (PostGIS geospatial support)
- Statuses: `Available` → `On Trip` → `In Shop` → `Retired`

### 🧑‍✈️ Driver Management
- Profiles with License Number, License Category, License Expiry, Contact Number, Safety Score
- Statuses: `Available`, `On Trip`, `Off Duty`, `Suspended`

### 🗺️ Trip & Dispatch Management
- Create trips by selecting source, destination, an available vehicle, an available driver, cargo weight, and planned distance
- Full lifecycle validation before dispatch
- Multi-stage route planning with distance/time calculation

### 🛠️ Maintenance Management
- Log maintenance records per vehicle
- Adding an active maintenance record automatically flips vehicle status to `In Shop`, instantly removing it from the dispatch pool

### ⛽ Fuel & Expense Management
- Fuel logs (liters, cost, date) and other expenses (tolls, repairs, insurance)
- Automatic computation of total operational cost per vehicle (Fuel + Maintenance)

### 🛡️ Safety & Compliance
- Incident reporting with severity classification
- Driver behavior / safety-score monitoring
- Compliance dashboards for expiring licenses and suspensions

### 📈 Reports & Analytics
- **Fuel Efficiency** = Distance / Fuel
- **Fleet Utilization** = Vehicles on Trip / Total Active Vehicles
- **Operational Cost** = Fuel + Maintenance
- **Vehicle ROI** = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
- CSV export (PDF export planned)

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | TypeScript + CSS (responsive web UI) |
| **Backend** | Node.js 22.x, Express.js |
| **ORM** | Prisma (type-safe DB access) |
| **Database** | PostgreSQL 15+ with the **PostGIS** extension for geospatial data |
| **Auth** | JWT (JSON Web Tokens), `bcryptjs` for password hashing |
| **Validation** | Zod schemas |
| **Dev Tooling** | `tsx`, `nodemon`, TypeScript |

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        UI[Responsive Web UI<br/>TypeScript + CSS]
    end

    subgraph API["Backend — Express.js + TypeScript"]
        MW[Auth & RBAC Middleware<br/>JWT Verification]
        CTRL[Controllers<br/>Request Handlers]
        SVC[Services<br/>Business Rules Engine]
        VAL[Zod Validation Layer]
    end

    subgraph Data["Data Layer"]
        PRISMA[Prisma ORM]
        DB[(PostgreSQL + PostGIS)]
    end

    UI -->|HTTPS / REST JSON| MW
    MW --> VAL
    VAL --> CTRL
    CTRL --> SVC
    SVC --> PRISMA
    PRISMA --> DB

    SVC -.enforces.-> RULES[["Business Rules:<br/>• Unique reg. number<br/>• License/status checks<br/>• Capacity checks<br/>• Auto status transitions"]]
```

---

## 🗃️ Database Schema (ERD)

```mermaid
erDiagram
    USER ||--o{ TRIP : "assigned as driver"
    USER {
        int id PK
        string email UK
        string password_hash
        string role
        datetime created_at
        datetime updated_at
    }

    VEHICLE ||--o{ TRIP : "assigned to"
    VEHICLE ||--o{ MAINTENANCE_LOG : "has"
    VEHICLE ||--o{ FUEL_LOG : "logs fuel for"
    VEHICLE ||--o{ EXPENSE : "incurs"
    VEHICLE {
        int id PK
        string registration_number UK
        string name_model
        string vehicle_type
        float max_load_capacity
        float odometer
        decimal acquisition_cost
        string status
        point location
    }

    TRIP ||--o{ FUEL_LOG : "generates"
    TRIP ||--o{ EXPENSE : "generates"
    TRIP {
        int id PK
        int vehicle_id FK
        int driver_id FK
        string source
        string destination
        float cargo_weight
        float planned_distance
        string status
        datetime created_at
    }

    MAINTENANCE_LOG {
        int id PK
        int vehicle_id FK
        string type
        decimal cost
        string status
        date service_date
    }

    FUEL_LOG {
        int id PK
        int vehicle_id FK
        int trip_id FK
        float liters
        decimal cost
        date log_date
    }

    EXPENSE {
        int id PK
        int vehicle_id FK
        int trip_id FK
        string expense_type
        decimal amount
        date date
    }
```

---

## 🔄 Trip Lifecycle Workflow

```mermaid
stateDiagram-v2
    [*] --> Draft: Create trip
    Draft --> Dispatched: Dispatch\n(validations pass)
    Draft --> Cancelled: Cancel
    Dispatched --> Completed: Enter final odometer\n+ fuel consumed
    Dispatched --> Cancelled: Cancel dispatched trip
    Completed --> [*]
    Cancelled --> [*]

    note right of Dispatched
        Vehicle & Driver → On Trip
    end note
    note right of Completed
        Vehicle & Driver → Available
    end note
    note right of Cancelled
        Vehicle & Driver → Available
    end note
```

**Dispatch validation gate** — a trip can only move from `Draft` to `Dispatched` if:
1. Vehicle status is `Available` (not `In Shop`, `Retired`, or `On Trip`)
2. Driver status is `Available` (not `Suspended`, `On Trip`, or `Off Duty`)
3. Driver's license is not expired
4. `Cargo Weight ≤ Vehicle Max Load Capacity`

---

## 🚦 Vehicle Status Workflow

```mermaid
stateDiagram-v2
    [*] --> Available: Register vehicle
    Available --> OnTrip: Trip dispatched
    OnTrip --> Available: Trip completed / cancelled
    Available --> InShop: Maintenance record created
    InShop --> Available: Maintenance closed\n(unless retired)
    Available --> Retired: Decommission
    InShop --> Retired: Decommission
    Retired --> [*]

    note right of InShop
        Hidden from driver's
        vehicle selection pool
    end note
    note right of Retired
        Never appears in
        dispatch selection
    end note
```

---

## 🔁 End-to-End Operational Flow

```mermaid
sequenceDiagram
    actor FM as Fleet Manager
    actor D as Driver
    participant SYS as TransitOps System
    participant DB as Database

    FM->>SYS: Register vehicle (Van-05, 500kg capacity)
    SYS->>DB: Save vehicle (status = Available)

    FM->>SYS: Register driver (Alex, valid license)
    SYS->>DB: Save driver (status = Available)

    D->>SYS: Create trip (cargo = 450kg)
    SYS->>SYS: Validate 450kg ≤ 500kg ✅
    SYS->>SYS: Validate license & driver/vehicle status ✅
    D->>SYS: Dispatch trip
    SYS->>DB: Vehicle & Driver → On Trip

    D->>SYS: Complete trip (final odometer + fuel used)
    SYS->>DB: Vehicle & Driver → Available
    SYS->>DB: Log fuel usage

    FM->>SYS: Create maintenance record (Oil Change)
    SYS->>DB: Vehicle → In Shop (hidden from dispatch)

    FM->>SYS: View Reports
    SYS->>DB: Aggregate fuel efficiency, cost, ROI
    SYS-->>FM: Updated analytics dashboard
```

---

## ⚖️ Mandatory Business Rules

| # | Rule |
|---|---|
| 1 | Vehicle registration number must be **unique** |
| 2 | `Retired` or `In Shop` vehicles never appear in dispatch selection |
| 3 | Drivers with **expired licenses** or `Suspended` status cannot be assigned to trips |
| 4 | A vehicle/driver already marked `On Trip` cannot be assigned to another trip |
| 5 | Cargo weight must **not exceed** the vehicle's maximum load capacity |
| 6 | Dispatching a trip → vehicle **and** driver status automatically become `On Trip` |
| 7 | Completing a trip → vehicle **and** driver status automatically revert to `Available` |
| 8 | Cancelling a dispatched trip restores vehicle and driver to `Available` |
| 9 | Creating an active maintenance record automatically sets vehicle status to `In Shop` |
| 10 | Closing maintenance restores vehicle to `Available` (unless it's `Retired`) |

---

## 📁 Project Structure

```
Odoo_Hackathon_2026/
├── backend/
│   ├── src/
│   │   ├── config/          # App configuration & environment setup
│   │   ├── controllers/     # Request handlers & business logic
│   │   ├── routes/          # API route definitions
│   │   ├── middleware/      # Auth, RBAC, validation middleware
│   │   ├── services/        # Core business logic (status transitions, rules)
│   │   ├── utils/           # Helper functions
│   │   ├── types/           # TypeScript type definitions
│   │   ├── validation/      # Zod schemas
│   │   └── server.ts        # Application entry point
│   ├── migrations/          # Database migration files
│   ├── prisma/              # Prisma schema & client generation
│   ├── generated/           # Auto-generated Prisma client
│   ├── .env                 # Environment variables (gitignored)
│   └── package.json
├── frontend/                 # Responsive web client (TypeScript + CSS)
├── TransitOps Smart Transport Operations Platform.pdf   # Problem statement
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js** 22.x or higher
- **PostgreSQL** 15.x or higher with the **PostGIS** extension enabled

### 1. Clone the repository
```bash
git clone https://github.com/JatinRajvani/Odoo_Hackathon_2026.git
cd Odoo_Hackathon_2026/backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```
```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database?schema=public&pgbouncer=true"

# Auth
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="24h"

# Server
PORT=5000
```

### 4. Set up the database
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```
```bash
npx prisma migrate dev --name init
npx ts-node seed.ts   # optional: seed initial data
```

### 5. Run the app
```bash
# Development (auto-reload)
npm run dev

# Production
npm run build
npm start
```

The backend runs at `http://localhost:5000`.

### Frontend
```bash
cd ../frontend
npm install
npm run dev
```

---

## 📡 API Reference

### Authentication

**`POST /api/v1/auth/login`**

Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "FLEET_MANAGER"
  }
}
```

### Fleet Management

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/vehicles?status=AVAILABLE` | List vehicles, filterable by status |
| `POST` | `/api/v1/vehicles` | Register a new vehicle |
| `GET` | `/api/v1/drivers` | List driver profiles |
| `POST` | `/api/v1/trips` | Create a trip |
| `PATCH` | `/api/v1/trips/:id/dispatch` | Dispatch a trip (runs business-rule validation) |
| `PATCH` | `/api/v1/trips/:id/complete` | Complete a trip |
| `POST` | `/api/v1/maintenance` | Create a maintenance record |
| `POST` | `/api/v1/fuel-logs` | Log fuel usage |
| `GET` | `/api/v1/reports/analytics` | Fetch KPI & analytics data |

> All endpoints (except `/auth/login`) require `Authorization: Bearer <token>`.

**Vehicle creation example:**
```json
{
  "plate_number": "ABC-123",
  "vehicle_type": "CAR",
  "status": "AVAILABLE"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": {}
}
```

| Status Code | Meaning |
|---|---|
| `200 OK` | Successful request |
| `201 Created` | Resource created |
| `400 Bad Request` | Invalid request data |
| `401 Unauthorized` | Invalid or expired token |
| `403 Forbidden` | Insufficient permissions |
| `404 Not Found` | Resource not found |
| `500 Internal Server Error` | Unexpected server error |

---

## 🔒 Security

- Passwords hashed with **bcryptjs**
- **JWT** tokens signed with a secret key
- Robust **input validation** (Zod) prevents common injection attacks
- **RBAC** enforced at the middleware layer on every protected route
- Environment secrets loaded via `.env` (never committed)

---

## 🚀 Roadmap / Bonus Features

- [ ] PDF export for reports
- [ ] Email reminders for expiring driver licenses
- [ ] Vehicle document management (insurance, RC, permits)
- [ ] Advanced search, filters, and sorting across all modules
- [ ] Dark mode
- [ ] Charts & visual analytics on the dashboard
- [ ] Real-time GPS tracking via PostGIS

---

## 🧪 Example Workflow Walkthrough

1. **Register** vehicle `Van-05` — max capacity 500 kg, status `Available`
2. **Register** driver `Alex` with a valid license
3. **Create** a trip with cargo weight = 450 kg
4. System validates `450 kg ≤ 500 kg` → dispatch allowed
5. Vehicle & driver statuses auto-flip to `On Trip`
6. **Complete** the trip — enter final odometer + fuel consumed
7. Vehicle & driver statuses auto-revert to `Available`
8. **Create** a maintenance record (e.g., Oil Change) → vehicle auto-flips to `In Shop`, hidden from dispatch
9. **Reports** update operational cost and fuel efficiency using the latest trip and fuel log

---

## 🎨 Design Mockup

UI/UX wireframes: [Excalidraw Mockup](https://link.excalidraw.com/l/65VNwvy7c4X/1FHGDNgD2td)

---

## 🤝 Contributors

Built during **Odoo Hackathon 2026** by **[Jatin Rajvani](https://github.com/JatinRajvani)** and team.

Contributions, issues, and feature requests are welcome — feel free to check the [issues page](https://github.com/JatinRajvani/Odoo_Hackathon_2026/issues).

---

## 📄 License

This project is licensed under the MIT License.
