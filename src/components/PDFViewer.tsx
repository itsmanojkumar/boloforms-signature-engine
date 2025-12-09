"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { ViewportInfo } from "@/lib/coordinateConverter";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  file: string;
  onViewportChange: (viewport: ViewportInfo) => void;
  children?: React.ReactNode;
}

export default function PDFViewer({
  file,
  onViewportChange,
  children,
}: PDFViewerProps) {
  const [pageWidth, setPageWidth] = useState(595);
  const [pageHeight, setPageHeight] = useState(842);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || pageWidth <= 0) return;
    
    const updateScale = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth - 32;
      const newScale = Math.min(containerWidth / pageWidth, 1);
      setScale(newScale);
      
      onViewportChange({
        width: containerWidth,
        height: pageHeight * newScale,
        scale: newScale,
        pdfWidth: pageWidth,
        pdfHeight: pageHeight,
      });
    };
    
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [pageWidth, pageHeight, onViewportChange]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex justify-center items-start p-4 overflow-auto bg-gray-100"
    >
      <div className="relative">
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => console.log(`Loaded ${numPages} pages`)}
          loading={<div className="p-8">Loading PDF...</div>}
          error={<div className="p-8 text-red-600">Error loading PDF</div>}
        >
          <Page
            pageNumber={1}
            scale={scale}
            onLoadSuccess={(page) => {
              setPageWidth(page.width);
              setPageHeight(page.height);
            }}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
        {children && (
          <div
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              width: `${pageWidth * scale}px`,
              height: `${pageHeight * scale}px`,
            }}
          >
            <div className="relative w-full h-full pointer-events-auto">
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
