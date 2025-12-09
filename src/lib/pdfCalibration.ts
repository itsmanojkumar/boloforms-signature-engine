/**
 * PDF Calibration Utility
 * Helps calibrate coordinate system to account for browser PDF viewer margins/offsets
 */

export interface CalibrationPoint {
  pdfX: number; // Known PDF X position (from pdf-lib)
  pdfY: number; // Known PDF Y position (from pdf-lib, from bottom)
  cssX: number; // Actual CSS X position where it appears on screen
  cssY: number; // Actual CSS Y position where it appears on screen (from top)
}

/**
 * Calculate offset based on calibration points
 */
export function calculateOffset(
  calibrationPoints: CalibrationPoint[],
  viewport: { scale: number; pdfWidth: number; pdfHeight: number }
): { offsetX: number; offsetY: number } {
  if (calibrationPoints.length === 0) {
    return { offsetX: 0, offsetY: 0 };
  }

  // Calculate expected CSS positions from PDF positions
  const offsets = calibrationPoints.map((point) => {
    // Convert PDF position to expected CSS position
    const expectedCssX = point.pdfX * viewport.scale;
    const expectedCssY = (viewport.pdfHeight - point.pdfY) * viewport.scale;
    
    // Calculate offset
    const offsetX = point.cssX - expectedCssX;
    const offsetY = point.cssY - expectedCssY;
    
    return { offsetX, offsetY };
  });

  // Average the offsets
  const avgOffsetX = offsets.reduce((sum, o) => sum + o.offsetX, 0) / offsets.length;
  const avgOffsetY = offsets.reduce((sum, o) => sum + o.offsetY, 0) / offsets.length;

  return { offsetX: avgOffsetX, offsetY: avgOffsetY };
}

/**
 * Known reference points in the PDF
 * These are exact positions where text appears in the generated PDF
 */
export const PDF_REFERENCE_POINTS = {
  title: { x: 50, y: 750 }, // "Sample Legal Contract" baseline
  date: { x: 50, y: 720 }, // "Date: 9/12/2025" baseline
  firstParagraph: { x: 50, y: 680 }, // First body text line
  signatureLabel: { x: 50, y: 200 }, // "Signature:" baseline
  dateLabel: { x: 50, y: 170 }, // "Date:" baseline (bottom)
};


