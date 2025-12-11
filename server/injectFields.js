/**
 * Inject form fields into PDF using pdf-lib
 * Backend version of the frontend injectFieldsToPDF function
 */

const { PDFDocument, rgb } = require('pdf-lib');

/**
 * Inject all form fields into PDF
 * @param {Uint8Array} pdfBytes - PDF file bytes
 * @param {Array} fields - Array of field objects
 * @returns {Promise<Uint8Array>} - Modified PDF bytes
 */
async function injectFieldsToPDF(pdfBytes, fields) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0]; // Assuming first page

  const font = await pdfDoc.embedFont('Helvetica');
  const fontSize = 10;

  // Get actual PDF page dimensions
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();

  console.log('[Inject Fields] PDF Page dimensions:', { pageWidth, pageHeight });
  console.log('[Inject Fields] Fields to inject:', fields.length);

  for (const field of fields) {
    const { x, y, width, height, type, value, signatureData, imageData, label } = field;

    // Clamp coordinates to page bounds
    const pdfX = Math.max(0, Math.min(x, pageWidth - width));
    const pdfY = Math.max(0, Math.min(y, pageHeight - height));

    console.log(`[Inject Fields] Processing field [${type}]:`, {
      x: pdfX.toFixed(2),
      y: pdfY.toFixed(2),
      width: width.toFixed(2),
      height: height.toFixed(2),
    });

    switch (type) {
      case 'text':
        {
          const borderWidth = 2;
          const borderInsideOffset = 4; // Padding
          const textX = pdfX + borderInsideOffset;
          const textY = pdfY + height / 2 - fontSize / 2 + 1;

          if (value) {
            page.drawText(value, {
              x: textX,
              y: textY,
              size: fontSize,
              font: font,
              color: rgb(0, 0, 0),
            });
          }
          // Draw border
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: width,
            height: height,
            borderColor: rgb(0.2, 0.2, 0.2),
            borderWidth: borderWidth,
          });
        }
        break;

      case 'date':
        {
          const borderWidth = 2;
          const borderInsideOffset = 4;
          const dateTextX = pdfX + borderInsideOffset;
          const dateTextY = pdfY + height / 2 - fontSize / 2 + 1;

          if (value) {
            page.drawText(value, {
              x: dateTextX,
              y: dateTextY,
              size: fontSize,
              font: font,
              color: rgb(0, 0, 0),
            });
          }
          // Draw border
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: width,
            height: height,
            borderColor: rgb(0.2, 0.2, 0.2),
            borderWidth: borderWidth,
          });
        }
        break;

      case 'signature':
        {
          if (signatureData) {
            try {
              // Extract base64 data if it's a data URL
              let imageBytes;
              if (signatureData.startsWith('data:image')) {
                const base64Data = signatureData.split(',')[1];
                imageBytes = Buffer.from(base64Data, 'base64');
              } else {
                imageBytes = Buffer.from(signatureData, 'base64');
              }

              // Try PNG first, then JPG
              let embeddedImage;
              try {
                embeddedImage = await pdfDoc.embedPng(imageBytes);
              } catch (pngError) {
                try {
                  embeddedImage = await pdfDoc.embedJpg(imageBytes);
                } catch (jpgError) {
                  console.error('[Inject Fields] Failed to embed signature:', jpgError);
                  throw new Error('Invalid image format for signature');
                }
              }

              // Get image dimensions and calculate aspect ratio preservation
              const imageDims = embeddedImage.scale(1);
              const imageAspectRatio = imageDims.width / imageDims.height;
              const boxAspectRatio = width / height;

              // Calculate dimensions to fit within box while maintaining aspect ratio
              let finalWidth, finalHeight;
              if (imageAspectRatio > boxAspectRatio) {
                // Image is wider - fit to width
                finalWidth = width;
                finalHeight = width / imageAspectRatio;
              } else {
                // Image is taller - fit to height
                finalHeight = height;
                finalWidth = height * imageAspectRatio;
              }

              // Center the image within the box
              const xOffset = (width - finalWidth) / 2;
              const yOffset = (height - finalHeight) / 2;

              page.drawImage(embeddedImage, {
                x: pdfX + xOffset,
                y: pdfY + yOffset,
                width: finalWidth,
                height: finalHeight,
              });
            } catch (error) {
              console.error('[Inject Fields] Error embedding signature:', error);
            }
          }
          // Draw border
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: width,
            height: height,
            borderColor: rgb(0.2, 0.2, 0.2),
            borderWidth: 2,
          });
        }
        break;

      case 'image':
        {
          if (imageData) {
            try {
              // Extract base64 data
              let base64Data;
              if (imageData.startsWith('data:image')) {
                base64Data = imageData.split(',')[1];
              } else {
                base64Data = imageData;
              }

              const imageBytes = Buffer.from(base64Data, 'base64');
              let embeddedImage;

              // Try PNG first, then JPG
              try {
                embeddedImage = await pdfDoc.embedPng(imageBytes);
              } catch (pngError) {
                try {
                  embeddedImage = await pdfDoc.embedJpg(imageBytes);
                } catch (jpgError) {
                  console.error('[Inject Fields] Failed to embed image:', jpgError);
                  throw new Error('Invalid image format');
                }
              }

              // Calculate aspect ratio preservation (same as signature)
              const imageDims = embeddedImage.scale(1);
              const imageAspectRatio = imageDims.width / imageDims.height;
              const boxAspectRatio = width / height;

              let finalWidth, finalHeight;
              if (imageAspectRatio > boxAspectRatio) {
                finalWidth = width;
                finalHeight = width / imageAspectRatio;
              } else {
                finalHeight = height;
                finalWidth = height * imageAspectRatio;
              }

              const xOffset = (width - finalWidth) / 2;
              const yOffset = (height - finalHeight) / 2;

              page.drawImage(embeddedImage, {
                x: pdfX + xOffset,
                y: pdfY + yOffset,
                width: finalWidth,
                height: finalHeight,
              });
            } catch (error) {
              console.error('[Inject Fields] Error embedding image:', error);
            }
          }
          // Draw border
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: width,
            height: height,
            borderColor: rgb(0.2, 0.2, 0.2),
            borderWidth: 2,
          });
        }
        break;

      case 'radio':
        {
          // Draw radio button circle
          const centerX = pdfX + 10;
          const centerY = pdfY + height / 2;
          const radius = 5;

          page.drawCircle({
            x: centerX,
            y: centerY,
            size: radius,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
          });

          if (value === 'checked' || value === 'true') {
            page.drawCircle({
              x: centerX,
              y: centerY,
              size: radius - 2,
              color: rgb(0, 0, 0),
            });
          }

          // Draw label if exists
          if (label) {
            page.drawText(label, {
              x: pdfX + 20,
              y: pdfY + height / 2 - fontSize / 2,
              size: fontSize,
              font: font,
              color: rgb(0, 0, 0),
            });
          }
        }
        break;
    }
  }

  const modifiedPdfBytes = await pdfDoc.save();
  return modifiedPdfBytes;
}

module.exports = { injectFieldsToPDF };






