# Deploying Boomerang

## Option 1: Railway (Recommended — easiest)

1. Go to https://railway.com and sign up (free tier available)
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub account and select the boomerang repo
4. Railway auto-detects the Dockerfile and deploys
5. Add environment variable: `JWT_SECRET` = any random string (e.g. `my-super-secret-key-2026`)
6. Railway gives you a public URL like `boomerang-production.up.railway.app`

## Option 2: Render.com

1. Go to https://render.com and sign up
2. New → Web Service → Connect your GitHub repo
3. Settings: Runtime = Docker, Branch = main
4. Add env var: `JWT_SECRET` = your secret
5. Deploy

## After deploying

- Share the URL with your friend
- Both of you can register, post services, and exchange points
- To update: push code to GitHub → auto-redeploys

## Push to GitHub first

```bash
cd skillswap
git init
git add .
git commit -m "Boomerang v1 - skill exchange platform"
git remote add origin https://github.com/YOUR_USERNAME/boomerang.git
git push -u origin main
```
