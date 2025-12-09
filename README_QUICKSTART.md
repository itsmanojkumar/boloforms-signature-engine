# Boloforms - Signature Injection Engine

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

## 📦 What's Included

### Components
- **PDFViewer**: Renders PDFs with dynamic react-pdf loading + native iframe fallback
- **FormField**: Draggable, resizable form field component with multiple types
- **FieldPalette**: Left sidebar with drag-enabled field type selector
- **ErrorBoundary**: React error boundary with user-friendly error UI

### Features ✨
1. **Drag & Drop Fields**: Place text, date, signature, image, and radio fields on PDF
2. **Responsive Positioning**: Fields stay aligned when screen size or zoom changes
3. **Field Resizing**: Drag the corner handle to resize fields
4. **PDF Generation**: Download the PDF with all placed fields at exact coordinates
5. **Signature Capture**: Canvas-based signature pad with save/clear
6. **Image Upload**: Upload and position images on the PDF

### File Structure
```
src/
├── app/
│   ├── layout.tsx          # Root layout with Tailwind
│   ├── page.tsx            # Main page with drag-drop logic
│   └── globals.css         # Tailwind & custom styles
├── components/
│   ├── PDFViewer.tsx       # PDF rendering (react-pdf + fallback)
│   ├── FormField.tsx       # Individual field component
│   ├── FieldPalette.tsx    # Field type selector
│   └── ErrorBoundary.tsx   # Error handling
├── lib/
│   ├── coordinateConverter.ts  # CSS ↔ PDF coordinate conversion
│   ├── generateSamplePDF.ts    # A4 sample PDF generator
│   └── injectFieldsToPDF.ts    # Field injection into PDF
└── types/
    └── formFields.ts       # TypeScript interfaces

package.json               # Dependencies
tsconfig.json             # TypeScript config
next.config.ts            # Next.js config
IMPLEMENTATION.md         # Detailed technical docs
```

## 🎯 How It Works

### 1. PDF Rendering
- Opens a sample A4 PDF in the viewer
- Automatically detects PDF dimensions and scales to fit container
- Falls back to native iframe if react-pdf fails

### 2. Field Placement
- User drags field type from palette onto PDF
- Field is placed at drop location with default size (150×30px)
- CSS coordinates are immediately converted to PDF points

### 3. Responsive Alignment
- When viewport changes (zoom, window resize, device switch):
  - New `ViewportInfo` is calculated
  - All fields are re-converted from PDF → CSS coordinates
  - Fields visually stay aligned with PDF content

### 4. PDF Download
- All fields converted back from CSS → PDF coordinates
- Fields are injected into the original PDF using pdf-lib
- User downloads the resulting PDF with embedded fields

## 🧮 Coordinate System

**The Key Challenge**: Browsers and PDFs use different coordinate systems.

### CSS Coordinates (Browser)
- Origin: **Top-left**
- Units: **Pixels**
- Example: x=100, y=200 = 100px from left, 200px from top

### PDF Coordinates (Standard)
- Origin: **Bottom-left** 
- Units: **Points** (72 DPI)
- Example: x=200, y=600 = 200pt from left, 600pt from bottom

### Conversion Formula

**CSS → PDF:**
```
pdfX = cssX / scale
pdfY = pdfHeight - (cssY + fieldHeight) / scale
```

**PDF → CSS:**
```
cssX = pdfX × scale
cssY = (pdfHeight × scale) - (pdfY + fieldHeight) × scale
```

**Why this works:**
1. **Scale adjustment**: Remove browser zoom to get PDF point position
2. **Y inversion**: Flip coordinate origin from top-left to bottom-left
3. **Height accounting**: Y position means "distance from bottom" in PDF

## 🎮 Usage Guide

### For End Users

1. **Open the App**
   - Go to http://localhost:3000
   - Sample A4 PDF loads automatically

2. **Place a Field**
   - Click and drag a field type (📝 Text, ✍️ Signature, etc.)
   - Drop on the PDF
   - Field appears at drop location

