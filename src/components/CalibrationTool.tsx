"use client";

import { useState, useRef } from "react";
import { PDF_REFERENCE_POINTS } from "@/lib/pdfCalibration";
import type { ViewportInfo } from "@/lib/coordinateConverter";

interface CalibrationToolProps {
  viewport: ViewportInfo | null;
  onOffsetChange: (offsetX: number, offsetY: number) => void;
}

export default function CalibrationTool({ viewport, onOffsetChange }: CalibrationToolProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [measurementMode, setMeasurementMode] = useState(false);
  const [measurements, setMeasurements] = useState<Array<{name: string, pdfX: number, pdfY: number, cssX: number, cssY: number}>>([]);

  if (!viewport) return null;

  const handleApply = () => {
    onOffsetChange(offsetX, offsetY);
    setIsOpen(false);
  };

  const handleMeasureClick = (e: React.MouseEvent) => {
    if (!measurementMode || !viewport) return;
    
    // Get click position relative to PDF overlay
    const overlay = (e.target as HTMLElement).closest('[class*="absolute"]') as HTMLElement;
    if (!overlay) return;
    
    const rect = overlay.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    
    // Calculate expected PDF position
    const pdfX = cssX / viewport.scale;
    const pdfY = viewport.pdfHeight - (cssY / viewport.scale);
    
    // Find closest reference point
    const refPoints = [
      { name: "Title", ...PDF_REFERENCE_POINTS.title },
      { name: "Date", ...PDF_REFERENCE_POINTS.date },
      { name: "First Paragraph", ...PDF_REFERENCE_POINTS.firstParagraph },
    ];
    
    const closest = refPoints.reduce((prev, curr) => {
      const distPrev = Math.sqrt(Math.pow(prev.x - pdfX, 2) + Math.pow(prev.y - pdfY, 2));
      const distCurr = Math.sqrt(Math.pow(curr.x - pdfX, 2) + Math.pow(curr.y - pdfY, 2));
      return distCurr < distPrev ? curr : prev;
    });
    
    // Calculate offset
    const expectedCssX = closest.x * viewport.scale;
    const expectedCssY = (viewport.pdfHeight - closest.y) * viewport.scale;
    
    const calcOffsetX = cssX - expectedCssX;
    const calcOffsetY = cssY - expectedCssY;
    
    setMeasurements([...measurements, {
      name: closest.name,
      pdfX: closest.x,
      pdfY: closest.y,
      cssX,
      cssY,
    }]);
    
    // Auto-apply if this is the first measurement
    if (measurements.length === 0) {
      setOffsetX(calcOffsetX);
      setOffsetY(calcOffsetY);
    }
    
    setMeasurementMode(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded shadow-lg hover:bg-purple-700"
        >
          Calibrate
        </button>
      ) : (
        <div className="bg-white border-2 border-purple-500 rounded-lg p-4 shadow-xl max-w-md">
          <h3 className="font-bold mb-2">Coordinate Calibration</h3>
          <p className="text-sm text-gray-600 mb-4">
            Adjust offsets to match fields with PDF text exactly
          </p>
          
          <div className="space-y-2 mb-4">
            <div>
              <label className="text-sm font-medium">Offset X (pixels):</label>
              <input
                type="number"
                value={offsetX}
                onChange={(e) => setOffsetX(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 border rounded"
                step="0.1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Offset Y (pixels):</label>
              <input
                type="number"
                value={offsetY}
                onChange={(e) => setOffsetY(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 border rounded"
                step="0.1"
              />
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-4 space-y-1">
            <p><strong>Reference Points (PDF coordinates):</strong></p>
            <p>Title: (50, 750) → CSS ({50 * viewport.scale}, {(842 - 750) * viewport.scale})</p>
            <p>Date: (50, 720) → CSS ({50 * viewport.scale}, {(842 - 720) * viewport.scale})</p>
          </div>

          {measurements.length > 0 && (
            <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
              <p><strong>Measurements:</strong></p>
              {measurements.map((m, i) => (
                <p key={i}>
                  {m.name}: Clicked at CSS ({m.cssX.toFixed(1)}, {m.cssY.toFixed(1)}), 
                  Expected CSS ({m.pdfX * viewport.scale}, {(viewport.pdfHeight - m.pdfY) * viewport.scale})
                </p>
              ))}
            </div>
          )}

          <div className="text-xs text-gray-600 mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p><strong>Tip:</strong> Enable "Show Reference Points" in the header to see where PDF text should appear. Click on a reference point to measure the offset.</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setMeasurementMode(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              {measurementMode ? "Click on PDF text..." : "Measure"}
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Apply
            </button>
            <button
              onClick={() => {
                setOffsetX(0);
                setOffsetY(0);
                setMeasurements([]);
                setIsOpen(false);
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

