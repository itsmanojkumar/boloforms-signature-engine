"use client";

import { useEffect, useState } from "react";
import type { ViewportInfo } from "@/lib/coordinateConverter";
import { PDF_REFERENCE_POINTS } from "@/lib/pdfCalibration";

interface ReferenceOverlayProps {
  viewport: ViewportInfo | null;
  show: boolean;
  onPointClick?: (pdfX: number, pdfY: number, cssX: number, cssY: number) => void;
}

export default function ReferenceOverlay({ viewport, show, onPointClick }: ReferenceOverlayProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  if (!viewport || !show) return null;

  const referencePoints = [
    { id: "title", label: "Title", ...PDF_REFERENCE_POINTS.title },
    { id: "date", label: "Date", ...PDF_REFERENCE_POINTS.date },
    { id: "firstParagraph", label: "First Para", ...PDF_REFERENCE_POINTS.firstParagraph },
  ];

  const handlePointClick = (point: typeof referencePoints[0]) => {
    if (!onPointClick) return;
    
    // Convert PDF coordinates to CSS
    const cssX = point.x * viewport.scale;
    const cssY = (viewport.pdfHeight - point.y) * viewport.scale;
    
    onPointClick(point.x, point.y, cssX, cssY);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {referencePoints.map((point) => {
        const cssX = point.x * viewport.scale;
        const cssY = (viewport.pdfHeight - point.y) * viewport.scale;
        
        return (
          <div
            key={point.id}
            className={`absolute transition-all ${
              hoveredPoint === point.id ? "opacity-100 scale-110" : "opacity-60"
            } ${onPointClick ? "pointer-events-auto cursor-pointer" : ""}`}
            style={{
              left: `${cssX}px`,
              top: `${cssY}px`,
              transform: "translate(-50%, -50%)",
            }}
            onMouseEnter={() => setHoveredPoint(point.id)}
            onMouseLeave={() => setHoveredPoint(null)}
            onClick={() => handlePointClick(point)}
          >
            <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg" />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
              {point.label}
              <div className="text-[10px] opacity-75 mt-0.5">
                PDF: ({point.x}, {point.y})
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}





