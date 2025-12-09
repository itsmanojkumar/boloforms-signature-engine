"use client";

import { useState, useRef, useEffect } from "react";
import type { FormFieldState } from "@/types/formFields";
import SignaturePad from "signature_pad";

interface FormFieldProps {
  field: FormFieldState;
  onUpdate: (field: FormFieldState) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export default function FormField({
  field,
  onUpdate,
  onDelete,
  isSelected,
  onSelect,
}: FormFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const signaturePadRef = useRef<HTMLCanvasElement>(null);
  const signaturePadInstanceRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    if (field.type === "signature" && signaturePadRef.current) {
      const canvas = signaturePadRef.current;
      
      if (!canvas || typeof field.cssWidth !== "number" || typeof field.cssHeight !== "number") {
        return;
      }
      
      // Set canvas size to match container
      const width = Math.max(100, field.cssWidth);
      const height = Math.max(50, field.cssHeight - 40); // Account for button area
      
      canvas.width = width;
      canvas.height = height;
      
      if (!signaturePadInstanceRef.current) {
        try {
          signaturePadInstanceRef.current = new SignaturePad(canvas, {
            backgroundColor: "rgba(255, 255, 255, 0)",
            penColor: "rgb(0, 0, 0)",
          });
        } catch (error) {
          console.error("Error initializing SignaturePad:", error);
        }
      } else {
        // Resize existing signature pad
        try {
          signaturePadInstanceRef.current.clear();
        } catch (error) {
          console.error("Error clearing SignaturePad:", error);
        }
      }
    }
  }, [field.type, field.cssWidth, field.cssHeight]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(field.id);
    setIsDragging(true);
    setDragStart({
      x: e.clientX - field.cssX,
      y: e.clientY - field.cssY,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: field.cssWidth,
      height: field.cssHeight,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        onUpdate({
          ...field,
          cssX: Math.max(0, newX),
          cssY: Math.max(0, newY),
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        onUpdate({
          ...field,
          cssWidth: Math.max(50, resizeStart.width + deltaX),
          cssHeight: Math.max(30, resizeStart.height + deltaY),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, field, onUpdate]);

  const handleInputChange = (value: string) => {
    onUpdate({ ...field, value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onUpdate({
          ...field,
          imageData: event.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureSave = () => {
    if (signaturePadInstanceRef.current && !signaturePadInstanceRef.current.isEmpty()) {
      const dataURL = signaturePadInstanceRef.current.toDataURL("image/png");
      onUpdate({ ...field, signatureData: dataURL, value: "signed" });
    }
  };

  const handleSignatureClear = () => {
    signaturePadInstanceRef.current?.clear();
    onUpdate({ ...field, signatureData: undefined });
  };

  const renderFieldContent = () => {
    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            value={field.value || ""}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Enter text"
            className="w-full h-full px-2 py-1 border-none outline-none bg-transparent text-sm"
            onClick={(e) => e.stopPropagation()}
          />
        );
      case "date":
        return (
          <input
            type="date"
            value={field.value || ""}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full h-full px-2 py-1 border-none outline-none bg-transparent text-sm"
            onClick={(e) => e.stopPropagation()}
          />
        );
      case "radio":
        return (
          <div className="w-full h-full flex items-center px-2">
            <input
              type="radio"
              name={field.id}
              className="mr-2"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-sm">{field.label || "Option"}</span>
          </div>
        );
      case "image":
        return (
          <div className="w-full h-full flex items-center justify-center">
            {field.imageData ? (
              <img
                src={field.imageData}
                alt="Uploaded"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <label className="cursor-pointer text-xs text-gray-500 text-center px-2">
                Click to upload image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  onClick={(e) => e.stopPropagation()}
                />
              </label>
            )}
          </div>
        );
      case "signature":
        return (
          <div className="w-full h-full flex flex-col">
            <canvas
              ref={signaturePadRef}
              className="flex-1 border-none"
              style={{ touchAction: "none" }}
            />
            <div className="flex gap-2 p-1 bg-white">
              <button
                onClick={handleSignatureSave}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded"
              >
                Save
              </button>
              <button
                onClick={handleSignatureClear}
                className="px-2 py-1 text-xs bg-gray-500 text-white rounded"
              >
                Clear
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`absolute border-2 transition-all ${
        isSelected ? "border-blue-500 shadow-md bg-blue-50" : "border-gray-400 bg-white hover:border-blue-300"
      } cursor-move`}
      style={{
        left: `${field.cssX}px`,
        top: `${field.cssY}px`,
        width: `${field.cssWidth}px`,
        height: `${field.cssHeight}px`,
        minWidth: "50px",
        minHeight: "30px",
      }}
      onMouseDown={handleMouseDown}
      title={`PDF: (${field.x.toFixed(1)}, ${field.y.toFixed(1)}) CSS: (${field.cssX.toFixed(1)}, ${field.cssY.toFixed(1)})`}
    >
      {renderFieldContent()}
          {isSelected && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(field.id);
            }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 shadow"
          >
            ×
          </button>
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize hover:bg-blue-600 rounded-tl shadow-md transition-colors"
            onMouseDown={handleResizeMouseDown}
            title="Drag to resize"
          />
        </>
      )}
    </div>
  );
}

