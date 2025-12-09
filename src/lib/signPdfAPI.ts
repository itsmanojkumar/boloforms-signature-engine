/**
 * Backend API Client for PDF Signing
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SignPdfRequest {
  pdfId: string;
  signatureImage: string; // Base64 data URL
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  pdfBytes?: string; // Base64 encoded PDF bytes (optional)
}

export interface AuditTrail {
  originalHash: string; // SHA-256 hash of original PDF
  signedHash: string;   // SHA-256 hash of signed PDF
}

export interface SignPdfResponse {
  success: boolean;
  pdfId: string;
  signedPdfUrl: string;
  auditTrail: AuditTrail;
  message: string;
}

export interface VerifyPdfResponse {
  pdfId: string;
  verifyType: 'original' | 'signed';
  integrityValid: boolean;
  storedHash: string;
  currentHash: string;
  message: string;
}

/**
 * Sign a PDF with a signature image
 * 
 * @param pdfId - Unique identifier for the PDF
 * @param signatureImage - Base64 encoded signature image (data URL)
 * @param coordinates - PDF coordinates in points (bottom-left origin)
 * @param pdfBytes - Optional: PDF file as Uint8Array (will be converted to base64)
 * @returns Signed PDF URL
 */
export async function signPdf(
  pdfId: string,
  signatureImage: string,
  coordinates: { x: number; y: number; width: number; height: number },
  pdfBytes?: Uint8Array
): Promise<SignPdfResponse> {
  try {
    // Convert Uint8Array to base64 if provided
    let pdfBytesBase64: string | undefined;
    if (pdfBytes) {
      const binary = Array.from(pdfBytes)
        .map(byte => String.fromCharCode(byte))
        .join('');
      pdfBytesBase64 = btoa(binary);
    }

    const response = await fetch(`${API_BASE_URL}/sign-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfId,
        signatureImage,
        coordinates,
        pdfBytes: pdfBytesBase64,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}: Failed to sign PDF`);
    }

    const result: SignPdfResponse = await response.json();
    return result;
  } catch (error) {
    console.error('[Sign PDF API] Error:', error);
    throw error;
  }
}

/**
 * Get signed PDF URL by PDF ID
 */
export async function getSignedPdfUrl(pdfId: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/pdf/${pdfId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to retrieve PDF: ${response.status}`);
    }

    const data = await response.json();
    return `${API_BASE_URL}${data.signedPdfUrl}`;
  } catch (error) {
    console.error('[Get PDF URL] Error:', error);
    throw error;
  }
}

/**
 * Verify PDF integrity
 * 
 * @param pdfId - PDF identifier
 * @param verifyType - 'original' or 'signed' (default: 'signed')
 * @returns Verification result with hash comparison
 */
export async function verifyPdf(
  pdfId: string,
  verifyType: 'original' | 'signed' = 'signed'
): Promise<VerifyPdfResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/verify-pdf/${pdfId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ verifyType }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to verify PDF: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Verify PDF] Error:', error);
    throw error;
  }
}

/**
 * Health check
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