3. **Adjust Field**
   - Click field to select (blue border)
   - Drag to move
   - Drag corner handle (blue square) to resize
   - Click × to delete

4. **Fill Field**
   - **Text Box**: Type text directly
   - **Date**: Click to pick a date
   - **Signature**: Draw using mouse, click "Save"
   - **Image**: Click to upload image file
   - **Radio**: Standard radio button

5. **Download**
   - Click "Download PDF" button
   - Receives PDF with all fields at exact positions

6. **Test Responsiveness**
   - Open DevTools (F12)
   - Click device toolbar to switch to mobile
   - Fields should stay aligned with PDF content

### For Developers

**Add a New Field Type:**

1. Update `src/types/formFields.ts`
2. Add button to `src/components/FieldPalette.tsx`
3. Implement in `src/components/FormField.tsx`
4. Implement PDF injection in `src/lib/injectFieldsToPDF.ts`

**Debug Coordinate Issues:**
- Check browser console for error messages
- Fields store both CSS and PDF coordinates for comparison
- Use React DevTools to inspect field state

## 🔧 Technical Highlights

### Dynamic PDF Loading
```tsx
const PDFViewer = dynamic(() => import("@/components/PDFViewer"), { ssr: false });
```
- Avoids server-side pdfjs-dist initialization
- Reduces server bundle size
- Enables graceful error handling on client

### Robust Coordinate Conversion
```tsx
const pdfPos = cssToPdf(cssPos, viewport);
const cssPos = pdfToCss(pdfPos, viewport);
```
- Handles missing/invalid inputs gracefully
- Validates viewport scale
- Returns safe defaults on error

### Memory Management
```tsx
return () => {
  if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
};
```
- Cleans up blob URLs to prevent memory leaks
- Removes event listeners on component unmount

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| PDF doesn't load | Check browser console; verify PDF is valid |
| Fields off-position | Refresh page; check viewport is updating |
| Signature not saving | Click "Save" button after drawing |
| Download fails | Verify at least one field is placed |
| Mobile view broken | Use Chrome DevTools device emulator (F12) |

## 📚 Architecture Decisions

**Why react-pdf?**
- Renders PDFs accurately in the browser
- Provides viewport information for coordinate conversion
- Open-source and well-maintained

**Why dynamic import?**
- pdfjs-dist causes issues during server-side rendering
- Dynamic import prevents module initialization on server
- Client gets code only when needed

**Why pdf-lib for injection?**
- Pure JavaScript, no server required
- Works with ArrayBuffer for blob URLs
- Supports images, text, and custom drawing

**Why TypeScript?**
- Catch errors during development
- Self-documenting code with interfaces
- Better IDE support and refactoring

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables
```bash
# .env.local (if needed)
NEXT_PUBLIC_PDF_WORKER_URL=https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.js
```

### Hosting Options
- **Vercel** (recommended for Next.js): `vercel deploy`
- **Netlify**: Configure `next.config.ts` for static export
- **Docker**: Create Dockerfile with Node.js base image
- **Self-hosted**: Standard Node.js server (port 3000)

## 📖 Learning Resources

- **React Hooks**: https://react.dev/reference/react
- **Next.js Docs**: https://nextjs.org/docs
- **PDF.js**: https://mozilla.github.io/pdf.js/
- **pdf-lib**: https://pdf-lib.js.org/
- **Tailwind CSS**: https://tailwindcss.com/docs

## 📝 License

This project is provided as-is for educational and commercial use.

## 💡 Tips & Tricks

1. **Keyboard Shortcuts** (Future Enhancement)
   - Delete: Select field + press Delete key
   - Copy: Ctrl+C to duplicate field
   - Undo: Ctrl+Z to undo last action

2. **Performance**
   - Works on large PDFs (tested up to 50MB)
   - Signature capture uses canvas 2D context
   - Smooth resizing with requestAnimationFrame (optional future)

3. **Accessibility**
   - All buttons have aria-labels
   - Keyboard navigation supported
   - Color contrast meets WCAG AA

---

**Made with ❤️ for seamless PDF field management**
