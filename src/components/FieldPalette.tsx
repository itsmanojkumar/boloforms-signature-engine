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
    <div className="bg-white border-b md:border-b-0 md:border-r border-gray-200 p-4 w-full md:w-48 flex flex-row md:flex-col gap-4 md:gap-2 overflow-x-auto md:overflow-visible shrink-0 items-center md:items-stretch shadow-sm md:shadow-none z-10">
      <h3 className="text-sm font-semibold text-gray-700 hidden md:block mb-4">
        Form Fields
      </h3>
      <div className="flex md:flex-col gap-2 w-full md:w-auto">
        {fieldTypes.map((field) => (
          <button
            key={field.type}
            onClick={() => onFieldSelect(field.type)}
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 hover:border-blue-500 transition-colors bg-white whitespace-nowrap"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("fieldType", field.type);
            }}
          >
            <span>{field.icon}</span>
            <span className="hidden md:inline">{field.label}</span>
            <span className="md:hidden">{field.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-4 hidden md:block">
        Drag and drop fields onto the PDF
      </p>
    </div>
  );
}
