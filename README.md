# Signature Injection Engine

A prototype "Signature Injection Engine" that bridges the gap between web browsers (CSS pixels, top-left origin) and PDF files (points, bottom-left origin). This application allows users to drag and drop form fields onto PDF documents with perfect coordinate conversion, ensuring fields appear in the exact location on the final PDF regardless of screen size.

**Update (v1.1.0)**: Now uses a precise **Canvas-based Rendering** engine (via `pdf.js`) to eliminate browser toolbar offsets and guarantee pixel-perfect alignment.

## Features

- **Precise PDF Viewer**: Renders PDF directly to HTML5 Canvas for exact alignment.
- **Drag & Drop**: Drag form fields from the palette onto the PDF.
- **Form Field Types**:
  - Text Box
  - Signature Field (with drawing capability)
  - Image Box
  - Date Selector
  - Radio Button
- **Resize Fields**: Resize fields by dragging the bottom-right corner.
- **Responsive Design**: Fields maintain their positions relative to PDF content when switching between desktop and mobile views.
- **Coordinate Conversion**: Seamless conversion between CSS pixels (96 DPI, top-left) and PDF points (72 DPI, bottom-left).
- **PDF Export**: Download the PDF with all fields injected at their exact positions.

## Technology Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **pdfjs-dist** - Direct PDF-to-Canvas rendering
- **pdf-lib** - PDF manipulation and field injection
- **signature_pad** - Signature drawing capability
- **Tailwind CSS** - Styling

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### Coordinate Conversion

The engine handles the conversion between two coordinate systems:

1. **CSS Pixels** (Browser):
   - Origin: Top-left corner
   - Units: Pixels (96 DPI)
   - Used for: UI rendering and user interaction

2. **PDF Points** (PDF):
   - Origin: Bottom-left corner
   - Units: Points (72 DPI)
   - Used for: Final PDF output

The conversion system:
- Tracks viewport scale and PDF dimensions.
- Converts positions when fields are placed or moved.
- Updates CSS positions when viewport changes (responsive).
- Converts back to PDF points when exporting.

### Field Placement

1. Drag a field from the left palette onto the PDF.
2. The field is positioned at the drop location relative to the Canvas.
3. CSS coordinates are converted to PDF coordinates.
4. Field can be moved by dragging.
5. Field can be resized by dragging the corner handle.

### Responsive Behavior

When the browser window is resized or viewport changes:
- PDF scales to fit the container.
- Field CSS positions are recalculated based on their PDF positions.
- Fields stay anchored to the correct location on the PDF.

### PDF Export

When downloading the PDF:
- All field positions are converted from CSS to PDF coordinates.
- Fields are injected into the PDF at exact positions.
- Text, signatures, images, and other field types are rendered correctly.

## Usage

1. **Add Fields**: Drag fields from the left sidebar onto the PDF.
2. **Move Fields**: Click and drag a field to reposition it.
3. **Resize Fields**: Select a field and drag the bottom-right corner.
4. **Fill Fields**:
   - Text/Date: Type directly into the field
   - Signature: Draw with mouse/touch, then click "Save"
   - Image: Click to upload an image file
   - Radio: Click to select
5. **Delete Fields**: Select a field and click the × button.
6. **Download**: Click "Download PDF" to get the final PDF with all fields.

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main application page
│   └── layout.tsx        # Root layout
├── components/
│   ├── CanvasPDFViewer.tsx # Precise Canvas PDF renderer
│   ├── FormField.tsx     # Individual form field component
│   ├── FieldPalette.tsx  # Field selection palette
│   └── ErrorBoundary.tsx # Error handling
├── lib/
│   ├── coordinateConverter.ts  # CSS ↔ PDF coordinate conversion
│   ├── generateSamplePDF.ts    # Sample PDF generator
│   └── injectFieldsToPDF.ts   # PDF field injection
└── types/
    └── formFields.ts     # TypeScript type definitions
```

## Key Implementation Details

### Canvas Rendering
Instead of using an `iframe` (which introduces uncontrollable margins and toolbars), we render the PDF page directly to a `<canvas>`. This gives us total control over the coordinate space.

### Viewport Tracking
The `CanvasPDFViewer` component tracks:
- Container width/height
- PDF page dimensions (in points)
- Current scale factor
- Updates on window resize

### Field State Management
Each field stores:
- PDF coordinates (x, y, width, height in points)
- CSS coordinates (cssX, cssY, cssWidth, cssHeight in pixels)
- Field type and value
- Additional data (images, signatures, etc.)

## License

MIT
