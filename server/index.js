const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { PDFDocument } = require('pdf-lib');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { injectFieldsToPDF } = require('./injectFields');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// CORS: Allow requests from frontend (Vercel) and localhost for development
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL, // Set in Railway: your Vercel URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.) in development
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, only allow specific origins
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // Development: allow all origins
      callback(null, true);
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads', 'signed-pdfs');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/boloforms';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// MongoDB Schema
const pdfSchema = new mongoose.Schema({
  pdfId: { type: String, required: true, unique: true },
  originalPdfPath: { type: String },
  signedPdfPath: { type: String },
  originalHash: { type: String, required: true }, // SHA-256 hash of original PDF
  signedHash: { type: String, required: true }, // SHA-256 hash of signed PDF
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const PdfModel = mongoose.model('Pdf', pdfSchema);

/**
 * Calculate SHA-256 hash of a buffer
 * @param {Buffer} buffer - Buffer to hash
 * @returns {string} - Hexadecimal hash string
 */
function calculateSHA256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * POST /sign-pdf
 * Signs a PDF with all form fields (text, date, signature, image, radio)
 * 
 * Body:
 * - pdfId: string (unique identifier for the PDF)
 * - fields: Array of field objects (required) OR legacy: signatureImage + coordinates
 * - pdfBytes?: string (Base64 encoded PDF bytes, optional)
 * 
 * Field object structure:
 * {
 *   id: string,
 *   type: "text" | "date" | "signature" | "image" | "radio",
 *   x: number (PDF points from left),
 *   y: number (PDF points from bottom),
 *   width: number (PDF points),
 *   height: number (PDF points),
 *   value?: string,
 *   label?: string,
 *   signatureData?: string (Base64 data URL),
 *   imageData?: string (Base64 data URL)
 * }
 */
app.post('/sign-pdf', async (req, res) => {
  try {
    const { pdfId, fields, signatureImage, coordinates, pdfBytes } = req.body;

    // Debug: Log what we received
    console.log('[Sign PDF] Request received:', {
      hasPdfId: !!pdfId,
      hasFields: !!fields,
      fieldsLength: fields?.length,
      hasSignatureImage: !!signatureImage,
      hasCoordinates: !!coordinates,
      hasPdfBytes: !!pdfBytes,
    });

    // Validation
    if (!pdfId) {
      return res.status(400).json({
        error: 'Missing required field: pdfId'
      });
    }

    // Support both new format (fields array) and legacy format (signatureImage + coordinates)
    let fieldsToInject = [];
    
    // Check for new format first (fields array)
    if (fields !== undefined && fields !== null) {
      if (Array.isArray(fields)) {
        if (fields.length > 0) {
          // New format: fields array
          fieldsToInject = fields;
          console.log(`[Sign PDF] Processing PDF ID: ${pdfId} with ${fields.length} fields`);
          console.log(`[Sign PDF] Field types:`, fields.map(f => f.type));
        } else {
          return res.status(400).json({
            error: 'Fields array is empty. Please add at least one field before signing.',
            received: { pdfId, fieldsLength: 0 }
          });
        }
      } else {
        return res.status(400).json({
          error: 'Invalid "fields" parameter. Expected an array.',
          received: { pdfId, fieldsType: typeof fields, fields }
        });
      }
    } else if (signatureImage && coordinates) {
      // Legacy format: single signature
      if (!coordinates.x || !coordinates.y || !coordinates.width || !coordinates.height) {
        return res.status(400).json({
          error: 'Invalid coordinates. Must include: x, y, width, height'
        });
      }
      fieldsToInject = [{
        id: 'signature-1',
        type: 'signature',
        x: coordinates.x,
        y: coordinates.y,
        width: coordinates.width,
        height: coordinates.height,
        signatureData: signatureImage,
      }];
      console.log(`[Sign PDF] Processing PDF ID: ${pdfId} with legacy signature format`);
    } else {
      // More detailed error message
      const missingFields = [];
      if (!pdfId) missingFields.push('pdfId');
      if (!fields && !signatureImage) missingFields.push('fields (or signatureImage)');
      if (!fields && signatureImage && !coordinates) missingFields.push('coordinates');
      
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}. Please provide either "fields" array or "signatureImage" + "coordinates"`,
        received: {
          hasPdfId: !!pdfId,
          hasFields: !!fields,
          fieldsIsArray: Array.isArray(fields),
          fieldsLength: fields?.length,
          hasSignatureImage: !!signatureImage,
          hasCoordinates: !!coordinates,
        }
      });
    }

    // Load PDF and calculate original hash
    let originalPdfBuffer;
    let originalHash;

    if (pdfBytes) {
      // If PDF bytes provided, use them
      originalPdfBuffer = Buffer.from(pdfBytes, 'base64');
      originalHash = calculateSHA256(originalPdfBuffer);
      console.log(`[Sign PDF] Original PDF Hash (SHA-256): ${originalHash}`);
    } else {
      // Otherwise, try to load from stored PDF
      const storedPdf = await PdfModel.findOne({ pdfId });
      if (!storedPdf || !storedPdf.originalPdfPath) {
        return res.status(404).json({
          error: 'PDF not found. Please provide pdfBytes or upload PDF first.'
        });
      }
      originalPdfBuffer = await fs.readFile(storedPdf.originalPdfPath);
      originalHash = calculateSHA256(originalPdfBuffer);
      console.log(`[Sign PDF] Original PDF Hash (SHA-256): ${originalHash}`);
    }

    // Convert Buffer to Uint8Array for injectFieldsToPDF
    const pdfBytesUint8 = new Uint8Array(originalPdfBuffer);

    // Inject all fields into PDF
    console.log(`[Sign PDF] Injecting ${fieldsToInject.length} fields into PDF...`);
    const signedPdfBytes = await injectFieldsToPDF(pdfBytesUint8, fieldsToInject);
    const signedPdfBuffer = Buffer.from(signedPdfBytes);
    
    // Calculate hash of signed PDF
    const signedHash = calculateSHA256(signedPdfBuffer);
    console.log(`[Sign PDF] Signed PDF Hash (SHA-256): ${signedHash}`);

    const filename = `signed-${pdfId}-${Date.now()}.pdf`;
    const filepath = path.join(uploadsDir, filename);
    await fs.writeFile(filepath, signedPdfBuffer);

    // Update or create PDF record with audit trail hashes
    const signedPdfUrl = `/uploads/signed-pdfs/${filename}`;
    await PdfModel.findOneAndUpdate(
      { pdfId },
      {
        pdfId,
        signedPdfPath: filepath,
        originalHash, // Store original PDF hash
        signedHash,   // Store signed PDF hash
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    console.log(`[Sign PDF] ✅ Successfully signed PDF: ${filename}`);
    console.log(`[Sign PDF] 📋 Audit Trail:`);
    console.log(`  - Original Hash: ${originalHash}`);
    console.log(`  - Signed Hash: ${signedHash}`);

    res.json({
      success: true,
      pdfId,
      signedPdfUrl,
      auditTrail: {
        originalHash,
        signedHash,
      },
      message: 'PDF signed successfully',
    });

  } catch (error) {
    console.error('[Sign PDF] ❌ Error:', error);
    res.status(500).json({
      error: 'Failed to sign PDF',
      details: error.message,
    });
  }
});

/**
 * GET /pdf/:pdfId
 * Get signed PDF URL and audit trail
 */
app.get('/pdf/:pdfId', async (req, res) => {
  try {
    const { pdfId } = req.params;
    const pdf = await PdfModel.findOne({ pdfId });
    
    if (!pdf || !pdf.signedPdfPath) {
      return res.status(404).json({ error: 'Signed PDF not found' });
    }

    res.json({
      pdfId,
      signedPdfUrl: `/uploads/signed-pdfs/${path.basename(pdf.signedPdfPath)}`,
      auditTrail: {
        originalHash: pdf.originalHash,
        signedHash: pdf.signedHash,
        createdAt: pdf.createdAt,
        updatedAt: pdf.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Get PDF] ❌ Error:', error);
    res.status(500).json({ error: 'Failed to retrieve PDF' });
  }
});

/**
 * POST /verify-pdf/:pdfId
 * Verify PDF integrity by comparing stored hash with current file hash
 */
app.post('/verify-pdf/:pdfId', async (req, res) => {
  try {
    const { pdfId } = req.params;
    const { verifyType = 'signed' } = req.body; // 'original' or 'signed'

    const pdf = await PdfModel.findOne({ pdfId });
    
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    const filePath = verifyType === 'original' ? pdf.originalPdfPath : pdf.signedPdfPath;
    const storedHash = verifyType === 'original' ? pdf.originalHash : pdf.signedHash;

    if (!filePath) {
      return res.status(404).json({ 
        error: `${verifyType} PDF file not found` 
      });
    }

    // Read file and calculate current hash
    const fileBuffer = await fs.readFile(filePath);
    const currentHash = calculateSHA256(fileBuffer);

    // Compare hashes
    const isIntegrityValid = currentHash === storedHash;

    res.json({
      pdfId,
      verifyType,
      integrityValid: isIntegrityValid,
      storedHash,
      currentHash,
      message: isIntegrityValid 
        ? '✅ PDF integrity verified - document has not been tampered with'
        : '❌ PDF integrity check failed - document may have been modified',
    });
  } catch (error) {
    console.error('[Verify PDF] ❌ Error:', error);
    res.status(500).json({ 
      error: 'Failed to verify PDF',
      details: error.message 
    });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 MongoDB: ${MONGODB_URI ? 'Configured' : 'Not configured'}`);
});

