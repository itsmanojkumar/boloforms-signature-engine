"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Define PDFJS version to use (fallback to hardcoded if import fails)
const PDF_VERSION = "4.4.168";

// Initialize worker source only once
if (typeof window !== "undefined") {
  // Use a stable CDN for the worker
  const workerSrc = `https://unpkg.com/pdfjs-dist@${PDF_VERSION}/build/pdf.worker.min.mjs`;
  if (pdfjsLib.GlobalWorkerOptions.workerSrc !== workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
    console.log(`[CanvasPDFViewer] Initialized PDF.js worker: ${workerSrc}`);
  }
}

interface ViewportInfo {
  width: number;
  height: number;
  scale: number;
  pdfWidth: number;
  pdfHeight: number;
}

interface CanvasPDFViewerProps {
  file: string | Uint8Array; // Blob URL or Uint8Array
  onViewportChange: (viewport: ViewportInfo) => void;
  onDrop: (e: React.DragEvent, overlayRect: DOMRect) => void;
  children?: ReactNode;
}

export default function CanvasPDFViewer({
  file,
  onViewportChange,
  onDrop,
  children,
}: CanvasPDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Track PDF doc and page for resize handling
  const pdfPageRef = useRef<any>(null);

  // Load and Render PDF
  useEffect(() => {
    let isMounted = true;
    let pdfDocument: any = null;
    let renderTask: any = null;

    const render = async () => {
      try {
        console.log("[CanvasPDFViewer] Starting render...");
        setLoading(true);
        setError(null);

        if (!containerRef.current) {
          console.warn("[CanvasPDFViewer] Container ref is null");
          return;
        }
        if (!canvasRef.current) {
          console.warn("[CanvasPDFViewer] Canvas ref is null");
          return;
        }

        // 1. Load the document
        console.log("[CanvasPDFViewer] Loading document...", file instanceof Uint8Array ? "Uint8Array" : file);
        const loadingTask = pdfjsLib.getDocument(file);
        
        loadingTask.onProgress = (p: any) => {
          // Optional: handle progress
        };

        pdfDocument = await loadingTask.promise;
        
        if (!isMounted) {
          console.log("[CanvasPDFViewer] Unmounted during load");
          return;
        }

        console.log(`[CanvasPDFViewer] Document loaded. Pages: ${pdfDocument.numPages}`);

        // 2. Get the first page
        const page = await pdfDocument.getPage(1);
        pdfPageRef.current = page;
        console.log("[CanvasPDFViewer] Page 1 loaded");

        // 3. Render page
        await renderPage(page);

        setLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        
        // Filter out "cancelled" errors which are normal on re-render
        if (err.name === "RenderingCancelledException") {
          console.log("[CanvasPDFViewer] Rendering cancelled");
          return;
        }

        console.error("[CanvasPDFViewer] Render Error:", err);
        setError(err.message || "Failed to render PDF");
        setLoading(false);
      }
    };

    const renderPage = async (page: any) => {
        if (!containerRef.current || !canvasRef.current) return;

        // Calculate scale to fit container
        const containerWidth = containerRef.current.clientWidth;
        if (containerWidth === 0) {
           console.warn("[CanvasPDFViewer] Container width is 0, waiting...");
           // Retry soon
           setTimeout(() => renderPage(page), 100);
           return;
        }

        // Get unscaled viewport to know original dimensions
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / unscaledViewport.width;
        
        console.log("[CanvasPDFViewer] Calculated scale:", { 
          containerWidth, 
          originalWidth: unscaledViewport.width, 
          scale 
        });

        const viewport = page.getViewport({ scale });

        // Update parent with viewport info
        if (onViewportChange) {
            onViewportChange({
              width: viewport.width,
              height: viewport.height,
              scale: scale,
              pdfWidth: unscaledViewport.width,
              pdfHeight: unscaledViewport.height,
            });
        }

        // Prepare canvas
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not get canvas context");

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render
        if (renderTask) {
            renderTask.cancel();
        }

        console.log("[CanvasPDFViewer] Starting page render to canvas");
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        renderTask = page.render(renderContext);
        await renderTask.promise;
        console.log("[CanvasPDFViewer] Render complete");
    };

    // Use a small timeout to ensure container has width
    const timeoutId = setTimeout(render, 100);

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
        if (pdfPageRef.current) {
            // Only re-render if width actually changed (avoid loops)
            const currentWidth = containerRef.current?.clientWidth;
            if (currentWidth && Math.abs(currentWidth - (canvasRef.current?.width || 0)) > 5) {
                console.log("[CanvasPDFViewer] Resize detected, re-rendering...");
                renderPage(pdfPageRef.current).catch(err => {
                    // Ignore cancellation errors during resize
                    if (err.name !== "RenderingCancelledException") {
                        console.error("Resize render error:", err);
                    }
                });
            }
        }
    });

    if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      if (renderTask) {
        console.log("[CanvasPDFViewer] Cancelling render task");
        renderTask.cancel();
      }
      if (pdfDocument) {
        console.log("[CanvasPDFViewer] Destroying document");
        pdfDocument.destroy();
      }
    };
  }, [file, onViewportChange]); // Re-render if file changes

  // Handle Drop on the Overlay
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (containerRef.current && canvasRef.current) {
        // Use canvas rect for precision
        const rect = canvasRef.current.getBoundingClientRect();
        if (rect) {
            onDrop(e, rect);
        }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col items-center w-full bg-gray-100 p-4 h-full overflow-auto">
      <div 
        ref={containerRef} 
        className="relative shadow-lg bg-white" 
        style={{ width: '100%', maxWidth: '800px' }} // Limit max width for A4 feel
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-500">Rendering PDF...</span>
          </div>
        )}
        {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10 p-4">
                <p className="text-red-600 font-medium">Error: {error}</p>
                <p className="text-xs text-red-500 mt-2">Check console for details</p>
            </div>
        )}
        
        {/* The Canvas Layer */}
        <canvas 
            ref={canvasRef} 
            className="block" // Remove inline-block spacing
            style={{ width: '100%', height: 'auto' }} // Ensure canvas scales with container
        />

        {/* The Overlay Layer */}
        {!loading && !error && (
            <div 
                className="absolute inset-0 z-20"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                {children}
            </div>
        )}
      </div>
    </div>
  );
}
