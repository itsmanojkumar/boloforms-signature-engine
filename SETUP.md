# Setup Guide - Backend Connection

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (local installation or MongoDB Atlas account)

## Backend Setup

### 1. Install Backend Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory:

```bash
cd server
cp .env.example .env
```

Edit `.env` with your MongoDB connection string:

**For Local MongoDB:**
```
MONGODB_URI=mongodb://localhost:27017/boloforms
```

**For MongoDB Atlas (Cloud):**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/boloforms
```

### 3. Start MongoDB (if using local)

**Windows:**
```bash
# Start MongoDB service
net start MongoDB
```

**macOS/Linux:**
```bash
# Start MongoDB service
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### 4. Start Backend Server

```bash
cd server

# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The backend server will run on `http://localhost:3001`

## Frontend Setup

### 1. Configure API URL

Create a `.env.local` file in the root directory:

```bash
# Frontend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2. Start Frontend

```bash
# From root directory
npm run dev
```

The frontend will run on `http://localhost:3000`

## Testing the Connection

1. **Check Backend Health:**
   - Open `http://localhost:3001/health` in your browser
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Check Frontend Connection:**
   - Open `http://localhost:3000`
   - Look for the backend status indicator in the header:
     - 🟢 Green dot = Backend Online
     - 🔴 Red dot = Backend Offline
     - 🟡 Yellow dot = Checking...

3. **Sign a PDF:**
   - Add a signature field to the PDF
   - Draw your signature
   - Click "Save" on the signature field
   - Click "Sign PDF" button
   - The signed PDF will open in a new tab

## Troubleshooting

### Backend Won't Start

1. **Check MongoDB Connection:**
   ```bash
   # Test MongoDB connection
   mongosh mongodb://localhost:27017/boloforms
   ```

2. **Check Port Availability:**
   ```bash
   # Windows
   netstat -ano | findstr :3001
   
   # macOS/Linux
   lsof -i :3001
   ```

3. **Check Environment Variables:**
   - Ensure `.env` file exists in `server/` directory
   - Verify `MONGODB_URI` is correct

### Frontend Can't Connect to Backend

1. **Check API URL:**
   - Verify `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:3001`
   - Restart Next.js dev server after changing `.env.local`

2. **Check CORS:**
   - Backend has CORS enabled for all origins
   - If issues persist, check browser console for CORS errors

3. **Check Backend Status:**
   - Ensure backend is running on port 3001
   - Check backend console for errors

### MongoDB Connection Issues

1. **Local MongoDB:**
   - Ensure MongoDB service is running
   - Check MongoDB logs for errors
   - Verify connection string format

2. **MongoDB Atlas:**
   - Verify username and password are correct
   - Check IP whitelist (add `0.0.0.0/0` for development)
   - Verify cluster is accessible

## API Endpoints

- `GET /health` - Health check
- `POST /sign-pdf` - Sign PDF with signature
- `GET /pdf/:pdfId` - Get signed PDF info
- `POST /verify-pdf/:pdfId` - Verify PDF integrity

See `server/README.md` for detailed API documentation.






