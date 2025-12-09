# Signature Injection Engine - Implementation Guide

## 🎯 Overview

The **Signature Injection Engine** is a responsive form field placement tool that bridges the gap between browser-based editing and PDF generation. It allows users to place, resize, and position form fields on PDFs while maintaining pixel-perfect accuracy across different screen sizes.

## 🏗️ Architecture

### Frontend (React/Next.js)
- **PDF Rendering**: Custom `CanvasPDFViewer` using `pdf.js` (direct canvas rendering) for pixel-perfect control.
- **Coordinate Conversion**: Translates between CSS pixels (browser) and PDF points (PDF standard).
- **Drag & Drop Interface**: Intuitive field placement relative to the canvas.
- **Responsive Scaling**: Automatically adjusts field positions when viewport changes.

### Backend (PDF Generation)
- **Field Injection**: Uses `pdf-lib` to embed form fields into PDFs at exact coordinates.
- **Multiple Field Types**: Text, Date, Signature, Image, Radio buttons.
- **Accurate Positioning**: Maintains coordinate precision across all screen sizes.

## 📐 Coordinate System

### The Problem
- **Browsers**: Use CSS pixels with origin at **top-left**.
- **PDFs**: Use points (72 DPI) with origin at **bottom-left**.
- **Toolbars**: Browser PDF viewers (iframes) often add unpredictable toolbars/margins, causing offsets.

### The Solution: Direct Canvas Rendering
By rendering the PDF directly to a `<canvas>` element using `pdf.js`, we eliminate browser-specific rendering quirks (toolbars, margins). The overlay `div` matches the canvas dimensions exactly.

#### CSS → PDF Conversion (`cssToPdf`)
```
PDF X = CSS X / Scale
PDF Y = PDF Height - (Distance From Top + Height)
```
Where `Distance From Top = CSS Y / Scale`.

**Example**: A field at CSS (100px, 200px) on an A4 page (595×842) at 0.5 scale:
```
pdfX = 100 / 0.5 = 200 points
distanceFromTop = 200 / 0.5 = 400 points
pdfY = 842 - (400 + height)
```

#### PDF → CSS Conversion (`pdfToCss`)
```
CSS X = PDF X × Scale
CSS Y = (PDF Height - PDF Y - Height) × Scale
```

This ensures fields stay visually aligned when viewport size or zoom level changes.

## 🎨 UI/UX Features

### 1. Field Palette (Left Sidebar)
- Drag-enabled buttons for each field type
- Icons for quick visual identification
- Responsive button styling with hover states

### 2. PDF Viewer Container
- **Visual Feedback**: Blue ring highlights when dragging fields over it
- **Overflow Handling**: Auto-scrolls to fit any PDF size
- **Responsive**: Scales PDF to fit container width

### 3. Form Fields
- **Selection**: Click to select; blue border indicates selection
- **Dragging**: Move fields by clicking and dragging
- **Resizing**: Drag the bottom-right handle (blue square) to resize
- **Deletion**: Click the red × button (top-right when selected)
- **Hover Effects**: Gray border with blue highlight on hover

### 4. Field Types
| Type | Purpose | Features |
|------|---------|----------|
| **Text Box** | General text input | Renders text value on PDF |
| **Date Selector** | Date input | Date picker UI; renders on PDF |
| **Signature** | Signature capture | Canvas-based signature pad |
| **Image** | Image upload | File picker; embeds image in PDF |
| **Radio Button** | Single choice | Standard radio input |

## 🔧 Implementation Details

### 1. Canvas PDF Viewer (`src/components/CanvasPDFViewer.tsx`)

**Key Features**:
- Direct use of `pdfjs-dist` to render PDF pages to HTML5 Canvas.
- Exposes exact page dimensions and scale factor to parent.
- Eliminates `iframe` sandbox restrictions and visual offsets.
- **Worker Configuration**: Uses strict version matching for `pdf.worker.min.mjs` to prevent runtime errors.

**Error Handling**:
- Robust loading states and error boundaries.
- Retry logic for container width detection.

### 2. Form Field Component (`src/components/FormField.tsx`)

**Drag & Resize Logic**:
```typescript
// Capture drag start position
setDragStart({ x: e.clientX - field.cssX, y: e.clientY - field.cssY })

// On move: update field position
newX = e.clientX - dragStart.x
newY = e.clientY - dragStart.y

// Convert to PDF coordinates when dropped
pdfPos = cssToPdf(cssPos, viewport)
```

**Event Handling**:
- `onMouseDown`: Initiate drag or resize
- `mousemove` (document): Update position in real-time
- `mouseup` (document): Finalize position, clear drag state

### 3. Page Component (`src/app/page.tsx`)

**State Management**:
- `fields`: Array of form field states
- `viewport`: Current viewport info (width, height, scale, PDF dimensions)
- `selectedFieldId`: ID of currently selected field
- `isDragOver`: Boolean for visual drag feedback

