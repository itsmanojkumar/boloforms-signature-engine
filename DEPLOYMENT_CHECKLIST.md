# 🚀 Railway Deployment Checklist

## Pre-Deployment

- [x] ✅ Created `Procfile` for Railway
- [x] ✅ Created `railway.json` configuration
- [x] ✅ Updated CORS to allow Vercel frontend
- [x] ✅ Updated server to listen on `0.0.0.0` (required for Railway)
- [x] ✅ Created `.gitkeep` for uploads directory
- [x] ✅ Updated `.gitignore` to exclude uploaded PDFs

## Step-by-Step Deployment

### 1. Railway Setup
- [ ] Go to https://railway.app and sign up with GitHub
- [ ] Click "New Project" → "Deploy from GitHub repo"
- [ ] Select repository: `itsmanojkumar/boloforms-signature-engine`
- [ ] **Important**: Set Root Directory to `server`
- [ ] Railway will auto-detect Node.js and start building

### 2. MongoDB Setup

**Option A: Railway MongoDB (Recommended)**
- [ ] In Railway project → Click "New" → "Database" → "MongoDB"
- [ ] Railway creates MongoDB automatically
- [ ] Click on MongoDB service → "Variables" tab
- [ ] Copy `MONGO_URL` value

**Option B: MongoDB Atlas**
- [ ] Go to https://www.mongodb.com/cloud/atlas
- [ ] Create free account and cluster (M0)
- [ ] Database Access → Create database user
- [ ] Network Access → Add IP `0.0.0.0/0`
- [ ] Connect → Get connection string
- [ ] Replace `<password>` with your password

### 3. Environment Variables

In Railway → Your service → Variables tab, add:

```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/boloforms?retryWrites=true&w=majority
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**Note**: 
- Railway automatically sets `PORT` - don't override it!
- Replace `your-vercel-app.vercel.app` with your actual Vercel URL

### 4. Deploy
- [ ] Railway will auto-deploy on git push
- [ ] Or click "Deploy" button manually
- [ ] Wait for deployment to complete (check logs)
- [ ] Copy your Railway URL (e.g., `https://your-app.up.railway.app`)

### 5. Test Backend

```bash
# Health check
curl https://your-app.up.railway.app/health

# Should return:
# {"status":"ok","timestamp":"2024-..."}
```

### 6. Update Frontend (Vercel)

- [ ] Go to Vercel dashboard → Your project
- [ ] Settings → Environment Variables
- [ ] Add/Update: `NEXT_PUBLIC_API_URL=https://your-app.up.railway.app`
- [ ] Redeploy frontend

### 7. Verify End-to-End

- [ ] Open your Vercel frontend URL
- [ ] Upload a PDF
- [ ] Add some fields (text, signature, etc.)
- [ ] Click "Sign PDF"
- [ ] Verify the signed PDF downloads correctly
- [ ] Check Railway logs for any errors

## Troubleshooting

### Build Fails
- ✅ Check Root Directory is set to `server`
- ✅ Check `package.json` has `start` script
- ✅ Check Railway logs for specific error

### MongoDB Connection Error
- ✅ Verify `MONGODB_URI` format is correct
- ✅ Check MongoDB Atlas Network Access allows `0.0.0.0/0`
- ✅ Verify database user credentials

### CORS Errors
- ✅ Set `FRONTEND_URL` environment variable in Railway
- ✅ Make sure it matches your Vercel URL exactly
- ✅ Check browser console for exact error

### 502 Bad Gateway
- ✅ Check Railway logs
- ✅ Verify server is listening on `0.0.0.0` (already fixed)
- ✅ Check if MongoDB connection is successful

## Files Created for Railway

- ✅ `server/Procfile` - Tells Railway how to start the app
- ✅ `server/railway.json` - Railway configuration
- ✅ `server/RAILWAY_DEPLOYMENT.md` - Detailed deployment guide
- ✅ `server/uploads/signed-pdfs/.gitkeep` - Ensures directory exists

## Next Steps After Deployment

1. **Monitor**: Check Railway logs regularly
2. **Scale**: Railway auto-scales, but monitor usage
3. **Storage**: Consider cloud storage (S3) for production PDFs
4. **Custom Domain**: Add custom domain in Railway settings (optional)

## Quick Reference

- **Railway Dashboard**: https://railway.app
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **Vercel Dashboard**: https://vercel.com/dashboard

