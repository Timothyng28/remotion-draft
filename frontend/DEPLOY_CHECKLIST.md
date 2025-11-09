# ✅ Vercel Deployment Checklist

Follow this checklist to ensure a smooth deployment.

## 📋 Pre-Deployment

### 1. Local Build Test
```bash
cd frontend
npm install
npm run build
```
- [ ] Build completes without errors
- [ ] Check `dist/` folder was created

### 2. Local Preview Test
```bash
npm run preview
```
- [ ] App loads at http://localhost:4173
- [ ] All features work locally

### 3. Environment Setup
- [ ] Have Anthropic API key ready
- [ ] Verify Modal backend endpoints in:
  - [ ] `src/services/videoRenderService.ts` (line 63-64)
  - [ ] `src/services/searchService.ts` (lines 11, 31, 98)
  - [ ] `src/services/llmService.ts` (line 597)

### 4. Git Setup
```bash
cd /Users/timothy/Desktop/remotion
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```
- [ ] All changes committed
- [ ] Pushed to GitHub

## 🚀 Deployment

### Via Vercel Dashboard

- [ ] Go to https://vercel.com/new
- [ ] Import your GitHub repository
- [ ] Configure project settings:
  ```
  Framework Preset: Vite
  Root Directory: frontend
  Build Command: npm run build
  Output Directory: dist
  ```
- [ ] Add environment variable:
  ```
  Name: VITE_ANTHROPIC_API_KEY
  Value: your_actual_api_key_here
  ```
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete (~2 minutes)

## 🧪 Post-Deployment Testing

### 1. Basic Functionality
- [ ] Visit your Vercel URL
- [ ] Home page loads correctly
- [ ] Search bar is visible
- [ ] No console errors (F12 → Console)

### 2. Video Generation Flow
- [ ] Enter a topic (e.g., "Explain photosynthesis")
- [ ] Click search/generate
- [ ] Progress updates appear
- [ ] Video sections generate successfully
- [ ] Tree visualization displays

### 3. Video Playback
- [ ] Click on a video node in the tree
- [ ] Video player loads
- [ ] Video plays without errors
- [ ] Audio works
- [ ] Thumbnails display (for new videos)

### 4. Interactive Features
- [ ] Branch buttons work
- [ ] Questions appear
- [ ] Quiz functionality works (if enabled)
- [ ] Navigation works correctly

### 5. Mobile Testing (Optional)
- [ ] Open site on mobile device
- [ ] UI is responsive
- [ ] Videos play on mobile
- [ ] Touch interactions work

## 🔧 Troubleshooting

### Build Errors

**TypeScript errors:**
```bash
cd frontend
npm run build
# Fix any errors shown
```

**Dependency issues:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Runtime Errors

**"API key not configured"**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `VITE_ANTHROPIC_API_KEY` exists
3. Redeploy: Deployments → three dots → Redeploy

**"Network request failed" / CORS errors**
1. Check Modal backend is running
2. Test Modal endpoints directly:
   ```bash
   curl -X POST https://video-gen-2--main-video-generator-dev-generate-video-api.modal.run/ \
     -H "Content-Type: application/json" \
     -d '{"topic": "test"}'
   ```
3. If CORS issues persist, see `VERCEL_DEPLOYMENT.md` → Advanced section

**Videos don't load**
1. Check browser console for errors
2. Verify video URLs are valid (should be GCS URLs)
3. Check GCS bucket permissions and CORS settings

## 📊 Monitoring

### Vercel Dashboard
- [ ] Check deployment status: https://vercel.com/dashboard
- [ ] View build logs for any warnings
- [ ] Monitor usage: Dashboard → Usage

### Application Monitoring
- [ ] Check browser console for errors
- [ ] Monitor Modal backend logs
- [ ] Test periodically to ensure uptime

## 🔄 Continuous Deployment

Once set up, every push to `main` automatically deploys:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main
# Vercel automatically deploys! ✨
```

### Preview Deployments
- Every pull request gets a preview URL
- Test changes before merging
- Share preview with team

## 🎯 Production Checklist

Before sharing with users:

- [ ] All features tested and working
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Performance is acceptable
- [ ] Error handling works gracefully
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled (optional)

## 📝 Next Steps

1. **Custom Domain** (optional)
   - Go to Project Settings → Domains
   - Add your domain
   - Configure DNS

2. **Team Access** (optional)
   - Go to Project Settings → Team
   - Invite team members

3. **Monitoring** (recommended)
   - Enable Vercel Analytics
   - Set up error tracking (Sentry, etc.)

4. **Optimization** (optional)
   - Review bundle size: `npm run build`
   - Optimize images and assets
   - Enable Vercel Edge functions

## 📚 Documentation

- **Quick Start**: `/VERCEL_QUICKSTART.md`
- **Full Guide**: `/frontend/VERCEL_DEPLOYMENT.md`
- **Backend**: `/backend/modal/main_video_generator_dev_modular.py`

---

## ✨ Deployment Complete!

🎉 Congratulations! Your frontend is now live on Vercel.

**Share your URL**: `https://your-app.vercel.app`

**Support**: If you encounter issues, refer to the troubleshooting section or consult the full deployment guide.

---

*Last updated: November 2025*

