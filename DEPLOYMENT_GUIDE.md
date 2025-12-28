# ImageSync Production Deployment Guide

## ✅ Tech Stack Compatibility Check

Your stack is **100% deployment-ready**:

| Component | Technology | Deployment Status |
|-----------|-----------|-------------------|
| Frontend | React + Vite | ✅ Compatible with all platforms |
| API Service | Node.js + Express | ✅ Cloud-ready |
| Worker Service | Node.js + BullMQ | ✅ Background worker ready |
| Database | Supabase PostgreSQL | ✅ Already cloud-hosted |
| Redis | Upstash | ✅ Already cloud-hosted |
| Storage | Supabase Storage | ✅ Already cloud-hosted |
| Auth | Google OAuth + Supabase | ✅ Production-ready |

---

## 🚀 Recommended Platform: Railway.app

**Why Railway?**
- ✅ Best for microservices (3 services in 1 project)
- ✅ GitHub auto-deployment
- ✅ Built-in environment variables
- ✅ Excellent Node.js support
- ✅ **$5/month free credit**
- ✅ Simple pricing: $0.000463/GB-hour

**Monthly Cost Estimate:**
- Railway: ~$5-10 (with free credit, possibly $0-5)
- Upstash Redis: **FREE** (you're using Free tier)
- Supabase: **FREE** (Free tier)
- **Total: $0-10/month to start**

---

## 📋 Pre-Deployment Checklist

### 1. Verify External Services

- [x] **Upstash Redis** - ✅ Already configured
- [ ] **Supabase Database** - Run schema.sql
- [ ] **Supabase Storage** - Create bucket `imported-images`
- [ ] **Google OAuth** - Configure redirect URIs
- [ ] **Google Drive API** - Get API key

### 2. Verify Code is Ready

- [x] Environment variables use `process.env`
- [x] `.env` files are gitignored
- [x] Frontend uses `VITE_API_URL` environment variable
- [x] All services tested locally

---

## Step 1: Prepare Supabase

### 1.1 Run Database Schema

1. Go to https://supabase.com → Your project
2. Click **SQL Editor** (left sidebar)
3. Click **New query**
4. Copy and paste from `api-service/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  google_drive_id VARCHAR(255) UNIQUE NOT NULL,
  size BIGINT NOT NULL DEFAULT 0,
  mime_type VARCHAR(100) NOT NULL,
  storage_path TEXT NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'google_drive',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_google_drive_id ON images(google_drive_id);
CREATE INDEX IF NOT EXISTS idx_source ON images(source);
CREATE INDEX IF NOT EXISTS idx_created_at ON images(created_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_images_updated_at 
  BEFORE UPDATE ON images 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

5. Click **Run** (or Ctrl+Enter)
6. Verify: You should see "Success. No rows returned"

### 1.2 Create Storage Bucket

1. Go to **Storage** (left sidebar)
2. Click **New bucket**
3. Name: `imported-images`
4. **Public bucket**: ✅ Check this
5. Click **Create bucket**

### 1.3 Get Credentials

Go to **Project Settings** → **API**:

Copy these for later:
- **Project URL**: `https://xxxxx.supabase.co`
- **anon public**: `eyJhbG...` (for frontend)
- **service_role**: `eyJhbG...` (for backend - keep secret!)

Go to **Project Settings** → **Database**:
- **Connection string** → **URI**: Copy for `DATABASE_URL`

---

## Step 2: Configure Google Cloud Console

### 2.1 Get Google Drive API Key

1. Go to https://console.cloud.google.com
2. Select your project (or create new)
3. **APIs & Services** → **Library**
4. Search "Google Drive API"
5. Click **Enable**
6. Go to **Credentials**
7. Click **Create Credentials** → **API Key**
8. Copy the API key
9. Click **Restrict Key**:
   - **API restrictions** → Select **Google Drive API**
   - **Save**

### 2.2 Configure OAuth 2.0

1. **APIs & Services** → **OAuth consent screen**
   - User Type: **External**
   - Fill required fields
   - Add your email as test user

2. **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `ImageSync`
   - **Authorized redirect URIs**: Add:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
   - Click **Create**
   - **Copy Client ID and Client Secret**

3. Go back to **Supabase**:
   - **Authentication** → **Providers** → **Google**
   - Enable Google
   - Paste Client ID and Client Secret
   - **Save**

---

## Step 3: Deploy to Railway

### 3.1 Create Railway Account & Project

1. Go to https://railway.app
2. **Sign up** with GitHub
3. Click **New Project**
4. Select **Deploy from GitHub repo**
5. **Install Railway** on your GitHub account
6. Select your **ImageSync** repository

### 3.2 Deploy API Service

1. Railway will auto-detect your repo
2. Click **Add Service** → **GitHub Repo**
3. Select `ImageSync` repo
4. Configure:
   - **Service Name**: `api-service`
   - **Root Directory**: `/api-service`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. **Add Environment Variables**:
   Click **Variables** tab, add these:

```env
PORT=3000
NODE_ENV=production

# Database (from Supabase)
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Redis (Upstash - you already have these)
REDIS_HOST=immune-kodiak-9670.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your_upstash_password

# Supabase
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (service role, NOT anon)
```

6. **Generate Domain**:
   - Go to **Settings** → **Networking**
   - Click **Generate Domain**
   - **Copy the URL** (e.g., `https://api-service-production-xxxx.up.railway.app`)

### 3.3 Deploy Worker Service

1. Click **Add Service** → **GitHub Repo**
2. Select `ImageSync` repo again
3. Configure:
   - **Service Name**: `worker-service`
   - **Root Directory**: `/worker-service`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Add Environment Variables**:
   Same as API service, PLUS:

```env
# All the same as API service
DATABASE_URL=...
REDIS_HOST=...
REDIS_PORT=...
REDIS_PASSWORD=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Plus this one:
GOOGLE_API_KEY=AIzaSyD... (from Step 2.1)
```

5. **No domain needed** (background worker)

### 3.4 Deploy Frontend

1. Click **Add Service** → **GitHub Repo**
2. Select `ImageSync` repo again
3. Configure:
   - **Service Name**: `frontend`
   - **Root Directory**: `/frontend`
   - **Build Command**: `npm run build`
   - **Start Command**: Leave empty (static site)

4. **Add Environment Variables**:

```env
# Backend API URL (from step 3.2)
VITE_API_URL=https://api-service-production-xxxx.up.railway.app/api

# Supabase (use anon key, NOT service role)
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG... (anon/public key)
```

5. **Generate Domain**:
   - Settings → Networking → Generate Domain
   - **Copy the frontend URL**

---

## Step 4: Update CORS & OAuth

### 4.1 Update API CORS

1. Open `api-service/index.js` in your code
2. Find `allowedOrigins` array (around line 12)
3. Add your Railway frontend URL:

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://frontend-production-xxxx.up.railway.app' // Add this
];
```

4. **Commit and push**:
```bash
git add api-service/index.js
git commit -m "Add production CORS origin"
git push origin main
```

Railway will **auto-deploy** the update!

### 4.2 Update Google OAuth

1. Go to **Google Cloud Console**
2. **Credentials** → Your OAuth Client ID
3. **Authorized redirect URIs** → Add:
   ```
   https://frontend-production-xxxx.up.railway.app
   ```
4. **Save**

### 4.3 Update Supabase

1. Go to **Supabase** → **Authentication** → **URL Configuration**
2. **Site URL**: `https://frontend-production-xxxx.up.railway.app`
3. **Redirect URLs**: Add `https://frontend-production-xxxx.up.railway.app/**`
4. **Save**

