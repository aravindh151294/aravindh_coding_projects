# FinDash Deployment Guide

## 🚀 Quick Deploy to Vercel (FREE)

### Prerequisites
- [Node.js 18+](https://nodejs.org/) installed
- [Git](https://git-scm.com/) installed
- [GitHub account](https://github.com/) (free)
- [Vercel account](https://vercel.com/) (free)

---

## Step 1: Local Setup

```bash
# Navigate to project
cd findash

# Install dependencies
npm install

# Run development server
npm run dev
```

Open http://localhost:3000 to verify everything works.

---

## Step 2: Push to GitHub

### Option A: Using Command Line

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: FinDash PWA"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/findash.git
git branch -M main
git push -u origin main
```

### Option B: Using GitHub Desktop
1. Open GitHub Desktop
2. File → Add Local Repository
3. Select the `findash` folder
4. Publish to GitHub

---

## Step 3: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import"** next to your `findash` repository
4. Configure:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Click **"Deploy"**

⏱️ Wait 1-2 minutes for deployment to complete.

---

## Step 4: Test Your PWA

1. Open your Vercel URL (e.g., `https://findash-xxx.vercel.app`)
2. On mobile:
   - **iOS**: Tap Share → "Add to Home Screen"
   - **Android**: Tap menu → "Install app"
3. Verify the app works offline

---

## 🔧 Optional: Custom Domain

1. In Vercel, go to your project
2. Settings → Domains
3. Add your domain
4. Update DNS records as instructed

---

## 📦 Build Commands Reference

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

## 🔄 Auto-Deployments

After connecting to Vercel:
- Every push to `main` → automatic production deployment
- Every pull request → preview deployment

---

## 📱 PWA Features

Your deployed app includes:
- ✅ Installable on mobile and desktop
- ✅ Offline capability (cached assets)
- ✅ App shortcuts
- ✅ Responsive design

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Run `npm run build` locally first |
| Icons don't show | Check `/public/icon-192.png` exists |
| Not installable | Verify `manifest.json` is served |

---

Happy deploying! 🎉
