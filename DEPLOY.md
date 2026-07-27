# Deploy in 5 minutes (free) — doctor demo link

## One link for phone (Render — recommended)

1. Push this project to **GitHub** (see commands below)
2. Go to [render.com](https://render.com) → Sign up (free)
3. **New +** → **Blueprint** → Connect your GitHub repo
4. Render reads `render.yaml` automatically → click **Apply**
5. Wait ~5–8 min for deploy
6. Open the URL Render gives you, e.g. `https://homeopathy-clinic-xxxx.onrender.com`

**Login:** `9876543210` / `password123`

Share that URL with the doctor — works on any phone, any network.

> Free tier sleeps after 15 min idle. First open may take ~30 sec to wake up.

---

## Push to GitHub (one time)

```bash
cd /Users/shivansh/Desktop/homeopathy-clinic
git init
git add .
git commit -m "Homeopathy clinic app — ready for deploy"
# Create empty repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/homeopathy-clinic.git
git branch -M main
git push -u origin main
```

---

## Local phone demo (same WiFi only)

```bash
npm run dev
```

Phone browser: use the **Network** URL from terminal (port **5173**), not 4000.
