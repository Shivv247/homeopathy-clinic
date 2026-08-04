# Healing Homeopathy Clinic

Full-stack **Clinic Management Web App** for Indian homeopathic doctors — patient records, homeopathy-specific case taking, prescriptions, OPD queue, billing, inventory, and WhatsApp messaging.

Built for live consultations: large touch targets, mobile/tablet friendly, “Today’s Patients” front and centre.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React (Vite) + Tailwind CSS v4 + React Query + Zustand |
| Backend | Node.js + Express REST API |
| Database | SQLite (local zero-config) · PostgreSQL / Supabase ready |
| Auth | Phone + password, JWT, roles: Doctor / Receptionist / Assistant |
| PDF | PDFKit (prescription & invoice letterhead) |
| WhatsApp | Cloud API stub (enable via env for production) |

## Features

1. **Auth & roles** — Doctor (full), Receptionist (ops, no clinical edit), Assistant (view)
2. **Patient master** — UHID, family linking, instant search, tags (New / Follow-up / VIP / Inactive)
3. **Case taking** — Chief complaints with modalities, physical & mental generals, miasm, versioned/locked records
4. **Prescriptions** — Remedy autocomplete (30+ seed remedies), multi-remedy Rx, PDF + WhatsApp share, load previous Rx
5. **Timeline** — Visit history with improvement % tracking
6. **Queue** — Calendar appointments + walk-in tokens, status workflow
7. **Billing** — Invoices, payment modes, outstanding, daily collection
8. **Inventory** — Stock + auto-deduct on dispense, low-stock filter
9. **Dashboard & reports** — Today’s OPD, revenue/patient trends, top remedies
10. **Clinical Suite** — Kent-style repertory (80+ rubrics), repertorization, materia medica profiles, classic book library, symptom-to-rubric matching
11. **WhatsApp** — Bulk messages, follow-up reminders (stubbed until API keys set)
12. **Security** — RBAC, activity log, patient data export

### Coming soon

Patient portal, telemedicine, Hindi toggle, expanded repertory library.

## Quick start (local)

**Requirements:** Node.js 18+

```bash
cd homeopathy-clinic

# Install + create DB + seed sample data
npm install
npm run setup --prefix backend
# or from root after installing concurrently:
npm install
cd backend && npm run setup && cd ..

# Run API (port 4000) + UI (port 5173)
cd backend && npm run dev
# new terminal
cd frontend && npm run dev
```

Or from root (after `npm install` for concurrently):

```bash
npm run setup --prefix backend
npm run dev
```

Open **http://localhost:5173**

### Demo logins

| Role | Phone | Password |
|------|-------|----------|
| Doctor | `9876543210` | `password123` |
| Receptionist | `9876543211` | `password123` |
| Assistant | `9876543212` | `password123` |

Seed data includes sample patients (Sharma family), today’s OPD queue, remedies, inventory, and one case + prescription.

## Project structure

```
homeopathy-clinic/
├── backend/
│   ├── prisma/schema.prisma   # DB models
│   ├── prisma/seed.js         # Demo data + remedies
│   ├── src/
│   │   ├── routes/            # REST endpoints
│   │   ├── services/          # PDF + WhatsApp
│   │   ├── middleware/        # Auth, upload, RBAC
│   │   └── index.js
│   └── uploads/               # Photos, PDFs
├── frontend/
│   └── src/
│       ├── pages/             # Screens
│       ├── components/
│       └── store/             # Auth state
├── docker-compose.yml         # Optional Postgres
└── README.md
```

## Environment

`backend/.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me-in-production"
PORT=4000
FRONTEND_URL=http://localhost:5173
UPLOAD_DIR=./uploads
WHATSAPP_ENABLED=false
# WHATSAPP_API_URL=https://graph.facebook.com/v18.0
# WHATSAPP_TOKEN=...
# WHATSAPP_PHONE_NUMBER_ID=...
```

## PostgreSQL / Supabase (production)

1. Create a Postgres database (Supabase → Project Settings → Database URL).
2. In `backend/prisma/schema.prisma`, change:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Set `DATABASE_URL` to your connection string.
4. Run:

```bash
cd backend
npx prisma db push
node prisma/seed.js
```

Optional local Postgres:

```bash
docker compose up -d
# DATABASE_URL="postgresql://clinic:clinic_secret@localhost:5432/homeopathy_clinic"
```

## Deploy

- **Frontend:** Vercel / Netlify — set API proxy or `VITE_API_URL` (if you point axios to absolute URL).
- **Backend:** Render / Railway / Fly — set env vars, run `npx prisma db push` on release.
- **Files:** Use Supabase Storage or S3; swap multer destination / upload URLs.
- Point `FRONTEND_URL` and CORS to your live domain.

## Typical consultation flow

1. Receptionist registers patient / adds walk-in → token on **Queue**
2. Doctor opens **Today’s Patients** → Start consult → **Case sheet**
3. Save locked case → **Prescribe** (optionally load previous Rx)
4. Generate PDF / WhatsApp share
5. Receptionist creates invoice → mark paid (Cash / UPI / Card)

## API overview

| Prefix | Purpose |
|--------|---------|
| `POST /api/auth/login` | Login |
| `GET/POST /api/patients` | Patient CRUD + search |
| `POST /api/cases` | Case taking (doctor) |
| `POST /api/cases/:id/new-version` | Versioned edit |
| `GET/POST /api/prescriptions` | Rx + remedy search |
| `POST /api/prescriptions/:id/pdf` | PDF |
| `POST /api/prescriptions/:id/whatsapp` | Share |
| `GET/POST /api/appointments` | Queue |
| `GET/POST /api/billing` | Invoices |
| `GET/POST /api/inventory` | Stock |
| `GET /api/dashboard/overview` | Today stats |
| `GET /api/dashboard/analytics` | Charts (doctor) |
| `GET /api/clinical/*` | Repertory, MM, books, repertorization (doctor) |
| `POST /api/messages/bulk` | WhatsApp bulk |

## License

MIT — built for clinic use; validate medical-legal requirements for your jurisdiction before production.
