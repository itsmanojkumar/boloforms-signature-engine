"use client";

import { useRef, useEffect, useState } from "react";
import type { ViewportInfo } from "@/lib/coordinateConverter";

interface SimplePDFViewerProps {
  file: string;
  onViewportChange: (viewport: ViewportInfo) => void;
  onDrop?: (e: React.DragEvent, overlayRect: DOMRect) => void;
  children?: React.ReactNode;
}

export default function SimplePDFViewer({
  file,
  onViewportChange,
  onDrop,
  children,
}: SimplePDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [dimensions, setDimensions] = useState({ width: 595, height: 842 });
  const [scale, setScale] = useState(1);
  // Browser PDF viewers (Chrome, Edge, Firefox) typically add ~40-50px toolbar at top
  // This pushes the PDF content down, so overlay must account for this
  const [toolbarHeight, setToolbarHeight] = useState(0); // Will be detected or estimated

  // Try to get actual PDF dimensions from iframe
  useEffect(() => {
    const checkDimensions = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          // Try to access PDF.js if available
          const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
          const pdfViewer = iframeDoc?.querySelector('[data-page-number]');
          if (pdfViewer) {
            const rect = pdfViewer.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              // Get unscaled dimensions
              const unscaledWidth = rect.width / scale;
              const unscaledHeight = rect.height / scale;
              if (unscaledWidth > 0 && unscaledHeight > 0) {
                setDimensions({ width: unscaledWidth, height: unscaledHeight });
              }
            }
          }
        } catch (e) {
          // Cross-origin or other error, use defaults
        }
      }
    };
    
    const timer = setTimeout(checkDimensions, 1000);
    return () => clearTimeout(timer);
  }, [file, scale]);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth - 32;
      const newScale = Math.min(containerWidth / dimensions.width, 1);
      setScale(newScale);

      // Use actual PDF dimensions (A4 = 595x842 points)
      const actualPdfWidth = 595;
      const actualPdfHeight = 842;
      
      onViewportChange({
        width: containerWidth,
        height: actualPdfHeight * newScale,
        scale: newScale,
        pdfWidth: actualPdfWidth,
        pdfHeight: actualPdfHeight,
      });
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [dimensions, onViewportChange]);

  const handleDrop = (e: React.DragEvent) => {
    if (onDrop && overlayRef.current) {
      // Use overlay's exact bounding rect - it should be perfectly aligned with PDF
      const overlayRect = overlayRef.current.getBoundingClientRect();
      
      // Pass the exact overlay rect - no adjustments needed
      // The overlay is positioned absolutely at (0,0) relative to its container
      // and matches the iframe dimensions exactly
      console.log("EXACT Drop Position Calculation:", {
        mouseClientX: e.clientX.toFixed(4),
        mouseClientY: e.clientY.toFixed(4),
        overlayRect: {
          left: overlayRect.left.toFixed(4),
          top: overlayRect.top.toFixed(4),
          width: overlayRect.width.toFixed(4),
          height: overlayRect.height.toFixed(4),
          right: overlayRect.right.toFixed(4),
          bottom: overlayRect.bottom.toFixed(4),
        },
        relativeX: (e.clientX - overlayRect.left).toFixed(4),
        relativeY: (e.clientY - overlayRect.top).toFixed(4),
      });
      
      onDrop(e, overlayRect);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex justify-center items-start p-4 overflow-auto bg-gray-100"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="relative" style={{ position: "relative", display: "inline-block", margin: 0, padding: 0 }}>
        <iframe
          ref={iframeRef}
          src={file}
          className="shadow-lg"
          style={{
            width: `${dimensions.width * scale}px`,
            height: `${dimensions.height * scale}px`,
            border: "none",
            display: "block",
            margin: 0,
            padding: 0,
            verticalAlign: "top",
            position: "relative",
            lineHeight: 0, // Remove any line-height spacing
          }}
          // Add a data attribute to help identify the iframe
          data-pdf-viewer="true"
          onLoad={() => {
            // Update dimensions after iframe loads
            setTimeout(() => {
              if (iframeRef.current && overlayRef.current) {
                const iframeRect = iframeRef.current.getBoundingClientRect();
                const overlayRect = overlayRef.current.getBoundingClientRect();
                
                // Try to detect PDF viewer toolbar height
                // Browser PDF viewers typically add a toolbar at the top
                try {
                  const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
                  if (iframeDoc) {
                    // Look for PDF viewer toolbar or content area
                    const pdfViewer = iframeDoc.querySelector('embed') || iframeDoc.querySelector('object');
                    const body = iframeDoc.body;
                    
                    if (body) {
                      // Check if there's a toolbar by looking at body padding/margin
                      const bodyStyle = window.getComputedStyle(body);
                      const bodyPaddingTop = parseFloat(bodyStyle.paddingTop) || 0;
                      
                      // Check for PDF.js viewer toolbar or browser PDF viewer toolbar
                      const toolbar = iframeDoc.querySelector('#toolbar') || 
                                     iframeDoc.querySelector('.toolbar') ||
                                     iframeDoc.querySelector('embed')?.parentElement;
                      
                      let detectedToolbarHeight = 0;
                      if (toolbar) {
                        const toolbarRect = toolbar.getBoundingClientRect();
                        detectedToolbarHeight = toolbarRect.height;
                      }
                      
                      // Browser PDF viewers (Chrome, Edge) typically add ~40-50px toolbar
                      // If we can't detect it, estimate by comparing iframe vs expected PDF height
                      let finalToolbarHeight = detectedToolbarHeight;
                      
                      if (finalToolbarHeight === 0) {
                        // Estimate: Browser PDF viewers add toolbar, making iframe taller than PDF
                        const expectedPdfHeight = dimensions.height * scale;
                        const heightDifference = iframeRect.height - expectedPdfHeight;
                        
                        // If difference is reasonable (30-100px), it's likely the toolbar
                        if (heightDifference > 30 && heightDifference < 100) {
                          finalToolbarHeight = heightDifference;
                          console.log("Estimated toolbar height from iframe size:", finalToolbarHeight.toFixed(2));
                        } else {
                          // Use common browser PDF viewer toolbar height as fallback
                          // Chrome/Edge typically use ~40-50px, but varies
                          finalToolbarHeight = 0; // Keep at 0 for now, will adjust if needed
                        }
                      }
                      
                      setToolbarHeight(finalToolbarHeight);
                      
                      console.log("PDF Viewer Toolbar Detection:", {
                        bodyPaddingTop: bodyPaddingTop.toFixed(2),
                        detectedToolbarHeight: detectedToolbarHeight.toFixed(2),
                        estimatedFromIframe: (iframeRect.height - dimensions.height * scale).toFixed(2),
                        finalToolbarHeight: finalToolbarHeight.toFixed(2),
                        iframeHeight: iframeRect.height.toFixed(2),
                        expectedPdfHeight: (dimensions.height * scale).toFixed(2),
                        overlayHeight: overlayRect.height.toFixed(2),
                        note: finalToolbarHeight > 0 ? "Toolbar detected - overlay adjusted" : "No toolbar detected - overlay at top:0"
                      });
                    }
                  }
                } catch (e) {
                  // Cross-origin restriction - can't access iframe content
                  console.log("Cannot access iframe content (cross-origin), using default alignment");
                }
                
                // Log alignment check
                const diff = {
                  left: iframeRect.left - overlayRect.left,
                  top: iframeRect.top - overlayRect.top,
                  width: iframeRect.width - overlayRect.width,
                  height: iframeRect.height - overlayRect.height
                };
                console.log("Alignment check:", {
                  iframe: { 
                    left: iframeRect.left.toFixed(2), 
                    top: iframeRect.top.toFixed(2), 
                    width: iframeRect.width.toFixed(2), 
                    height: iframeRect.height.toFixed(2),
                  },
                  overlay: { 
                    left: overlayRect.left.toFixed(2), 
                    top: overlayRect.top.toFixed(2), 
                    width: overlayRect.width.toFixed(2), 
                    height: overlayRect.height.toFixed(2),
                  },
                  diff: diff,
                  isAligned: Math.abs(diff.left) < 1 && Math.abs(diff.top) < 1 && Math.abs(diff.width) < 1 && Math.abs(diff.height) < 1
                });
                
                // Auto-detect toolbar height: Browser PDF viewers add toolbar, making iframe taller than PDF
                if (iframeRect.width > 0 && iframeRect.height > 0 && scale > 0) {
                  const expectedPdfHeight = dimensions.height * scale;
                  const heightDiff = iframeRect.height - expectedPdfHeight;
                  
                  // If iframe is 30-100px taller than PDF, it's likely the toolbar
                  if (heightDiff > 30 && heightDiff < 100) {
                    if (toolbarHeight === 0 || Math.abs(toolbarHeight - heightDiff) > 5) {
                      console.log("Auto-detected toolbar height:", heightDiff.toFixed(2), "px");
                      setToolbarHeight(heightDiff);
                    }
                  } else if (heightDiff < 5 && toolbarHeight > 0) {
                    // If height difference is small, toolbar might not exist or already accounted for
                    console.log("No significant toolbar detected, height diff:", heightDiff.toFixed(2));
                  }
                  
                  const unscaledWidth = iframeRect.width / scale;
                  const unscaledHeight = iframeRect.height / scale;
                  if (Math.abs(unscaledWidth - dimensions.width) > 1 || Math.abs(unscaledHeight - dimensions.height) > 1) {
                    setDimensions({ width: unscaledWidth, height: unscaledHeight });
                  }
                }
              }
            }, 1000); // Increased timeout to ensure PDF viewer is fully loaded
          }}
        />
        {children && (
          <div
            ref={overlayRef}
            className="absolute pointer-events-none"
            style={{
              // CRITICAL FIX: Overlay must match PDF content area, not iframe top
              // Browser PDF viewers add toolbar (~40-50px) that pushes PDF content down
              // Since signature works perfectly at bottom, Y conversion is correct
              // The issue: overlay at top:0 aligns with iframe top, but PDF content starts below toolbar
              // Solution: Offset overlay down by toolbar height to match PDF content start
              // If toolbar not detected, use 0 (auto-detected from iframe height difference)
              top: `${toolbarHeight}px`, // Offset to match PDF content area (below toolbar)
              left: 0,
              width: `${dimensions.width * scale}px`,
              height: `${dimensions.height * scale}px`,
              margin: 0,
              padding: 0,
              boxSizing: "border-box",
              transform: "translate(0, 0)",
              lineHeight: 0, // Match iframe line-height
            }}
          >
            <div 
              className="relative w-full h-full pointer-events-auto" 
              style={{ 
                margin: 0, 
                padding: 0, 
                boxSizing: "border-box",
                width: "100%",
                height: "100%",
              }}
            >
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