---

## Step 5: Verify Deployment

### 5.1 Test API Health

Open browser or use curl:
```bash
curl https://api-service-production-xxxx.up.railway.app/api/health
```

Expected response:
```json
{
  "success": true,
  "service": "api",
  "timestamp": "2025-12-28T...",
  "status": "healthy"
}
```

### 5.2 Test Frontend

1. Open your frontend URL in browser
2. Click **Sign in with Google**
3. Complete OAuth flow
4. Verify you're redirected back and logged in

### 5.3 Test Image Import

1. Create a Google Drive folder
2. Add 2-3 test images
3. **Share** → **Anyone with the link can view**
4. Copy folder URL
5. Paste in your deployed app
6. Click **Start Import**
7. Watch progress bar
8. Verify images appear in gallery

### 5.4 Check Logs

**In Railway:**
- Each service has a **Deployments** tab
- Click on latest deployment → **View Logs**
- Verify no errors

Look for:
```
✅ API Service running on port 3000
🎯 Worker Service Started
👂 Listening for jobs on queue: image-import
```

---

## Step 6: Production Checklist

- [ ] All 3 services deployed successfully
- [ ] Environment variables set correctly
- [ ] Database schema applied in Supabase
- [ ] Storage bucket `imported-images` created (public)
- [ ] Google OAuth configured with production URLs
- [ ] CORS updated with production frontend URL
- [ ] API health check returns 200
- [ ] Authentication works (Google login)
- [ ] Image import completes successfully
- [ ] No errors in Railway logs

