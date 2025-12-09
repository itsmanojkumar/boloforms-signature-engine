# Signature Injection Engine - Implementation Guide

## 🎯 Overview

The **Signature Injection Engine** is a responsive form field placement tool that bridges the gap between browser-based editing and PDF generation. It allows users to place, resize, and position form fields on PDFs while maintaining pixel-perfect accuracy across different screen sizes.

## 🏗️ Architecture

### Frontend (React/Next.js)
- **PDF Viewer**: Renders PDFs using `react-pdf` with automatic fallback to native iframe
- **Coordinate Conversion**: Translates between CSS pixels (browser) and PDF points (PDF standard)
- **Drag & Drop Interface**: Intuitive field placement with visual feedback
- **Responsive Scaling**: Automatically adjusts field positions when viewport changes

### Backend (PDF Generation)
- **Field Injection**: Uses `pdf-lib` to embed form fields into PDFs at exact coordinates
- **Multiple Field Types**: Text, Date, Signature, Image, Radio buttons
- **Accurate Positioning**: Maintains coordinate precision across all screen sizes

## 📐 Coordinate System

### The Problem
- **Browsers**: Use CSS pixels with origin at **top-left**
- **PDFs**: Use points (72 DPI) with origin at **bottom-left**
- **Scaling**: Screen zoom affects browser rendering but PDF is static

### The Solution

#### CSS → PDF Conversion (`cssToPdf`)
```
PDF X = CSS X / Scale
PDF Y = PDF Height - (CSS Y + Height) / Scale
```

**Example**: A field at CSS (100px, 200px) on an A4 page (595×842) at 0.5 scale:
```
pdfX = 100 / 0.5 = 200 points
pdfY = 842 - (200 + height) / 0.5
```

#### PDF → CSS Conversion (`pdfToCss`)
```
CSS X = PDF X × Scale
CSS Y = (PDF Height × Scale) - (PDF Y + Height) × Scale
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

### 1. PDF Viewer Component (`src/components/PDFViewer.tsx`)

**Key Features**:
- Dynamic import of `react-pdf` to avoid server-side initialization errors
- Native iframe fallback if `react-pdf` fails to load
- Automatic page dimension detection
- Responsive scaling based on container width

**Error Handling**:
- Try/catch for module loading failures
- Graceful fallback to native PDF viewer
- User-friendly error messages

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
- `handleDrop`: Create new field at drop location
- `handleFieldUpdate`: Update field position/size and convert coordinates
- `handleDownloadPDF`: Fetch current PDF, inject fields, download

### 4. Coordinate Converter (`src/lib/coordinateConverter.ts`)

**Core Functions**:

```typescript
export function cssToPdf(cssPos: CSSPosition, viewport: ViewportInfo): PDFPosition
export function pdfToCss(pdfPos: PDFPosition, viewport: ViewportInfo): CSSPosition
```

**Error Handling**:
- Validates all inputs
- Returns sensible defaults if conversion fails
- Logs errors to console for debugging

### 5. PDF Field Injection (`src/lib/injectFieldsToPDF.ts`)

**Supported Formats**:
- **Text/Date**: Draws text on PDF with border
- **Signature**: Embeds signature image from canvas
- **Image**: Embeds user-uploaded image
- **Radio**: Draws radio circle on PDF

**Y-Coordinate Adjustment**:
```typescript
const pdfY = page.getHeight() - y - height
```
This accounts for PDF's bottom-left origin vs. top-left browser origin.

## 🚀 Running the Application

### Start Development Server
```bash
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
7. **Responsive Testing**:
   - Open Chrome DevTools (F12)
   - Click the device toolbar to switch to mobile view
   - Verify fields stay aligned with the PDF content

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

#### Testing Coordinate Conversion

Add a debug overlay to see PDF coordinates:

```typescript
// In PDFViewer or FormField
{process.env.NODE_ENV === "development" && (
  <div style={{ fontSize: "10px", color: "red" }}>
    PDF: ({field.x.toFixed(0)}, {field.y.toFixed(0)})
    CSS: ({field.cssX.toFixed(0)}, {field.cssY.toFixed(0)})
  </div>
)}
```

## 🐛 Troubleshooting

### PDF Fails to Load
- Check browser console for errors
- Verify the PDF file is valid (use native PDF viewer to test)
- If `react-pdf` fails, native iframe fallback will appear

### Fields Disappear on Resize
- This is expected if viewport height changes dramatically
- Refresh the page to reload the sample PDF
- Fields are stored in state, so they will reappear if viewport stabilizes

### Signature Not Saving
- Click "Save" button after drawing signature
- Check browser console for errors
- Ensure signature pad canvas has proper dimensions

### PDF Download Fails
- Verify at least one field is placed on the PDF
- Check browser console for fetch errors
- Try a smaller PDF file to test

### Responsiveness Issues
- Use Chrome DevTools device emulation (F12 → Toggle device toolbar)
- Verify field positions update when viewport changes
- Check that viewport info is being updated (console logs should appear)

## 📊 Component Hierarchy

```
Home (page.tsx)
├── FieldPalette
├── PDFViewer (Dynamic)
│   └── Iframe (Fallback) or
│   └── ReactPDF.Document
│       └── ReactPDF.Page
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

- **Dynamic Import**: `PDFViewer` loads only on client to reduce bundle size
- **useCallback**: Event handlers memoized to prevent unnecessary re-renders
- **useEffect Cleanup**: Blob URLs revoked to free memory
- **Lazy Scaling**: PDF scaling only recalculates on viewport changes

## 🎓 Learning Resources

- **PDF.js Docs**: https://mozilla.github.io/pdf.js/
- **react-pdf Docs**: https://react-pdf.org/
- **pdf-lib Docs**: https://pdfkit.org/
- **Coordinate Systems**: https://en.wikipedia.org/wiki/Cartesian_coordinate_system

## 📝 Known Limitations

1. **Single Page**: Currently only supports single-page PDFs
2. **PDF Generation**: Uses `pdf-lib` (client-side) which has some limitations
3. **Custom Fonts**: PDF fonts are limited to standard fonts
4. **Vector Graphics**: Complex vector shapes not supported in form fields
5. **Multi-Page Support**: Would require UI redesign to select target pages

## 🚀 Future Enhancements

- [ ] Multi-page PDF support with page selector
- [ ] Custom field labels and validation rules
- [ ] Field templates (e.g., "Legal Document Template")
- [ ] Server-side PDF rendering for high performance
- [ ] Cloud storage integration
- [ ] Signature verification and timestamps
- [ ] Real-time collaboration (WebSockets)
- [ ] Advanced styling (colors, fonts, borders)

## 📞 Support

For issues, questions, or contributions:
1. Check the troubleshooting section above
2. Review component source code (well-commented)
3. Check browser console for detailed error messages
4. Create an issue with reproduction steps

---

**Last Updated**: December 9, 2025
**Version**: 1.0.0 (MVP - Responsive Signature Injection Engine)
