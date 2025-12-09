const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { PDFDocument } = require('pdf-lib');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
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
 * Signs a PDF with a signature image at specified coordinates
 * 
 * Body:
 * - pdfId: string (unique identifier for the PDF)
 * - signatureImage: string (Base64 encoded image)
 * - coordinates: { x: number, y: number, width: number, height: number } (in PDF points)
 * - pdfBytes?: Uint8Array (optional: PDF file as base64 or buffer)
 */
app.post('/sign-pdf', async (req, res) => {
  try {
    const { pdfId, signatureImage, coordinates, pdfBytes } = req.body;

    // Validation
    if (!pdfId || !signatureImage || !coordinates) {
      return res.status(400).json({
        error: 'Missing required fields: pdfId, signatureImage, coordinates'
      });
    }

    if (!coordinates.x || !coordinates.y || !coordinates.width || !coordinates.height) {
      return res.status(400).json({
        error: 'Invalid coordinates. Must include: x, y, width, height'
      });
    }

    console.log(`[Sign PDF] Processing PDF ID: ${pdfId}`);
    console.log(`[Sign PDF] Coordinates:`, coordinates);

    // Load PDF and calculate original hash
    let pdfDoc;
    let originalPdfBuffer;
    let originalHash;

    if (pdfBytes) {
      // If PDF bytes provided, use them
      originalPdfBuffer = Buffer.from(pdfBytes, 'base64');
      originalHash = calculateSHA256(originalPdfBuffer);
      console.log(`[Sign PDF] Original PDF Hash (SHA-256): ${originalHash}`);
      pdfDoc = await PDFDocument.load(originalPdfBuffer);
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
      pdfDoc = await PDFDocument.load(originalPdfBuffer);
    }

    const pages = pdfDoc.getPages();
    const page = pages[0]; // Assuming first page for now

    // Process signature image
    let signatureImageBytes;
    if (signatureImage.startsWith('data:image')) {
      // Extract base64 data
      const base64Data = signatureImage.split(',')[1];
      signatureImageBytes = Buffer.from(base64Data, 'base64');
    } else {
      signatureImageBytes = Buffer.from(signatureImage, 'base64');
    }

    // Embed image
    let embeddedImage;
    try {
      embeddedImage = await pdfDoc.embedPng(signatureImageBytes);
    } catch (pngError) {
      try {
        embeddedImage = await pdfDoc.embedJpg(signatureImageBytes);
      } catch (jpgError) {
        return res.status(400).json({
          error: 'Invalid image format. Must be PNG or JPEG.',
          details: jpgError.message
        });
      }
    }

    // Get image dimensions
    const imageDims = embeddedImage.scale(1);
    const imageAspectRatio = imageDims.width / imageDims.height;
    
    // Get target box dimensions
    const boxWidth = coordinates.width;
    const boxHeight = coordinates.height;
    const boxAspectRatio = boxWidth / boxHeight;

    // Calculate dimensions to fit within box while maintaining aspect ratio
    let finalWidth, finalHeight;
    if (imageAspectRatio > boxAspectRatio) {
      // Image is wider - fit to width
      finalWidth = boxWidth;
      finalHeight = boxWidth / imageAspectRatio;
    } else {
      // Image is taller - fit to height
      finalHeight = boxHeight;
      finalWidth = boxHeight * imageAspectRatio;
    }

    // Center the image within the box
    const xOffset = (boxWidth - finalWidth) / 2;
    const yOffset = (boxHeight - finalHeight) / 2;

    // PDF coordinates: y is from bottom, so we need to invert
    const pageHeight = page.getHeight();
    const pdfX = coordinates.x + xOffset;
    const pdfY = pageHeight - (coordinates.y + coordinates.height) + yOffset;

    console.log(`[Sign PDF] Image dimensions: ${imageDims.width}x${imageDims.height}`);
    console.log(`[Sign PDF] Box dimensions: ${boxWidth}x${boxHeight}`);
    console.log(`[Sign PDF] Final dimensions: ${finalWidth}x${finalHeight}`);
    console.log(`[Sign PDF] Position: (${pdfX}, ${pdfY})`);

    // Draw signature image
    page.drawImage(embeddedImage, {
      x: pdfX,
      y: pdfY,
      width: finalWidth,
      height: finalHeight,
    });

    // Save signed PDF
    const signedPdfBytes = await pdfDoc.save();
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

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});

