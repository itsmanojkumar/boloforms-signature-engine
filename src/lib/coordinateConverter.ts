/**
 * Coordinate Converter Utility
 * Converts between CSS pixels (top-left origin) and PDF points (bottom-left origin, 72 DPI)
 */

export interface ViewportInfo {
  width: number;
  height: number;
  scale: number;
  pdfWidth: number; // PDF width in points
  pdfHeight: number; // PDF height in points
  offsetX?: number; // Calibration offset X (in CSS pixels)
  offsetY?: number; // Calibration offset Y (in CSS pixels)
}

export interface CSSPosition {
  x: number; // CSS pixels from left
  y: number; // CSS pixels from top
  width: number;
  height: number;
}

export interface PDFPosition {
  x: number; // PDF points from left
  y: number; // PDF points from bottom
  width: number;
  height: number;
}

/**
 * Convert CSS pixel position to PDF point position
 * CSS: origin at top-left, units in pixels
 * PDF: origin at bottom-left, units in points
 * 
 * react-pdf renders 1 PDF point as 1 CSS pixel at scale 1.
 * So we just need to:
 * 1. Remove the scale factor to get unscaled position
 * 2. Invert Y coordinate (top-left to bottom-left)
 */
export function cssToPdf(
  cssPos: CSSPosition,
  viewport: ViewportInfo
): PDFPosition {
  if (!cssPos || !viewport || typeof viewport.scale !== "number" || viewport.scale === 0) {
    console.error("Invalid parameters for cssToPdf", { cssPos, viewport });
    return { x: 0, y: 0, width: 100, height: 30 };
  }

  // EXACT CALCULATION: CSS pixels to PDF points
  // Formula: PDF_point = CSS_pixel / scale
  const cssX = cssPos.x || 0;
  const cssY = cssPos.y || 0;
  const cssWidth = cssPos.width || 100;
  const cssHeight = cssPos.height || 30;
  const scale = viewport.scale;
  const pdfHeightValue = viewport.pdfHeight || 842; // A4 = 842 points
  
  // X conversion: Direct division by scale
  const pdfX = cssX / scale;
  const pdfWidth = cssWidth / scale;
  const pdfHeight = cssHeight / scale;
  
  // Y conversion: Invert from top-left to bottom-left
  // Step 1: Convert CSS top edge to PDF points (distance from top of PDF)
  const pdfTopEdge = cssY / scale;
  // Step 2: Calculate bottom edge position in PDF coordinates (distance from bottom of PDF)
  // pdfY is the coordinate of the BOTTOM-LEFT corner of the field
  // pdfY = totalHeight - (distanceFromTop + height)
  const pdfY = pdfHeightValue - (pdfTopEdge + pdfHeight);

  // VERIFICATION: Calculate back to verify correctness
  // topEdge = pdfHeight - (pdfY + pdfHeight)
  const verifyTopEdge = pdfHeightValue - (pdfY + pdfHeight);
  const verifyCssY = verifyTopEdge * scale;
  const verifyCssX = pdfX * scale;
  
  // Log exact calculations for debugging
  console.log("EXACT CSS→PDF Conversion:", {
    input: {
      cssX: cssX.toFixed(4),
      cssY: cssY.toFixed(4),
      cssWidth: cssWidth.toFixed(4),
      cssHeight: cssHeight.toFixed(4),
      scale: scale.toFixed(6),
    },
    calculation: {
      pdfX: pdfX.toFixed(4),
      pdfTopEdge: pdfTopEdge.toFixed(4),
      pdfY: pdfY.toFixed(4),
      pdfWidth: pdfWidth.toFixed(4),
      pdfHeight: pdfHeight.toFixed(4),
      pdfHeightValue: pdfHeightValue.toFixed(4),
    },
    verification: {
      verifyTopEdge: verifyTopEdge.toFixed(4),
      verifyCssY: verifyCssY.toFixed(4),
      verifyCssX: verifyCssX.toFixed(4),
      yError: Math.abs(verifyTopEdge - pdfTopEdge).toFixed(4),
      xError: Math.abs(verifyCssX - cssX).toFixed(4),
    }
  });

  // Warn if conversion error exceeds 0.01 points (very small tolerance)
  if (Math.abs(verifyTopEdge - pdfTopEdge) > 0.01) {
    console.warn(`Y conversion error: ${Math.abs(verifyTopEdge - pdfTopEdge).toFixed(4)} points`);
  }
  if (Math.abs(verifyCssX - cssX) > 0.01) {
    console.warn(`X conversion error: ${Math.abs(verifyCssX - cssX).toFixed(4)} pixels`);
  }

  return {
    x: pdfX,
    y: pdfY,
    width: pdfWidth,
    height: pdfHeight,
  };
}

/**
 * Convert PDF point position to CSS pixel position
 * PDF: origin at bottom-left, units in points
 * CSS: origin at top-left, units in pixels
 * 
 * react-pdf renders 1 PDF point as 1 CSS pixel at scale 1.
 */
export function pdfToCss(
  pdfPos: PDFPosition,
  viewport: ViewportInfo
): CSSPosition {
  if (!pdfPos || !viewport || typeof viewport.scale !== "number") {
    console.error("Invalid parameters for pdfToCss", { pdfPos, viewport });
    return { x: 0, y: 0, width: 100, height: 30 };
  }

  // Apply viewport scale to get CSS pixel position
  let cssX = (pdfPos.x || 0) * viewport.scale;
  const cssWidth = (pdfPos.width || 100) * viewport.scale;
  const cssHeight = (pdfPos.height || 30) * viewport.scale;
  
  // Y coordinate inversion: PDF is bottom-left, CSS is top-left
  // pdfPos.y is from bottom, we need distance from top
  // Formula: cssY = (pdfHeight - pdfY - pdfHeight) * scale
  const pdfHeightValue = viewport.pdfHeight || 842; // Default A4 height
  // unscaledY is the distance from the TOP of the PDF to the TOP of the field
  const unscaledY = pdfHeightValue - (pdfPos.y || 0) - (pdfPos.height || 30);
  let cssY = unscaledY * viewport.scale;
  
  // No calibration offset - use exact coordinates

  return {
    x: cssX,
    y: cssY,
    width: cssWidth,
    height: cssHeight,
  };
}

/**
 * Calculate viewport scale based on container width and PDF width
 */
export function calculateScale(
  containerWidth: number,
  pdfWidth: number,
  maxWidth?: number
): number {
  const max = maxWidth || containerWidth;
  return Math.min(max / pdfWidth, 1);
}
