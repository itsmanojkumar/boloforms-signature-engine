# Backend API Integration Guide

## Frontend Integration

Update your frontend to call the backend API when signing PDFs.

### Example: Sign PDF Endpoint Call

```typescript
// src/lib/signPdfAPI.ts

export async function signPdf(
  pdfId: string,
  signatureImage: string, // Base64 data URL
  coordinates: { x: number; y: number; width: number; height: number },
  pdfBytes?: Uint8Array
): Promise<{ signedPdfUrl: string }> {
  const response = await fetch('http://localhost:3001/sign-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pdfId,
      signatureImage,
      coordinates,
      pdfBytes: pdfBytes ? Array.from(pdfBytes).map(b => String.fromCharCode(b)).join('') : undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to sign PDF');
  }

  return response.json();
}
```

### Usage in React Component

```typescript
import { signPdf } from '@/lib/signPdfAPI';

const handleSignPDF = async () => {
  try {
    // Get signature data from signature pad
    const signatureData = signaturePadInstanceRef.current?.toDataURL('image/png');
    if (!signatureData) return;

    // Get field coordinates (already in PDF points)
    const coordinates = {
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
    };

    // Call backend API
    const result = await signPdf(
      `pdf-${Date.now()}`,
      signatureData,
      coordinates
    );

    // Download or display signed PDF
    window.open(`http://localhost:3001${result.signedPdfUrl}`, '_blank');
  } catch (error) {
    console.error('Error signing PDF:', error);
    alert('Failed to sign PDF');
  }
};
```

## CORS Configuration

If your frontend runs on a different port, update CORS in `server/index.js`:

```javascript
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true,
}));
```

## Production Deployment

1. **Environment Variables**: Set `MONGODB_URI` and `PORT` in production
2. **File Storage**: Consider using cloud storage (AWS S3, Google Cloud Storage) instead of local filesystem
3. **Authentication**: Add JWT authentication if needed
4. **Rate Limiting**: Add rate limiting middleware
5. **Error Logging**: Integrate error logging service (Sentry, etc.)

