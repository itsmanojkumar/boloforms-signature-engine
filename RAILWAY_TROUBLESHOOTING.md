# ⚠️ Railway Connection Issue - Application Not Found

## Problem
Backend health check returns: `{"status":"error","code":404,"message":"Application not found"}`

This means the Railway service is **not deployed** or **not running**.

---

## ✅ Solution: Deploy/Redeploy Railway Service

### Step 1: Check Railway Dashboard

1. Go to: https://railway.app
2. Log in with GitHub
3. Check if you have a project with a backend service

### Step 2: If Service Doesn't Exist - Create It

1. **New Project** → **Deploy from GitHub repo**
2. Select repository: `itsmanojkumar/boloforms-signature-engine`
3. **Important**: Set **Root Directory** to `server`
4. Railway will auto-detect Node.js and start building

### Step 3: If Service Exists - Check Status

1. Open your project in Railway
2. Click on your backend service
3. Check:
   - **Status**: Should be "Active" or "Running"
   - **Deployments**: Latest deployment should be "Success"
   - **Logs**: Check for errors

### Step 4: Add Environment Variables

In Railway → Your service → **Variables** tab, add:

```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/boloforms?retryWrites=true&w=majority
FRONTEND_URL=https://boloforms-signature-engine.vercel.app
```

**Get MongoDB URI:**
- **Option A**: Railway MongoDB (easiest)
  - Railway project → "New" → "Database" → "MongoDB"
  - Copy `MONGO_URL` from Variables tab
- **Option B**: MongoDB Atlas
  - https://www.mongodb.com/cloud/atlas
  - Create free cluster → Get connection string

### Step 5: Generate Public Domain

1. Railway → Your service → **Settings** → **Networking**
2. Click **"Generate Domain"** (if not already generated)
3. You should get: `https://profound-charisma.up.railway.app` (or similar)

### Step 6: Redeploy

1. Railway → Your service → **Deployments**
2. Click **"Redeploy"** or push new code to GitHub (auto-deploys)

---

## 🔍 Verify Deployment

After deployment, test:

```bash
# Test health endpoint
Invoke-WebRequest -Uri "https://profound-charisma.up.railway.app/health" -UseBasicParsing
```

**Expected Response:**
```json
{"status":"ok","timestamp":"2024-..."}
```

---

## 📋 Deployment Checklist

- [ ] Railway project exists
- [ ] Backend service created
- [ ] Root Directory set to `server`
- [ ] Environment variables added (MONGODB_URI, FRONTEND_URL)
- [ ] Public domain generated
- [ ] Service deployed successfully
- [ ] Health endpoint responds with `{"status":"ok"}`

---

## 🚨 Common Issues

### "Application not found" (404)
- **Cause**: Service not deployed or stopped
- **Fix**: Deploy/redeploy service in Railway

### Build fails
- **Cause**: Missing dependencies or wrong root directory
- **Fix**: Check Root Directory is `server`, check Railway logs

### MongoDB connection error
- **Cause**: Wrong MONGODB_URI or MongoDB not accessible
- **Fix**: Verify MongoDB URI, check Network Access in MongoDB Atlas

### Service keeps restarting
- **Cause**: Application crashes on startup
- **Fix**: Check Railway logs for errors, verify environment variables

---

## 📞 Next Steps

1. **Check Railway Dashboard**: https://railway.app
2. **Verify Service Status**: Should show "Active"
3. **Check Logs**: Look for any errors
4. **Test Health Endpoint**: Should return `{"status":"ok"}`

Once the service is deployed and running, the frontend will automatically connect!




