# ✅ Railway Deployment Verification Checklist

## Current Status: 404 Error - Service Not Running

The backend is still showing 404, which means the Railway service needs to be properly deployed.

---

## 🔍 Check These in Railway Dashboard

### 1. Service Status
- [ ] Go to Railway → Your Project → Your Service
- [ ] Check **Status**: Should be "Active" or "Running" (not "Stopped" or "Failed")
- [ ] If stopped, click **"Start"** or **"Redeploy"**

### 2. Root Directory
- [ ] Railway → Your Service → **Settings** → **Source**
- [ ] **Root Directory** should be: `server`
- [ ] If wrong, update it and redeploy

### 3. Build Status
- [ ] Railway → Your Service → **Deployments**
- [ ] Latest deployment should show **"Success"** (green checkmark)
- [ ] If failed (red X), click on it to see error logs

### 4. Environment Variables
- [ ] Railway → Your Service → **Variables** tab
- [ ] Verify these are set:
  ```
  MONGODB_URI=mongodb+srv://...
  FRONTEND_URL=https://boloforms-signature-engine.vercel.app
  ```
- [ ] **Note**: Railway automatically sets `PORT` - don't override it!

### 5. Public Domain
- [ ] Railway → Your Service → **Settings** → **Networking**
- [ ] Should show: `https://profound-charisma-production.up.railway.app`
- [ ] If not, click **"Generate Domain"**

### 6. Logs
- [ ] Railway → Your Service → **Logs** tab
- [ ] Check for errors like:
  - MongoDB connection errors
  - Port binding errors
  - Missing dependencies
  - Application crashes

---

## 🚨 Common Issues & Fixes

### Issue: "Application not found" (404)
**Possible Causes:**
1. Service not deployed
2. Service stopped/crashed
3. Wrong Root Directory
4. Build failed

**Fix:**
- Check service status in Railway
- Verify Root Directory is `server`
- Check deployment logs for errors
- Redeploy the service

### Issue: Build Fails
**Possible Causes:**
1. Missing `package.json` in server folder
2. Wrong Root Directory
3. Node.js version mismatch

**Fix:**
- Verify `server/package.json` exists
- Check Root Directory is `server`
- Check Railway logs for specific error

### Issue: Service Keeps Restarting
**Possible Causes:**
1. MongoDB connection error
2. Port already in use
3. Application crashes on startup

**Fix:**
- Check Railway logs for error messages
- Verify `MONGODB_URI` is correct
- Check MongoDB is accessible

### Issue: Port Error
**Possible Causes:**
1. Using hardcoded port instead of `process.env.PORT`

**Fix:**
- Verify `server/index.js` uses: `const PORT = process.env.PORT || 3001;`
- Railway sets `PORT` automatically - don't override it

---

## ✅ Verification Steps

### 1. Check Service is Running
```
Railway Dashboard → Service → Status = "Active"
```

### 2. Check Latest Deployment
```
Railway Dashboard → Service → Deployments → Latest = "Success"
```

### 3. Check Logs
```
Railway Dashboard → Service → Logs
Should see: "🚀 Backend server running on port XXXX"
Should see: "✅ MongoDB connected"
```

### 4. Test Health Endpoint
```
https://profound-charisma-production.up.railway.app/health
Should return: {"status":"ok","timestamp":"..."}
```

---

## 📋 Quick Fix Checklist

If service is not working:

1. [ ] **Check Root Directory**: Must be `server`
2. [ ] **Check Environment Variables**: `MONGODB_URI` and `FRONTEND_URL` set
3. [ ] **Check Service Status**: Should be "Active"
4. [ ] **Check Deployment**: Latest should be "Success"
5. [ ] **Check Logs**: Look for errors
6. [ ] **Redeploy**: Click "Redeploy" button if needed

---

## 🔧 Manual Redeploy

If everything looks correct but still 404:

1. Railway → Your Service → **Deployments**
2. Click **"Redeploy"** button
3. Wait for deployment to complete
4. Check logs for "Backend server running"
5. Test health endpoint again

---

## 📞 What to Check Right Now

1. **Railway Dashboard**: https://railway.app
2. **Service Status**: Is it "Active"?
3. **Latest Deployment**: Is it "Success"?
4. **Logs**: Any errors?
5. **Root Directory**: Is it `server`?

Once all these are correct, the backend should work! 🚀

