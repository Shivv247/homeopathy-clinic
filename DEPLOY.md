# Live deploy — Render + Supabase (free, data safe)

## Overview

| Step | What | Time |
|------|------|------|
| 1 | Supabase — free PostgreSQL | ~3 min |
| 2 | Render — host app + link | ~5 min |
| 3 | iPhone — Add to Home Screen | ~1 min |

**Demo login:** `9876543210` / `password123`

---

## Step 1 — Supabase (database)

1. Go to [supabase.com](https://supabase.com) → **Start your project** (free)
2. **New project** → name: `homeopathy-clinic` → strong DB password (save it!)
3. Region: **South Asia (Mumbai)** — fastest for India
4. Wait ~2 min for project to be ready
5. **Project Settings** (gear) → **Database** → **Connection string** → **URI**
6. Copy the URL. Replace `[YOUR-PASSWORD]` with your DB password
7. Use **Session pooler** (port **5432**) — works best with Prisma

Example:
```
postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

Keep this URL — paste it in Render in Step 2.

---

## Step 2 — Render (live link)

1. Push latest code to GitHub (already at `github.com/Shivv247/homeopathy-clinic`)
2. Go to [render.com](https://render.com) → Sign up with GitHub
3. **New +** → **Blueprint** → connect repo **homeopathy-clinic**
4. Render reads `render.yaml` → **Apply**
5. Before deploy finishes, open the service → **Environment**:
   - Add **`DATABASE_URL`** = your Supabase URI from Step 1
6. **Manual Deploy** → **Deploy latest commit** (if first deploy failed without DB URL)
7. Wait ~5–8 min → copy URL, e.g. `https://homeopathy-clinic-xxxx.onrender.com`

> Free tier sleeps after 15 min idle. First open may take ~30 sec to wake up.

On first start the app runs `prisma db push` + seeds demo data automatically.

---

## Step 3 — iPhone (doctor)

1. Safari mein live URL kholo
2. Login: `9876543210` / `password123`
3. **Share** button → **Add to Home Screen**
4. Home screen icon se roz open karo

---

## Local development (PostgreSQL)

```bash
docker compose up -d
cp backend/.env.example backend/.env
# Edit backend/.env if needed
npm run setup
npm run dev
```

Open **http://localhost:5173**

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Render build fails | Check **Logs** — usually missing `DATABASE_URL` |
| "Can't reach database" | Supabase URL correct? Password special chars URL-encoded? |
| Login fails | Redeploy after setting `DATABASE_URL`; seed runs on empty DB |
| Slow first load | Normal on Render free (cold start) |

---

## Push to GitHub (one time)

```bash
cd homeopathy-clinic
git add .
git commit -m "Production: Supabase PostgreSQL + Render deploy"
git push origin main
```
