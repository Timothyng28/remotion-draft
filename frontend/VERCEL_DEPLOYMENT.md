# 🚀 Vercel Deployment Guide

Complete guide to deploy the frontend to Vercel.

## Prerequisites

- [Vercel Account](https://vercel.com/signup) (free tier works)
- [Vercel CLI](https://vercel.com/docs/cli) (optional, for command-line deployment)
- Modal backend already deployed (main-video-generator-dev)

## Quick Deploy

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Add Vercel configuration"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/new)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add: `VITE_ANTHROPIC_API_KEY` = `your_anthropic_api_key`
   - (Other Modal endpoints are already hardcoded in the services)

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your app will be live at `https://your-app.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from frontend directory**
   ```bash
   cd frontend
   vercel
   ```

4. **Follow prompts**
   - Set up and deploy? `Y`
   - Which scope? Select your account
   - Link to existing project? `N`
   - What's your project's name? `remotion-video-app` (or your choice)
   - In which directory is your code located? `./`
   - Want to override settings? `N`

5. **Add environment variables**
   ```bash
   vercel env add VITE_ANTHROPIC_API_KEY
   # Paste your API key when prompted
   # Select: Production, Preview, Development (all)
   ```

6. **Deploy to production**
   ```bash
   vercel --prod
   ```

## Configuration Files

### `vercel.json`
Already created with:
- ✅ SPA routing (all routes → index.html)
- ✅ Security headers
- ✅ Vite build configuration

### `.env.example`
Template for environment variables needed.

## Environment Variables

### Required

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `VITE_ANTHROPIC_API_KEY` | Anthropic Claude API key | [console.anthropic.com](https://console.anthropic.com) |

### Optional (Already configured)

The following Modal endpoints are hardcoded in the services:
- Video Generation API
- Embedding APIs
- Description Generation API
- Reflection Questions API

If you need to override these, you can add custom environment variables to Vercel.

## Post-Deployment

### 1. Test the Deployment

Visit your Vercel URL and test:
- ✅ Home page loads
- ✅ Search functionality works
- ✅ Video generation starts (requires Modal backend)
- ✅ Tree visualization displays
- ✅ Video playback works

### 2. Update Modal Backend CORS (if needed)

If you encounter CORS issues, update your Modal backend to allow your Vercel domain:

```python
# In your Modal endpoints, add:
from fastapi.middleware.cors import CORSMiddleware

@app.function(...)
@modal.asgi_app()
def web():
    from fastapi import FastAPI
    app = FastAPI()
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://your-app.vercel.app",
            "http://localhost:3000"  # for local dev
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    return app
```

### 3. Set up Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Wait for SSL certificate (automatic)

## Continuous Deployment

Vercel automatically redeploys on every push to `main` branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel automatically deploys! 🎉
```

## Monitoring

### View Deployment Logs
1. Go to Vercel Dashboard
2. Select your project
3. Click on a deployment
4. View "Build Logs" and "Function Logs"

### Analytics (Optional)
- Vercel provides built-in analytics
- Go to Project → Analytics tab
- View page views, performance metrics

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
```bash
# Solution: Ensure all dependencies are in package.json
cd frontend
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

**Error: "Out of memory"**
```bash
# Solution: Increase Node memory in vercel.json
{
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=4096"
    }
  }
}
```

### Runtime Issues

**Error: "API key not configured"**
- Check environment variables in Vercel dashboard
- Ensure `VITE_ANTHROPIC_API_KEY` is set
- Redeploy after adding variables

**Error: "Network request failed"**
- Check Modal backend is deployed and running
- Test Modal endpoints directly
- Check browser console for CORS errors

### CORS Issues

If you see CORS errors in browser console:

1. **Option 1**: Update Modal backend to allow your Vercel domain
2. **Option 2**: Use Vercel serverless functions as proxy (see Advanced Setup)

## Advanced: Serverless Function Proxy (Optional)

If you need to proxy requests to avoid CORS:

Create `frontend/api/proxy.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { url, ...options } = req.body;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy request failed' });
  }
}
```

Update `package.json`:
```json
{
  "devDependencies": {
    "@vercel/node": "^3.0.0"
  }
}
```

## Performance Optimization

### 1. Enable Edge Functions
Already configured in `vercel.json` for optimal performance.

### 2. Image Optimization
Vercel automatically optimizes images. Use:
```tsx
<img src="/image.png" alt="..." />
// Vercel serves optimized version automatically
```

### 3. Code Splitting
Vite handles this automatically. Check bundle size:
```bash
npm run build
# Check dist/ folder sizes
```

## Cost Estimation

### Free Tier Includes:
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic SSL
- ✅ Preview deployments
- ✅ DDoS protection

### Monitoring Usage:
1. Go to Dashboard → Usage
2. Check bandwidth and build minutes
3. Upgrade if needed (starts at $20/month)

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Vite Documentation](https://vitejs.dev/)

## Next Steps

1. ✅ Deploy frontend to Vercel
2. ✅ Test all features
3. 📱 Share URL with users
4. 📊 Monitor analytics
5. 🚀 Iterate and improve!

---

**Your frontend is now live! 🎉**

Visit `https://your-app.vercel.app` to see it in action.

