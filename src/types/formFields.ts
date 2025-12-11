/**
 * Form Field Types
 */

export type FieldType = "text" | "signature" | "image" | "date" | "radio";

export interface FormField {
  id: string;
  type: FieldType;
  x: number; // PDF points from left
  y: number; // PDF points from bottom
  width: number; // PDF points
  height: number; // PDF points
  value?: string;
  label?: string;
  options?: string[]; // For radio buttons
  imageData?: string; // Base64 for images
  signatureData?: string; // Base64 for signatures
}

export interface FormFieldState extends FormField {
  cssX: number; // CSS pixels from left
  cssY: number; // CSS pixels from top
  cssWidth: number; // CSS pixels
  cssHeight: number; // CSS pixels
}







