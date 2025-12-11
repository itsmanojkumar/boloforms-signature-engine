# 🔍 Railway Backend Connection Check

## Current Status: ⚠️ 500 Internal Server Error

**Backend URL**: `https://profound-charisma-production.up.railway.app`  
**Status**: Backend is deployed and accessible, but returning **500 Internal Server Error**

This means:
- ✅ Backend is deployed on Railway
- ✅ Network connection is working
- ❌ Application is crashing on startup or request handling

---

## 🔧 How to Check Railway Logs

### Option 1: Railway Dashboard (Easiest)

1. Go to **Railway Dashboard**: https://railway.app
2. Navigate to your project → your service
3. Click on **"Logs"** tab
4. Look for error messages (usually in red)

**Common errors to look for:**
- MongoDB connection errors
- Missing environment variables
- Port binding errors
- Module import errors

### Option 2: Railway CLI (If Authenticated)

```bash
# Login first (opens browser)
railway login

# Link to your project
railway link

# View logs
railway logs

# View status
railway status
```

### Option 3: Railway MCP Server (In Cursor)

To use Railway MCP server in Cursor:

1. **Configure MCP Server**:
   - Open Cursor Settings (`Ctrl+,`)
   - Search for "MCP" or "Model Context Protocol"
   - Add Railway MCP server:
     ```json
     {
       "name": "railway",
       "command": "npx",
       "args": ["-y", "@railway/cli", "mcp"]
     }
     ```

2. **Install Dependencies**:
   ```bash
   npm install -g graphql @railway/cli
   ```

3. **Login**:
   ```bash
   railway login
   ```

4. **Restart Cursor** and try asking: "Show me Railway logs"

---

## 🚨 Common 500 Error Causes

### 1. MongoDB Connection Error
**Symptoms**: Logs show `ECONNREFUSED` or `MongoServerError`

**Fix**: Check `MONGODB_URI` environment variable in Railway:
- Railway → Your Service → Variables
- Ensure `MONGODB_URI` is set correctly
- Format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

### 2. Missing Environment Variables
**Symptoms**: Logs show `undefined` or `process.env.X is not defined`

**Fix**: Add missing variables in Railway:
- Railway → Your Service → Variables
- Add: `FRONTEND_URL=https://boloforms-signature-engine.vercel.app`

### 3. Port Binding Error
**Symptoms**: Logs show `EADDRINUSE` or port errors

**Fix**: Ensure `server/index.js` uses:
```javascript
const PORT = process.env.PORT || 3001;
```
Railway sets `PORT` automatically - don't hardcode it!

### 4. Module Import Error
**Symptoms**: Logs show `Cannot find module` or `require is not defined`

**Fix**: Check `server/package.json` has all dependencies:
```bash
cd server
npm install
```

---

## ✅ Quick Fix Steps

1. **Check Railway Logs** (Dashboard → Logs tab)
2. **Identify the error** from logs
3. **Fix the issue** (usually MongoDB or env vars)
4. **Redeploy** if needed (Railway auto-redeploys on git push)

---

## 📋 Verification Checklist

- [ ] Backend URL is accessible (not 404)
- [ ] Check Railway logs for specific error
- [ ] Verify `MONGODB_URI` is set in Railway
- [ ] Verify `FRONTEND_URL` is set in Railway
- [ ] Check `server/package.json` has all dependencies
- [ ] Verify Root Directory is `server` in Railway settings
- [ ] Check latest deployment status (should be "Success")

---

## 🔗 Test Endpoints

Once fixed, test these endpoints:

1. **Health Check**:
   ```
   GET https://profound-charisma-production.up.railway.app/health
   Expected: {"status":"ok","timestamp":"..."}
   ```

2. **Sign PDF**:
   ```
   POST https://profound-charisma-production.up.railway.app/sign-pdf
   Body: { "pdfId": "test", "fields": [...] }
   ```

---

## 📞 Next Steps

1. **Check Railway Dashboard Logs** to see the exact error
2. **Share the error message** so I can help fix it
3. **Or configure Railway MCP server** to check logs from Cursor

The backend is connected, but there's an application error that needs to be fixed! 🚀



