# 🚀 Quick Deployment Checklist

## Before You Deploy

### 1️⃣ Verify Environment Variables
- [ ] `MONGO_URI`: `mongodb+srv://miguel:miguelito12@lostandfound.tpd9hq2.mongodb.net/?appName=lostandfound`
- [ ] `JWT_SECRET`: `96799a650722b9ee24f4299c28fac7b429e178d9509d524e4ff5e71a1796b21f`
- [ ] `PORT`: Will be set by Render (10000)

### 2️⃣ MongoDB Atlas Setup
- [ ] Cluster is running
- [ ] Network Access: Allow all IPs (0.0.0.0/0)
- [ ] Database user exists with read/write permissions
- [ ] Connection string tested locally

### 3️⃣ GitHub Repository
- [ ] Code pushed to: https://github.com/Rentagawa12/infoasstrial
- [ ] All merge conflicts resolved ✅
- [ ] Tests passing ✅
- [ ] `.env` file NOT committed (should be in .gitignore)

### 4️⃣ Local Testing
```bash
cd BACKEND
npm install
npm test        # Should pass 35+ tests
npm start       # Test on http://localhost:5000
```

## Deployment Steps (Dashboard Method)

### Step 1: Go to Render
1. Open https://render.com
2. Sign in with GitHub
3. Authorize repository access

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Select repository: `Rentagawa12/infoasstrial`
3. Name: `lost-and-found-tip` (or your choice)
4. Environment: **Docker**
5. Branch: **main**
6. Region: **Singapore** (closest to PH)

### Step 3: Add Environment Variables

Click **Advanced** → **Add Environment Variable**:

```
NODE_ENV = production
MONGO_URI = mongodb+srv://miguel:miguelito12@lostandfound.tpd9hq2.mongodb.net/?appName=lostandfound
JWT_SECRET = 96799a650722b9ee24f4299c28fac7b429e178d9509d524e4ff5e71a1796b21f
```

⚠️ **Mark MONGO_URI and JWT_SECRET as "Secret"**

### Step 4: Health Check
- Path: `/health`
- Leave other settings as default

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for build
3. Watch logs for any errors

## After Deployment

### ✅ Verify Deployment
Your app will be at: `https://lost-and-found-tip.onrender.com` (or your chosen name)

**Test these endpoints:**

```bash
# 1. Health Check
curl https://YOUR-APP.onrender.com/health
# Expected: {"status":"ok","mongodb":"connected",...}

# 2. Get Items (Public)
curl https://YOUR-APP.onrender.com/api/items
# Expected: Array of items (might be empty)

# 3. Register User
curl -X POST https://YOUR-APP.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@tip.edu.ph","password":"Test123!"}'
# Expected: {token, user}

# 4. Login
curl -X POST https://YOUR-APP.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@tip.edu.ph","password":"Test123!"}'
# Expected: {token, user}
```

### 📊 Monitor
- **Logs**: Check in Render dashboard
- **Metrics**: View resource usage
- **Health**: Should show green checkmark

## Common Issues

### ❌ Build Failed
- Check Dockerfile path
- Verify package.json has all dependencies
- Review build logs

### ❌ Cannot Connect to MongoDB
- Check MONGO_URI is correct
- MongoDB Atlas: Network Access → Allow 0.0.0.0/0
- Verify database user credentials

### ❌ App Crashes on Startup
- Check logs for error messages
- Verify all environment variables are set
- Test locally with same env vars

### ❌ Health Check Failing
- Ensure `/health` endpoint works
- Check MongoDB connection in logs
- Verify PORT is set correctly

## Update CORS After Deployment

After you know your Render URL, update `BACKEND/server.js`:

```javascript
app.use(cors({
    origin: [
        'https://lost-and-found-tip.onrender.com', // Your Render URL
        'http://localhost:5000' // Local development
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
```

Then commit and push:
```bash
git add .
git commit -m "Update CORS for production"
git push origin main
```

Render will auto-deploy the update!

## 🎉 Deployment Complete!

Your API is live at: `https://YOUR-APP.onrender.com`

### Test with Postman
1. Open `BACKEND/postman_collection.json` in Postman
2. Update `base_url` variable to your Render URL
3. Test all endpoints

### Share Your API
- **Health**: https://YOUR-APP.onrender.com/health
- **Items**: https://YOUR-APP.onrender.com/api/items
- **Analytics**: https://YOUR-APP.onrender.com/api/analytics/category-distribution

---

**Need help?** Check `RENDER_DEPLOYMENT_GUIDE.md` for detailed troubleshooting.
