# Quick Start - Backend Connection

## Step 1: Create Environment File

Create a file named `.env` in the `server/` directory with the following content:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/boloforms
```

**For MongoDB Atlas (Cloud):**
```env
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/boloforms
```

## Step 2: Install Dependencies (Already Done ✅)

Dependencies are already installed. If you need to reinstall:

```bash
cd server
npm install
```

## Step 3: Start MongoDB

**Windows:**
```bash
net start MongoDB
```

**macOS/Linux:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

## Step 4: Start Backend Server

```bash
cd server
npm start
```

Or for development with auto-reload:

```bash
cd server
npm run dev
```

The backend will start on `http://localhost:3001`

## Step 5: Verify Connection

1. Open `http://localhost:3001/health` in your browser
2. You should see: `{"status":"ok","timestamp":"..."}`
3. In the frontend, check the header for the backend status indicator:
   - 🟢 Green = Backend Online
   - 🔴 Red = Backend Offline

## Step 6: Sign a PDF

1. Add a signature field to the PDF
2. Draw your signature
3. Click "Save" on the signature field
4. Click the "Sign PDF" button in the header
5. The signed PDF will open in a new tab

## Troubleshooting

### Backend Status Shows Offline

1. **Check if backend is running:**
   - Look for `🚀 Backend server running on http://localhost:3001` in the backend console
   - If not, start it with `npm start` in the `server/` directory

2. **Check MongoDB connection:**
   - Ensure MongoDB is running
   - Verify the `MONGODB_URI` in `.env` is correct

3. **Check frontend API URL:**
   - Create `.env.local` in the root directory:
     ```
     NEXT_PUBLIC_API_URL=http://localhost:3001
     ```
   - Restart the Next.js dev server after creating `.env.local`

### MongoDB Connection Error

If you see `❌ MongoDB connection error`:

1. **Local MongoDB:**
   - Start MongoDB service
   - Verify connection string: `mongodb://localhost:27017/boloforms`

2. **MongoDB Atlas:**
   - Check username/password
   - Verify IP whitelist includes your IP (or `0.0.0.0/0` for development)
   - Ensure cluster is accessible

## Next Steps

- See `SETUP.md` for detailed setup instructions
- See `server/README.md` for API documentation
- See `server/INTEGRATION.md` for frontend integration details



