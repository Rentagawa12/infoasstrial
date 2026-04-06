# Render.com Deployment Guide
## Lost & Found @ TIP Manila

## 🚀 Quick Deploy Steps

### **Method 1: Deploy via Render Dashboard (Recommended)**

#### Step 1: Push Code to GitHub
```bash
cd C:\Users\migue\Downloads\infoasstrial
git add .
git commit -m "Ready for Render deployment - Complete System Integration"
git push origin main
```

#### Step 2: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub account
3. Authorize Render to access your repositories

#### Step 3: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `Rentagawa12/infoasstrial`
3. Configure the service:

**Basic Settings:**
- **Name**: `lost-and-found-tip`
- **Environment**: `Docker`
- **Branch**: `main`
- **Region**: Choose closest to Philippines (Singapore)

**Build Settings:**
- **Dockerfile Path**: `Dockerfile` (auto-detected)
- **Docker Build Context**: `.` (root directory)

#### Step 4: Add Environment Variables
Click **"Add Environment Variable"** and add these:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Production mode |
| `MONGO_URI` | `mongodb+srv://miguel:miguelito12@lostandfound.tpd9hq2.mongodb.net/?appName=lostandfound` | Your MongoDB Atlas connection |
| `JWT_SECRET` | `96799a650722b9ee24f4299c28fac7b429e178d9509d524e4ff5e71a1796b21f` | Your JWT secret key |
| `PORT` | `10000` | Render uses port 10000 |

**⚠️ IMPORTANT**: Mark `MONGO_URI` and `JWT_SECRET` as **"Secret"** (not visible in logs)

#### Step 5: Configure Advanced Settings (Optional)
- **Auto-Deploy**: Enable (deploys on every push to main)
- **Health Check Path**: `/health`
- **Docker Command**: `node BACKEND/server.js` (already in Dockerfile)

#### Step 6: Create & Deploy
1. Click **"Create Web Service"**
2. Wait for initial build (5-10 minutes)
3. Monitor deployment logs

#### Step 7: Verify Deployment
Once deployed, you'll get a URL like: `https://lost-and-found-tip.onrender.com`

Test it:
```bash
# Health check
curl https://lost-and-found-tip.onrender.com/health

# Expected response:
{
  "status": "ok",
  "mongodb": "connected",
  "uptime": 123.45,
  "memoryMB": "45.67",
  "timestamp": "2025-06-15T..."
}
```

---

### **Method 2: Deploy via render.yaml (Infrastructure as Code)**

**Note**: `render.yaml` is now in the root directory.

#### Step 1: Verify render.yaml
The file `render.yaml` is already configured in the root directory.

#### Step 2: Deploy from Dashboard
1. Go to Render Dashboard
2. Click **"New +"** → **"Blueprint"**
3. Connect repository: `Rentagawa12/infoasstrial`
4. Render will auto-detect `render.yaml` in the root
5. Add environment variable **values** for:
   - `MONGO_URI`: `mongodb+srv://miguel:miguelito12@lostandfound.tpd9hq2.mongodb.net/?appName=lostandfound`
   - `JWT_SECRET`: `96799a650722b9ee24f4299c28fac7b429e178d9509d524e4ff5e71a1796b21f`
6. Click **"Apply"**

**Note**: You still need to provide the actual values for `MONGO_URI` and `JWT_SECRET` in the dashboard since `sync: false` means they're not stored in the file.

---

## 📋 Pre-Deployment Checklist

- [x] Code pushed to GitHub
- [x] MongoDB Atlas cluster running and accessible
- [x] MongoDB connection string updated
- [x] JWT_SECRET generated (never commit to git!)
- [x] Dockerfile exists and is valid
- [x] .env file NOT committed (in .gitignore)
- [x] Health endpoint implemented (/health)
- [x] CORS configured (allow your frontend domain)
- [x] Port configuration (use process.env.PORT)

---

## 🔧 Post-Deployment Configuration

### 1. Update CORS Settings
After deployment, update `BACKEND/server.js` to allow your Render domain:

```javascript
app.use(cors({
    origin: [
        '*', // Development
        'https://lost-and-found-tip.onrender.com', // Production
        'http://localhost:3000' // Local frontend
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
```

### 2. Set Up Custom Domain (Optional)
1. Go to your service settings
2. Click **"Custom Domains"**
3. Add your domain (e.g., `lostandfound.tip.edu.ph`)
4. Update DNS records as instructed

