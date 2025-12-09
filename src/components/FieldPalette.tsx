"use client";

import type { FieldType } from "@/types/formFields";

interface FieldPaletteProps {
  onFieldSelect: (type: FieldType) => void;
}

const fieldTypes: { type: FieldType; label: string; icon: string }[] = [
  { type: "text", label: "Text Box", icon: "📝" },
  { type: "signature", label: "Signature", icon: "✍️" },
  { type: "image", label: "Image", icon: "🖼️" },
  { type: "date", label: "Date", icon: "📅" },
  { type: "radio", label: "Radio", icon: "🔘" },
];

export default function FieldPalette({ onFieldSelect }: FieldPaletteProps) {
  return (
    <div className="bg-white border-r border-gray-200 p-4 w-48">
      <h3 className="text-sm font-semibold mb-4 text-gray-700">
        Form Fields
      </h3>
      <div className="space-y-2">
        {fieldTypes.map((field) => (
          <button
            key={field.type}
            onClick={() => onFieldSelect(field.type)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 hover:border-blue-500 transition-colors"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("fieldType", field.type);
            }}
          >
            <span>{field.icon}</span>
            <span>{field.label}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-4">
        Drag and drop fields onto the PDF
      </p>
    </div>
  );
}