---

## 🎯 Post-Deployment

### Monitor Your Application

**Railway Dashboard:**
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time logs for each service
- **Deployments**: History and rollback capability

**Set up Alerts:**
1. Railway → Service → **Settings** → **Notifications**
2. Get notified for:
   - Deployment failures
   - High resource usage
   - Service crashes

### Update Your README

Add to your `README.md`:
```markdown
## Production URLs

- **Frontend**: https://frontend-production-xxxx.up.railway.app
- **API**: https://api-service-production-xxxx.up.railway.app
- **Status**: All services operational ✅
```

---

## 🔧 Troubleshooting

### API Service Won't Start

**Check:**
1. Railway logs for specific error
2. All environment variables are set
3. Database URL is correct
4. Upstash Redis credentials are correct

**Test connections:**
```bash
# In your local api-service folder
node test-db.js
node test-radis.js
```

### Worker Service Not Processing

**Check:**
1. Same Redis credentials as API service
2. GOOGLE_API_KEY is set
3. Worker logs show "Listening for jobs"

### Frontend Can't Connect

**Check:**
1. `VITE_API_URL` points to Railway API domain
2. CORS includes frontend domain in `allowedOrigins`
3. API service is running (check Railway status)

### Authentication Fails

**Check:**
1. OAuth redirect URIs match exactly (no trailing slash differences)
2. Supabase Site URL is correct
3. `VITE_SUPABASE_ANON_KEY` is the anon key (not service role)

---

## 💰 Cost Management

### Railway Pricing

**Free tier**: $5 credit/month (resets monthly)

**Usage-based pricing**:
- CPU: ~$0.000463 per GB-hour
- Memory: Included
- Network: 100GB included

**Estimate for ImageSync:**
- API Service: ~$2-4/month
- Worker Service: ~$1-3/month (varies by usage)
- Frontend: ~$1/month
- **Total: ~$4-8/month**

**With $5 free credit: $0-3/month actual cost**

### Optimize Costs

1. **Scale down when not in use**:
   - Railway → Service → Settings → **Sleep inactive services**

2. **Monitor usage**:
   - Dashboard → **Usage** tab
   - Set budget alerts

3. **Optimize worker**:
   - Reduce concurrency if not needed
   - Use cron jobs instead of always-on if low traffic

---

## 🔄 Continuous Deployment

**Auto-deploy is already set up!**

Every time you push to `main` branch:
1. Railway detects changes
2. Builds affected services
3. Deploys automatically
4. Zero downtime

**To deploy updates:**
```bash
git add .
git commit -m "Your update message"
git push origin main
```

Watch Railway dashboard for deployment status!

---

## 🎉 You're Live!

Your ImageSync application is now **production-ready** and deployed!

### Quick Reference URLs

- **Railway Dashboard**: https://railway.app/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Upstash Console**: https://console.upstash.com
- **Google Console**: https://console.cloud.google.com

### Next Steps

1. **Share your app** with users
2. **Monitor** Railway metrics
3. **Update** features as needed
4. **Scale** when traffic grows

---

## 📞 Support

**Issues?**
1. Check Railway logs
2. Check Supabase logs
3. Verify environment variables
4. Test each service health endpoint

**Resources:**
- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs
- Upstash Docs: https://docs.upstash.com

---

**Congratulations on your deployment! 🚀**
