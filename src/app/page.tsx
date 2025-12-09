"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

const CanvasPDFViewer = dynamic(() => import("@/components/CanvasPDFViewer"), {
  ssr: false,
});

import FormField from "@/components/FormField";
import FieldPalette from "@/components/FieldPalette";
import ErrorBoundary from "@/components/ErrorBoundary";
import ReferenceOverlay from "@/components/ReferenceOverlay";
import type { FieldType } from "@/types/formFields";
import type { FormFieldState } from "@/types/formFields";
import type { ViewportInfo } from "@/lib/coordinateConverter";
import { cssToPdf, pdfToCss } from "@/lib/coordinateConverter";
import { generateSamplePDF } from "@/lib/generateSamplePDF";
import { injectFieldsToPDF } from "@/lib/injectFieldsToPDF";

export default function Home() {
  const [fields, setFields] = useState<FormFieldState[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ViewportInfo | null>(null);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showReferenceOverlay, setShowReferenceOverlay] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const pdfBlobUrlRef = useRef<string | null>(null);

  // Generate sample PDF on mount
  useEffect(() => {
    let mounted = true;
    
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        const pdfBytes = await generateSamplePDF();
        
        if (!mounted) return;
        
        if (pdfBytes && pdfBytes instanceof Uint8Array) {
          const blob = new Blob([pdfBytes], { type: "application/pdf" });
          const blobUrl = URL.createObjectURL(blob);
          pdfBlobUrlRef.current = blobUrl;
          setPdfFile(blobUrl);
          setLoading(false);
        } else {
          throw new Error("Invalid PDF bytes received");
        }
      } catch (err) {
        if (!mounted) return;
        console.error("Error generating PDF:", err);
        setError(err instanceof Error ? err.message : "Failed to generate PDF");
        setLoading(false);
      }
    };
    
    loadPDF();
    
    return () => {
      mounted = false;
      if (pdfBlobUrlRef.current) {
        URL.revokeObjectURL(pdfBlobUrlRef.current);
        pdfBlobUrlRef.current = null;
      }
    };
  }, []);


  const handleViewportChange = useCallback((newViewport: ViewportInfo) => {
    if (!newViewport || typeof newViewport.scale !== "number") return;
    
    setViewport(newViewport);
    setFields((prevFields) =>
      prevFields.map((field) => {
        try {
          const pdfPos = {
            x: field.x || 0,
            y: field.y || 0,
            width: field.width || 100,
            height: field.height || 30,
          };
          const cssPos = pdfToCss(pdfPos, newViewport);
          return {
            ...field,
            cssX: cssPos.x || 0,
            cssY: cssPos.y || 0,
            cssWidth: cssPos.width || 100,
            cssHeight: cssPos.height || 30,
          };
        } catch (err) {
          console.error("Error updating field position:", err);
          return field;
        }
      })
    );
  }, []);

  const handleFieldSelect = useCallback((type: FieldType) => {
    if (!viewport) return;

    // Default size
    const defaultWidth = 150;
    const defaultHeight = 30;

    // Place in center of the PDF page (safe default)
    // pdfWidth is in points. 
    const pdfX = (viewport.pdfWidth / 2) - (defaultWidth / viewport.scale / 2);
    const pdfY = (viewport.pdfHeight / 2) - (defaultHeight / viewport.scale / 2);

    const cssPos = pdfToCss({ 
        x: pdfX, 
        y: pdfY, 
        width: defaultWidth / viewport.scale, 
        height: defaultHeight / viewport.scale 
    }, viewport);

    const newField: FormFieldState = {
      id: `field-${Date.now()}`,
      type,
      x: pdfX,
      y: pdfY,
      width: defaultWidth / viewport.scale,
      height: defaultHeight / viewport.scale,
      cssX: cssPos.x,
      cssY: cssPos.y,
      cssWidth: cssPos.width,
      cssHeight: cssPos.height,
    };

    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  }, [viewport]);

  const handleDrop = useCallback(
    (e: React.DragEvent, overlayRect: DOMRect) => {
      e.preventDefault();
      const fieldType = e.dataTransfer.getData("fieldType") as FieldType;
      if (!fieldType || !viewport) return;

      try {
        // EXACT calculation: Position relative to overlay (which matches PDF exactly)
        // Note: Browser PDF viewer may have toolbar at top, but overlay is positioned
        // to match the actual PDF content area, so we use overlay coordinates directly
        const mouseX = e.clientX - overlayRect.left;
        const mouseY = e.clientY - overlayRect.top;
        
        console.log("EXACT Drop Position Relative to Overlay:", {
          mouseClient: { x: e.clientX.toFixed(4), y: e.clientY.toFixed(4) },
          overlayBounds: {
            left: overlayRect.left.toFixed(4),
            top: overlayRect.top.toFixed(4),
            width: overlayRect.width.toFixed(4),
            height: overlayRect.height.toFixed(4),
          },
          relativePosition: {
            mouseX: mouseX.toFixed(4),
            mouseY: mouseY.toFixed(4),
          },
          note: "Position is relative to overlay which should match PDF content area"
        });

        const defaultWidth = 150;
        const defaultHeight = 30;

        // Center the field on the drop point
        const cssPos = {
          x: Math.max(0, mouseX - defaultWidth / 2),
          y: Math.max(0, mouseY - defaultHeight / 2),
          width: defaultWidth,
          height: defaultHeight,
        };

        console.log("EXACT Drop Calculation:", {
          step1_mousePosition: {
            clientX: e.clientX.toFixed(4),
            clientY: e.clientY.toFixed(4),
            overlayLeft: overlayRect.left.toFixed(4),
            overlayTop: overlayRect.top.toFixed(4),
          },
          step2_relativePosition: {
            mouseX: mouseX.toFixed(4),
            mouseY: mouseY.toFixed(4),
          },
          step3_cssPosition: {
            cssX: cssPos.x.toFixed(4),
            cssY: cssPos.y.toFixed(4),
            cssWidth: cssPos.width.toFixed(4),
            cssHeight: cssPos.height.toFixed(4),
          },
          viewport: {
            scale: viewport.scale.toFixed(6),
            pdfWidth: viewport.pdfWidth.toFixed(4),
            pdfHeight: viewport.pdfHeight.toFixed(4),
          }
        });

        const pdfPos = cssToPdf(cssPos, viewport);

        console.log("EXACT PDF Position Result:", {
          pdfX: pdfPos.x.toFixed(4),
          pdfY: pdfPos.y.toFixed(4),
          pdfWidth: pdfPos.width.toFixed(4),
          pdfHeight: pdfPos.height.toFixed(4),
          verification: {
            cssTopEdge: cssPos.y.toFixed(4),
            pdfTopEdge: (viewport.pdfHeight - pdfPos.y - pdfPos.height).toFixed(4),
            expectedPdfTopEdge: (cssPos.y / viewport.scale).toFixed(4),
            match: Math.abs((viewport.pdfHeight - pdfPos.y - pdfPos.height) - (cssPos.y / viewport.scale)) < 0.01,
          }
        });

        const newField: FormFieldState = {
          id: `field-${Date.now()}`,
          type: fieldType,
          x: pdfPos.x || 0,
          y: pdfPos.y || 0,
          width: pdfPos.width || defaultWidth,
          height: pdfPos.height || defaultHeight,
          cssX: cssPos.x,
          cssY: cssPos.y,
          cssWidth: cssPos.width,
          cssHeight: cssPos.height,
        };

        setFields((prev) => [...prev, newField]);
        setSelectedFieldId(newField.id);
      } catch (err) {
        console.error("Error handling drop:", err);
      }
    },
    [viewport]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only leave if we're leaving the container itself
    if (e.target === pdfContainerRef.current) {
      setIsDragOver(false);
    }
  }, []);

  const handleDropEnd = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFieldUpdate = useCallback(
    (updatedField: FormFieldState) => {
      if (!viewport) return;

      try {
        const cssPos = {
          x: updatedField.cssX,
          y: updatedField.cssY,
          width: updatedField.cssWidth,
          height: updatedField.cssHeight,
        };

        const pdfPos = cssToPdf(cssPos, viewport);

        setFields((prev) =>
          prev.map((field) =>
            field.id === updatedField.id
              ? {
                  ...updatedField,
                  x: pdfPos.x,
                  y: pdfPos.y,
                  width: pdfPos.width,
                  height: pdfPos.height,
                }
              : field
          )
        );
      } catch (err) {
        console.error("Error updating field:", err);
      }
    },
    [viewport]
  );

  const handleFieldDelete = useCallback((id: string) => {
    setFields((prev) => prev.filter((field) => field.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(null);
    }
  }, [selectedFieldId]);

  const handleDownloadPDF = useCallback(async () => {
    if (!pdfFile || fields.length === 0) {
      alert(pdfFile ? "No fields to save" : "PDF not loaded");
      return;
    }

    try {
      const pdfFields = fields.map((field) => ({
        id: field.id,
        type: field.type,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        value: field.value,
        label: field.label,
        options: field.options,
        imageData: field.imageData,
        signatureData: field.signatureData,
      }));

      const response = await fetch(pdfFile);
      const arrayBuffer = await response.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);

      // No calibration offset - use exact coordinates
      const modifiedPdfBytes = await injectFieldsToPDF(pdfBytes, pdfFields, 0, 0);

      const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "document-with-fields.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Error generating PDF. Check console for details.");
    }
  }, [fields, pdfFile]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50" style={{ height: "100vh", overflow: "hidden" }}>
      <FieldPalette onFieldSelect={handleFieldSelect} />
      <div className="flex-1 flex flex-col" style={{ minWidth: 0, overflow: "hidden" }}>
        <div className="bg-white border-b border-gray-200 p-4 flex flex-col md:flex-row items-center justify-between flex-shrink-0 gap-4 md:gap-0">
          <h1 className="text-xl font-bold text-gray-800">
            Signature Injection Engine
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowReferenceOverlay(!showReferenceOverlay)}
              className={`px-4 py-2 rounded ${
                showReferenceOverlay 
                  ? "bg-purple-600 text-white hover:bg-purple-700" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {showReferenceOverlay ? "Hide" : "Show"} Reference Points
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Download PDF
            </button>
          </div>
        </div>
        <div
          ref={pdfContainerRef}
          className={`flex-1 overflow-auto ${isDragOver ? "bg-blue-50 ring-2 ring-blue-400" : "bg-gray-100"}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading PDF...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center p-8 bg-white rounded shadow">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Reload Page
                </button>
              </div>
            </div>
          ) : pdfFile ? (
            <ErrorBoundary>
              <CanvasPDFViewer file={pdfFile} onViewportChange={handleViewportChange} onDrop={handleDrop}>
                <ReferenceOverlay 
                  viewport={viewport} 
                  show={showReferenceOverlay}
                  onPointClick={(pdfX, pdfY, cssX, cssY) => {
                    // When user clicks on a reference point, calculate offset
                    console.log("Reference point clicked:", { pdfX, pdfY, cssX, cssY });
                  }}
                />
                {fields.map((field) => (
                  <FormField
                    key={field.id}
                    field={field}
                    onUpdate={handleFieldUpdate}
                    onDelete={handleFieldDelete}
                    isSelected={selectedFieldId === field.id}
                    onSelect={setSelectedFieldId}
                  />
                ))}
              </CanvasPDFViewer>
            </ErrorBoundary>
          ) : null}
        </div>
      </div>
    </div>
  );
}
