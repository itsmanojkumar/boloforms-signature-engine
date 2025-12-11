# Railway Deployment Guide

## Quick Start

### 1. Create Railway Account
- Go to https://railway.app
- Sign up with GitHub

### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your repository: `itsmanojkumar/boloforms-signature-engine`

### 3. Configure Service
- **Root Directory**: Set to `server` (important!)
- Railway will auto-detect Node.js

### 4. Add Environment Variables
In Railway dashboard → Your service → Variables tab, add:

```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/boloforms?retryWrites=true&w=majority
FRONTEND_URL=https://boloforms-signature-engine.vercel.app
```

**Note**: The frontend URL is also hardcoded in `server/index.js` for immediate CORS support.

**Note**: Railway automatically sets `PORT` - don't override it!

### 5. Get MongoDB Connection String

#### Option A: Railway MongoDB (Easiest)
1. In Railway project → "New" → "Database" → "MongoDB"
2. Railway creates MongoDB automatically
3. Click on MongoDB service → "Variables" tab
4. Copy `MONGO_URL` → Use as `MONGODB_URI`

#### Option B: MongoDB Atlas (Free)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create free cluster (M0)
4. Database Access → Create database user
5. Network Access → Add IP `0.0.0.0/0` (allow all)
6. Connect → Get connection string
7. Replace `<password>` with your password
8. Use as `MONGODB_URI`

### 6. Deploy
- Railway will automatically deploy when you push to GitHub
- Or click "Deploy" button in Railway dashboard
- Wait for deployment to complete

### 7. Get Your Backend URL
- Railway provides a URL like: `https://your-app.up.railway.app`
- Copy this URL

### 8. Update Frontend (Vercel)
1. Go to Vercel dashboard → Your project
2. Settings → Environment Variables
3. Add/Update:
   ```
   NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
   ```
4. Redeploy frontend

## Testing

After deployment, test your backend:

```bash
# Health check
curl https://your-app.up.railway.app/health

# Should return:
# {"status":"ok","timestamp":"2024-..."}
```

## Troubleshooting

### Build Fails
- Check Root Directory is set to `server`
- Check `package.json` has `start` script: `"start": "node index.js"`

### MongoDB Connection Error
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas Network Access allows all IPs (`0.0.0.0/0`)
- Check database user credentials

### CORS Errors
- Make sure `FRONTEND_URL` is set to your Vercel URL
- Check browser console for exact error

### File Upload Issues
- Railway provides persistent storage, but files may be lost on redeploy
- For production, consider using cloud storage (S3, Cloudinary)

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Server port (Railway sets automatically) | `3001` |
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb+srv://...` |
| `FRONTEND_URL` | Recommended | Your Vercel frontend URL | `https://app.vercel.app` |
| `NODE_ENV` | No | Environment (Railway sets automatically) | `production` |

## Monitoring

- Railway dashboard shows logs in real-time
- Check "Metrics" tab for CPU/Memory usage
- Check "Logs" tab for application logs

## Custom Domain (Optional)

1. Railway → Your service → Settings → Networking
2. Add custom domain
3. Update DNS records as instructed
4. Update `FRONTEND_URL` if needed