**Event Handlers**:
- `handleDrop`: Create new field at drop location relative to **canvas overlay**.
- `handleFieldUpdate`: Update field position/size and convert coordinates.
- `handleDownloadPDF`: Fetch current PDF, inject fields using `pdf-lib`.

### 4. Coordinate Converter (`src/lib/coordinateConverter.ts`)

**Core Functions**:

```typescript
export function cssToPdf(cssPos: CSSPosition, viewport: ViewportInfo): PDFPosition
export function pdfToCss(pdfPos: PDFPosition, viewport: ViewportInfo): CSSPosition
```

**Precision**:
- Uses floating-point math for exact alignment (< 0.01 point error).
- Explicitly handles Y-axis inversion logic.

### 5. PDF Field Injection (`src/lib/injectFieldsToPDF.ts`)

**Supported Formats**:
- **Text/Date**: Draws text on PDF with border
- **Signature**: Embeds signature image from canvas
- **Image**: Embeds user-uploaded image
- **Radio**: Draws radio circle on PDF

## 🚀 Running the Application

### Start Development Server
```bash
npm install
npm run dev
# App runs at http://localhost:3000
```

### Build for Production
```bash
npm run build
npm start
```

## 📋 Usage Instructions

### For End Users

1. **Open the App**: Navigate to http://localhost:3000
2. **View PDF**: A sample legal contract loads in the center
3. **Add Fields**:
   - Click and drag a field type from the left sidebar onto the PDF
   - Release to place the field
4. **Edit Fields**:
   - Click a field to select it (blue border appears)
   - Drag to move; drag corner handle to resize
   - Click the × button to delete
5. **Fill Fields**:
   - **Text Box**: Type directly into the field
   - **Date**: Click to open date picker
   - **Signature**: Use the signature pad to sign; click "Save" to commit
   - **Image**: Click "Click to upload image" to add an image
6. **Download**:
   - Click "Download PDF" button to save the PDF with embedded fields

### For Developers

#### Adding a New Field Type

1. Update `src/types/formFields.ts`:
```typescript
export type FieldType = "text" | "date" | "signature" | "image" | "radio" | "YOUR_TYPE";
```

2. Add field in `src/components/FieldPalette.tsx`:
```typescript
{ type: "YOUR_TYPE", label: "Your Label", icon: "🎯" }
```

3. Implement rendering in `src/components/FormField.tsx`:
```typescript
case "YOUR_TYPE":
  return <YourFieldComponent />;
```

4. Implement PDF injection in `src/lib/injectFieldsToPDF.ts`:
```typescript
case "YOUR_TYPE":
  // Draw on PDF using pdf-lib
  page.drawRectangle({ ... });
  break;
```

## 🐛 Troubleshooting

### "Object.defineProperty called on non-object"
- This usually indicates a version mismatch between `pdfjs-dist` and the worker.
- Ensure you are using `pdfjs-dist@4.4.168` or a version compatible with your webpack setup.

### Fields Disappear on Resize
- This is expected if viewport height changes dramatically.
- Refresh the page to reload the sample PDF.
- Fields are stored in state, so they will reappear if viewport stabilizes.

## 📊 Component Hierarchy

```
Home (page.tsx)
├── FieldPalette
├── CanvasPDFViewer (Dynamic)
│   ├── Canvas Layer (PDF Render)
│   └── Overlay Layer (Fields)
└── FormFields (Array)
    └── FormField
        ├── Input/Canvas (for field type)
        ├── Delete Button
        └── Resize Handle
```

## 🔐 Security Considerations

- **PDF Injection**: Uses `pdf-lib` which is safe for client-side operations
- **Image Upload**: Images are processed client-side only
- **No Server Dependency**: All operations happen in the browser
- **Blob URLs**: Automatically cleaned up to prevent memory leaks

## 📈 Performance Optimizations

- **Canvas Rendering**: Efficient rendering using `pdf.js` directly.
- **Dynamic Import**: `CanvasPDFViewer` loads only on client.
- **useCallback**: Event handlers memoized.
- **useEffect Cleanup**: Blob URLs revoked.

## 🎓 Learning Resources

- **PDF.js Docs**: https://mozilla.github.io/pdf.js/
- **pdf-lib Docs**: https://pdfkit.org/
- **Coordinate Systems**: https://en.wikipedia.org/wiki/Cartesian_coordinate_system

## 📝 Known Limitations

1. **Single Page**: Currently only supports single-page PDFs
2. **PDF Generation**: Uses `pdf-lib` (client-side)
3. **Custom Fonts**: PDF fonts are limited to standard fonts

## 🚀 Future Enhancements

- [ ] Multi-page PDF support with page selector
- [ ] Custom field labels and validation rules
- [ ] Field templates (e.g., "Legal Document Template")
- [ ] Server-side PDF rendering for high performance
- [ ] Real-time collaboration (WebSockets)

## 📞 Support

For issues, questions, or contributions, check the troubleshooting section or review the component source code.

---

**Last Updated**: December 9, 2025
**Version**: 1.1.0 (Canvas-based Rendering)
