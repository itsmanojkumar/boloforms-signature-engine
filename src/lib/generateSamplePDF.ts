/**
 * Generate a sample PDF for testing
 * This creates a simple A4 PDF with some text content
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function generateSamplePDF(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size in points (8.27" x 11.69" at 72 DPI)

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Title
  page.drawText("Sample Legal Contract", {
    x: 50,
    y: 750,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Date
  page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: 720,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Body text
  const bodyText = [
    "This is a sample legal contract document for testing the Signature Injection Engine.",
    "",
    "You can drag and drop form fields onto this document to test the coordinate",
    "conversion system between CSS pixels and PDF points.",
    "",
    "Instructions:",
    "1. Drag fields from the left palette onto the PDF",
    "2. Resize fields by dragging the bottom-right corner",
    "3. Fill in the fields as needed",
    "4. Sign the document using the signature field",
    "",
    "The fields will maintain their positions relative to the PDF content even when",
    "you resize the browser window or switch between desktop and mobile views.",
    "",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor",
    "incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis",
    "nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    "",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore",
    "eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt",
    "in culpa qui officia deserunt mollit anim id est laborum.",
    "",
    "By signing below, you agree to the terms and conditions stated in this document.",
  ];

  let yPos = 680;
  bodyText.forEach((line) => {
    page.drawText(line, {
      x: 50,
      y: yPos,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPos -= 20;
  });

  // Signature line
  page.drawText("Signature:", {
    x: 50,
    y: 200,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawLine({
    start: { x: 150, y: 205 },
    end: { x: 400, y: 205 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Date field
  page.drawText("Date:", {
    x: 50,
    y: 170,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawLine({
    start: { x: 100, y: 175 },
    end: { x: 250, y: 175 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}