### 3. Configure Persistent Storage
Render automatically mounts the disk defined in render.yaml:
- **Path**: `/app/BACKEND/uploads`
- **Size**: 1 GB
- **Purpose**: Store uploaded item images

---

## 🔍 Monitoring & Logs

### View Logs
1. Go to your service in Render Dashboard
2. Click **"Logs"** tab
3. Monitor real-time logs

### Health Monitoring
Render automatically monitors `/health` endpoint:
- **Green**: Service healthy
- **Yellow**: Health check failing
- **Red**: Service down

### Set Up Alerts
1. Go to **"Settings"** → **"Notifications"**
2. Add email/Slack for deployment notifications
3. Enable health check alerts

---

## 🔐 Security Considerations

### 1. Environment Variables
✅ **NEVER** commit `.env` to GitHub  
✅ Use Render's environment variable system  
✅ Mark secrets as "Secret" in Render dashboard

### 2. MongoDB Access
✅ Whitelist Render's IP in MongoDB Atlas:
1. Go to MongoDB Atlas → Network Access
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Or add specific Render IPs

### 3. Rate Limiting
✅ Already implemented in your app  
✅ Protects against DDoS attacks

---

## 🚨 Troubleshooting

### Issue: Build Fails
**Solution:**
1. Check Dockerfile path is correct
2. Ensure `package.json` has all dependencies
3. Review build logs in Render dashboard

### Issue: "Cannot connect to MongoDB"
**Solution:**
1. Verify `MONGO_URI` environment variable
2. Check MongoDB Atlas Network Access (allow all IPs: 0.0.0.0/0)
3. Test connection string locally

### Issue: Health Check Failing
**Solution:**
1. Ensure `/health` endpoint returns 200 status
2. Check if MongoDB connection is successful
3. Verify PORT environment variable

### Issue: File Uploads Not Persisting
**Solution:**
1. Ensure disk is mounted in render.yaml
2. Check uploads directory path: `/app/BACKEND/uploads`
3. Verify disk is created in Render dashboard

### Issue: CORS Errors
**Solution:**
Update CORS configuration to include Render domain:
```javascript
origin: ['https://your-app.onrender.com', '*']
```

---

## 📊 Deployment Metrics

After deployment, monitor:
- **Response Time**: Should be < 500ms
- **Memory Usage**: Should be < 512MB
- **CPU Usage**: Monitor in Render dashboard
- **Request Rate**: Check analytics

---

## 💰 Render Pricing

**Free Tier** (sufficient for this project):
- ✅ 750 hours/month
- ✅ Auto-sleep after 15 min inactivity
- ✅ Restarts on incoming request
- ✅ 0.1 CPU / 512 MB RAM

**Paid Plans** (if needed):
- Starter: $7/month - Always on, custom domain
- Standard: $25/month - More resources

---

## 🔄 CI/CD Integration

Your GitHub Actions pipeline is already configured!

**Auto-Deploy Flow:**
```
Push to main → GitHub Actions → Tests → Build Docker → Render Deploy Hook
```

To enable Render deploy hook in GitHub Actions:
1. Get deploy hook URL from Render
2. Add to GitHub Secrets as `RENDER_DEPLOY_HOOK_URL`
3. Already configured in `.github/workflows/ci-cd.yml`

---

## 📝 Final Deployment Commands

```bash
# 1. Commit all changes
git add .
git commit -m "Production ready - System Integration Project complete"

# 2. Push to GitHub
git push origin main

# 3. Monitor GitHub Actions
# Go to: https://github.com/Rentagawa12/infoasstrial/actions

# 4. Once tests pass, deploy to Render via dashboard
# Or wait for auto-deploy if configured

# 5. Test deployment
curl https://YOUR-APP.onrender.com/health

# 6. Test API endpoints
curl https://YOUR-APP.onrender.com/api/items
```

---

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ Health check returns 200 OK
- ✅ MongoDB connection shows "connected"
- ✅ Can register/login users
- ✅ Can create/view items
- ✅ File uploads work
- ✅ All API endpoints respond correctly

---

## 📞 Support

If you encounter issues:
1. Check Render logs first
2. Test locally with same environment variables
3. Review MongoDB Atlas connection
4. Check GitHub Actions for CI/CD issues

---

## 🔗 Quick Links

- **Render Dashboard**: https://dashboard.render.com
- **MongoDB Atlas**: https://cloud.mongodb.com
- **GitHub Repository**: https://github.com/Rentagawa12/infoasstrial
- **API Documentation**: See `files/API_DOCUMENTATION.md`

---

**Your app is ready to deploy! Follow Method 1 for the quickest deployment.**
