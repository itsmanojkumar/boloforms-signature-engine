# 🔧 Fix Railway 500 Internal Server Error

## Current Status
✅ **Domain configured correctly**: `profound-charisma-production.up.railway.app`  
❌ **Backend returning 500 error**: Application is running but encountering an error

---

## 🔍 Check Railway Logs

The 500 error means the app is running but crashing. Check Railway logs:

1. **Railway Dashboard** → Your Service → **Logs** tab
2. Look for error messages like:
   - MongoDB connection errors
   - Missing environment variables
   - Application crashes
   - Port binding errors

---

## 🚨 Common Causes & Fixes

### 1. MongoDB Connection Error

**Error in logs:**
```
❌ MongoDB connection error: ...
```

**Fix:**
- Check `MONGODB_URI` environment variable is set in Railway
- Verify MongoDB URI format is correct
- Check MongoDB Atlas Network Access allows all IPs (`0.0.0.0/0`)

**Set in Railway:**
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/boloforms
```

### 2. Missing Environment Variables

**Error in logs:**
```
ReferenceError: process.env.XXX is not defined
```

**Fix:**
- Add all required environment variables in Railway → Variables tab:
  - `MONGODB_URI` (required)
  - `FRONTEND_URL` (optional, but recommended)

### 3. Port Configuration Issue

**Note:** Railway shows "Port 8080" in networking, but:
- Railway automatically sets `PORT` environment variable
- Our app uses: `const PORT = process.env.PORT || 3001;`
- This should work automatically - **don't override PORT**

### 4. Application Startup Error

**Error in logs:**
```
Error: Cannot find module '...'
```

**Fix:**
- Check `server/package.json` has all dependencies
- Railway should auto-install on deploy
- Check build logs for missing dependencies

---

## ✅ Quick Fix Steps

1. **Check Railway Logs**
   - Railway → Your Service → Logs
   - Copy the error message

2. **Verify Environment Variables**
   - Railway → Your Service → Variables
   - Ensure `MONGODB_URI` is set correctly

3. **Check MongoDB Connection**
   - Verify MongoDB Atlas cluster is running
   - Check Network Access allows `0.0.0.0/0`
   - Test MongoDB connection string

4. **Redeploy**
   - Railway → Your Service → Deployments
   - Click "Redeploy" to restart with fresh environment

---

## 🔍 What to Look For in Logs

**Good logs should show:**
```
✅ MongoDB connected
🚀 Backend server running on port XXXX
📁 Uploads directory: /app/uploads/signed-pdfs
🌍 Environment: production
🔗 MongoDB: Configured
```

**Bad logs might show:**
```
❌ MongoDB connection error: ...
Error: ...
ReferenceError: ...
Cannot find module: ...
```

---

## 📋 Action Items

1. [ ] Check Railway logs for specific error
2. [ ] Verify `MONGODB_URI` is set correctly
3. [ ] Check MongoDB is accessible
4. [ ] Verify all environment variables are set
5. [ ] Redeploy if needed

---

## 💡 Next Steps

Once you check the Railway logs, share the error message and I can help fix it!

The domain is correctly configured - we just need to fix the application error. 🚀

