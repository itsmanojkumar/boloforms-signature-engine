# Boloforms Backend API

## Overview

Backend API server for PDF signature injection with aspect ratio preservation.

## Setup

1. **Install Dependencies**:
```bash
cd server
npm install
```

2. **Configure Environment**:
```bash
cp .env.example .env
# Edit .env with your MongoDB connection string
```

3. **Start MongoDB** (if using local):
```bash
# Make sure MongoDB is running locally on port 27017
# Or use MongoDB Atlas (cloud)
```

4. **Run Server**:
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3001`

## API Endpoints

### POST /sign-pdf

Signs a PDF with a signature image at specified coordinates.

**Request Body**:
```json
{
  "pdfId": "unique-pdf-identifier",
  "signatureImage": "data:image/png;base64,iVBORw0KG...",
  "coordinates": {
    "x": 100,
    "y": 200,
    "width": 150,
    "height": 50
  },
  "pdfBytes": "base64-encoded-pdf-bytes (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "pdfId": "unique-pdf-identifier",
  "signedPdfUrl": "/uploads/signed-pdfs/signed-abc123-1234567890.pdf",
  "auditTrail": {
    "originalHash": "sha256-hash-of-original-pdf",
    "signedHash": "sha256-hash-of-signed-pdf"
  },
  "message": "PDF signed successfully"
}
```

**Aspect Ratio Handling**:
- Signature image is automatically fitted within the specified box
- Image maintains its original aspect ratio
- Image is centered within the box
- No stretching or distortion

### GET /pdf/:pdfId

Retrieves signed PDF information and audit trail.

**Response**:
```json
{
  "pdfId": "unique-pdf-identifier",
  "signedPdfUrl": "/uploads/signed-pdfs/signed-abc123-1234567890.pdf",
  "auditTrail": {
    "originalHash": "sha256-hash-of-original-pdf",
    "signedHash": "sha256-hash-of-signed-pdf",
    "createdAt": "2025-12-09T12:00:00.000Z",
    "updatedAt": "2025-12-09T12:00:00.000Z"
  }
}
```

### POST /verify-pdf/:pdfId

Verifies PDF integrity by comparing stored hash with current file hash.

**Request Body**:
```json
{
  "verifyType": "signed" // or "original"
}
```

**Response**:
```json
{
  "pdfId": "unique-pdf-identifier",
  "verifyType": "signed",
  "integrityValid": true,
  "storedHash": "sha256-hash-stored-in-database",
  "currentHash": "sha256-hash-of-current-file",
  "message": "✅ PDF integrity verified - document has not been tampered with"
}
```

### GET /health

Health check endpoint.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-12-09T12:00:00.000Z"
}
```

## MongoDB Schema

```javascript
{
  pdfId: String (unique),
  originalPdfPath: String,
  signedPdfPath: String,
  originalHash: String (SHA-256 hash of original PDF),
  signedHash: String (SHA-256 hash of signed PDF),
  createdAt: Date,
  updatedAt: Date
}
```

## Security & Audit Trail

### Hash Calculation

- **Original PDF Hash**: Calculated using SHA-256 before any modifications
- **Signed PDF Hash**: Calculated using SHA-256 after signature is applied
- Both hashes are stored in MongoDB to create an immutable audit trail

### Integrity Verification

Use the `/verify-pdf/:pdfId` endpoint to verify that a PDF file has not been tampered with:
- Compares the stored hash with the current file hash
- Returns `integrityValid: true` if hashes match
- Returns `integrityValid: false` if document has been modified

This provides cryptographic proof of document history and prevents tampering.

## File Storage

Signed PDFs are stored in `server/uploads/signed-pdfs/` directory.

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `400`: Bad Request (missing/invalid parameters)
- `404`: Not Found
- `500`: Internal Server Error

Error response format:
```json
{
  "error": "Error message",
  "details": "Detailed error information (in development)"
}
```

