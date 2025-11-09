# ⚡ Vercel Deployment - Quick Start

Deploy your frontend to Vercel in 5 minutes!

## 🎯 Before You Start

✅ Modal backend deployed (main-video-generator-dev)
✅ Anthropic API key ready
✅ Code pushed to GitHub

## 🚀 Fastest Way: Vercel Dashboard

### Step 1: Import Project
1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your repository
4. Click **"Import"**

### Step 2: Configure
```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Node.js Version: 18.x (default)
```

### Step 3: Environment Variables
Add this ONE required variable:
```
VITE_ANTHROPIC_API_KEY = sk-ant-api03-xxxxx
```

### Step 4: Deploy
Click **"Deploy"** → Wait 2 minutes → Done! 🎉

Your app will be live at: `https://your-app-name.vercel.app`

---

## 🖥️ Alternative: CLI Deployment

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Navigate to frontend
cd frontend

# 4. Deploy
vercel --prod

# 5. Add environment variable
vercel env add VITE_ANTHROPIC_API_KEY
```

---

## ✅ Verify Deployment

Test these features:
- [ ] Home page loads
- [ ] Search works
- [ ] Video generation starts
- [ ] Tree visualization displays

---

## 🐛 Common Issues

### Build fails?
```bash
# Fix dependencies locally first
cd frontend
npm install
npm run build  # Should succeed
git add package-lock.json
git commit -m "Fix dependencies"
git push
```

### API errors?
- Check environment variable is set in Vercel dashboard
- Verify Modal backend URLs in `frontend/src/services/*.ts`
- Check Modal backend is running: test endpoints directly

### CORS errors?
Your Modal backend might need to allow your Vercel domain. See full guide in `frontend/VERCEL_DEPLOYMENT.md`.

---

## 📚 More Details

For comprehensive information, see:
- **Frontend**: `frontend/VERCEL_DEPLOYMENT.md`
- **Backend**: `backend/modal/main_video_generator_dev_modular.py`

---

## 🎉 That's It!

Your frontend is now deployed and will auto-deploy on every push to `main`.

**Next:** Share the URL and start teaching! 🚀

