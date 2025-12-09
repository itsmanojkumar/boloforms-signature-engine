/**
 * Inject form fields into PDF using pdf-lib
 */

import { PDFDocument, rgb, PDFFont, PDFPage, PDFTextField, PDFCheckBox } from "pdf-lib";
import type { FormField } from "@/types/formFields";

export async function injectFieldsToPDF(
  pdfBytes: Uint8Array,
  fields: FormField[],
  offsetX: number = 0, // Offset in PDF points
  offsetY: number = 0  // Offset in PDF points
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0]; // Assuming single page for now

  const font = await pdfDoc.embedFont("Helvetica");
  const fontSize = 10;
  
  // Get actual PDF page dimensions
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  
  console.log("PDF Page dimensions:", { pageWidth, pageHeight });
  console.log("Fields to inject (with verification):", fields.map(f => {
    const topEdge = pageHeight - f.y - f.height;
    return { 
      type: f.type, 
      x: f.x.toFixed(2), 
      y: f.y.toFixed(2), 
      width: f.width.toFixed(2), 
      height: f.height.toFixed(2),
      topEdgeFromTop: topEdge.toFixed(2),
      bottomEdgeFromBottom: f.y.toFixed(2),
      // Expected: if field was dropped at CSS y=100, topEdge should be ~100
      note: `Field bottom at ${f.y.toFixed(2)} from bottom = top at ${topEdge.toFixed(2)} from top`
    };
  }));

  for (const field of fields) {
    const { x, y, width, height, type, value, signatureData, imageData } =
      field;

    // EXACT CALCULATION: Use coordinates directly
    // Note: Since signature works perfectly at bottom, coordinate conversion is correct.
    // Top fields may have slight offset due to browser PDF viewer toolbar.
    // The overlay should account for this, but if there's still a mismatch at top,
    // we can apply a small correction. For now, use coordinates as-is.
    const pdfX = Math.max(0, Math.min(x, pageWidth - width));
    const pdfY = Math.max(0, Math.min(y, pageHeight - height));
    
    // Calculate exact top edge position for verification
    const topEdgeFromTop = pageHeight - pdfY - height;
    const isTopField = topEdgeFromTop < (pageHeight * 0.2); // Top 20% of page
    
    // Log exact field positioning with verification
    console.log(`EXACT Field Positioning [${type}]:`, {
      input: {
        originalX: x.toFixed(4),
        originalY: y.toFixed(4),
        width: width.toFixed(4),
        height: height.toFixed(4),
      },
      calculation: {
        usingX: x.toFixed(4),
        usingY: y.toFixed(4),
        formula: "Direct coordinate usage (no offset)",
      },
      final: {
        pdfX: pdfX.toFixed(4),
        pdfY: pdfY.toFixed(4),
        topEdgeFromTop: topEdgeFromTop.toFixed(4),
        bottomEdgeFromBottom: pdfY.toFixed(4),
        verification: {
          calculatedTopEdge: topEdgeFromTop.toFixed(4),
          formula: `pageHeight(${pageHeight.toFixed(4)}) - pdfY(${pdfY.toFixed(4)}) - height(${height.toFixed(4)}) = ${topEdgeFromTop.toFixed(4)}`,
        }
      },
      bounds: {
        pageWidth: pageWidth.toFixed(4),
        pageHeight: pageHeight.toFixed(4),
        clampedX: pdfX !== x,
        clampedY: pdfY !== y,
        reasonX: pdfX !== x ? `Clamped: ${x.toFixed(4)} → ${pdfX.toFixed(4)}` : "No clamp needed",
        reasonY: pdfY !== y ? `Clamped: ${y.toFixed(4)} → ${pdfY.toFixed(4)}` : "No clamp needed",
      }
    });

    switch (type) {
      case "text":
        // EXACT positioning: Match signature logic exactly
        // Border width: 2pt (matches CSS border-2 = 2px)
        // Border is centered on rectangle edge, so half goes inside (1pt)
        const borderWidth = 2;
        const borderInsideOffset = borderWidth / 2; // 1pt inside the rectangle
        
        // Text positioning: Account for border inside offset
        // CSS uses px-2 (8px) padding, at scale ~0.75 that's ~6pt
        // But to match signature exactly, use minimal offset like signature
        const textX = pdfX + borderInsideOffset; // 1pt from left edge (border inside)
        const textY = pdfY + height / 2 - fontSize / 2; // Exact vertical center
        
        if (value) {
          page.drawText(value, {
            x: textX,
            y: textY,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
          });
          console.log(`EXACT Text Position [${type}]:`, {
            fieldBounds: { pdfX: pdfX.toFixed(4), pdfY: pdfY.toFixed(4), width: width.toFixed(4), height: height.toFixed(4) },
            textPosition: { x: textX.toFixed(4), y: textY.toFixed(4) },
            borderWidth: borderWidth.toFixed(4),
            fontSize: fontSize.toFixed(4),
          });
        }
        // Draw border (exact position)
        page.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: width,
          height: height,
          borderColor: rgb(0.2, 0.2, 0.2), // Match border-gray-400
          borderWidth: borderWidth, // Exact: 2pt
        });
        break;

      case "date":
        // EXACT positioning: Match text field logic exactly
        const dateBorderWidth = 2;
        const dateBorderInsideOffset = dateBorderWidth / 2; // 1pt inside
        
        const dateTextX = pdfX + dateBorderInsideOffset; // 1pt from left edge
        const dateTextY = pdfY + height / 2 - fontSize / 2; // Exact vertical center
        
        if (value) {
          page.drawText(value, {
            x: dateTextX,
            y: dateTextY,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
          });
          console.log(`EXACT Date Position [${type}]:`, {
            fieldBounds: { pdfX: pdfX.toFixed(4), pdfY: pdfY.toFixed(4), width: width.toFixed(4), height: height.toFixed(4) },
            textPosition: { x: dateTextX.toFixed(4), y: dateTextY.toFixed(4) },
            borderWidth: dateBorderWidth.toFixed(4),
            fontSize: fontSize.toFixed(4),
          });
        }
        // Draw border (exact position)
        page.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: width,
          height: height,
          borderColor: rgb(0.2, 0.2, 0.2), // Match border-gray-400
          borderWidth: dateBorderWidth, // Exact: 2pt
        });
        break;

             case "signature":
               // Signature logic (works perfectly - use as reference):
               // Don't draw white background - signature image has its own background
               // 1. Draw signature image at exact position (no offsets)
               if (signatureData) {
                 try {
                   const image = await pdfDoc.embedPng(signatureData);
                   page.drawImage(image, {
                     x: pdfX, // Exact position, no offset
                     y: pdfY, // Exact position, no offset
                     width: width,
                     height: height,
                   });
                 } catch (error) {
                   // If PNG embedding fails, try as base64 image
                   console.warn("Failed to embed signature as PNG, trying alternative method");
                   if (signatureData.startsWith("data:image")) {
                     const base64Data = signatureData.split(",")[1];
                     const imageBytes = Uint8Array.from(atob(base64Data), (c) =>
                       c.charCodeAt(0)
                     );
                     try {
                       const image = await pdfDoc.embedPng(imageBytes);
                       page.drawImage(image, {
                         x: pdfX, // Exact position, no offset
                         y: pdfY, // Exact position, no offset
                         width: width,
                         height: height,
                       });
                     } catch (e) {
                       console.error("Failed to embed signature:", e);
                     }
                   }
                 }
               }
               // 2. Draw border last
               page.drawRectangle({
                 x: pdfX,
                 y: pdfY,
                 width: width,
                 height: height,
                 borderColor: rgb(0.2, 0.2, 0.2), // Match border-gray-400
                 borderWidth: 2, // Match border-2 (2px)
               });
               break;

             case "image":
               // Don't draw white background - image has its own content
               // Draw image exactly as it appears (same as signature)
               if (imageData) {
                 try {
                   let image;
                   if (imageData.startsWith("data:image/png")) {
                     const base64Data = imageData.split(",")[1];
                     const imageBytes = Uint8Array.from(atob(base64Data), (c) =>
                       c.charCodeAt(0)
                     );
                     image = await pdfDoc.embedPng(imageBytes);
                   } else if (imageData.startsWith("data:image/jpeg") || imageData.startsWith("data:image/jpg")) {
                     const base64Data = imageData.split(",")[1];
                     const imageBytes = Uint8Array.from(atob(base64Data), (c) =>
                       c.charCodeAt(0)
                     );
                     image = await pdfDoc.embedJpg(imageBytes);
                   } else {
                     // Try PNG as default
                     const base64Data = imageData.split(",")[1];
                     const imageBytes = Uint8Array.from(atob(base64Data), (c) =>
                       c.charCodeAt(0)
                     );
                     image = await pdfDoc.embedPng(imageBytes);
                   }
                   // Images fill the container exactly as shown (same as signature)
                   page.drawImage(image, {
                     x: pdfX, // Exact position, no offset (same as signature)
                     y: pdfY, // Exact position, no offset (same as signature)
                     width: width,
                     height: height,
                   });
                 } catch (error) {
                   console.error("Failed to embed image:", error);
                 }
               }
               // Draw border (same as signature)
               page.drawRectangle({
                 x: pdfX,
                 y: pdfY,
                 width: width,
                 height: height,
                 borderColor: rgb(0.2, 0.2, 0.2), // Match border-gray-400
                 borderWidth: 2, // Match border-2 (2px)
               });
               break;

      case "radio":
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
        if (value === "checked") {
          page.drawCircle({
            x: centerX,
            y: centerY,
            size: radius - 2,
            color: rgb(0, 0, 0),
          });
        }
        // Draw label if exists
        if (field.label) {
          page.drawText(field.label, {
            x: pdfX + 20,
            y: pdfY + height / 2 - fontSize / 2,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
          });
        }
        break;
    }
  }

  const modifiedPdfBytes = await pdfDoc.save();
  return modifiedPdfBytes;
}



