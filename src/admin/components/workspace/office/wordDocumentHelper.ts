import { Submission } from '../../../../types';

export interface WordDocFormatting {
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'left' | 'center' | 'right' | 'justify';
  margins: 'normal' | 'narrow' | 'wide';
  orientation: 'portrait' | 'landscape';
  lineSpacing: number;
}

export const defaultFormatting: WordDocFormatting = {
  fontFamily: 'Calibri, sans-serif',
  fontSize: 14,
  bold: false,
  italic: false,
  underline: false,
  align: 'left',
  margins: 'normal',
  orientation: 'portrait',
  lineSpacing: 1.5,
};

export const calculateDocStats = (text: string) => {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s+/g, '').length;
  const readingTimeMin = Math.max(1, Math.ceil(words / 200));
  return { words, characters, charactersNoSpaces, readingTimeMin };
};

export const generateSampleDocContent = (submission?: Submission | null, fileName?: string): string => {
  const name = submission?.name || (submission as any)?.customer_name || 'Citizen Customer';
  const service = submission?.purpose || (submission as any)?.service_type || 'Public Document Verification';
  const ref = submission?.id ? `ASK-${submission.id.slice(0, 8).toUpperCase()}` : 'ASK-REF-2026';
  const phone = submission?.phone || '+91 98765 43210';
  const date = submission?.created_at ? new Date(submission.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '21 October 2026';

  return `ATAL SEVA KENDRA - OFFICIAL CITIZEN SERVICE RECORD
Reference ID: ${ref}
Date: ${date}

Document File: ${fileName || 'Customer_Submission_File.docx'}
Applicant / Citizen Name: ${name}
Contact Number: ${phone}
Service Requested: ${service}
Verification Status: Official Record Active

--------------------------------------------------------------------------------
SUBJECT: ACKNOWLEDGEMENT AND VERIFICATION OF APPLICATION DOCUMENTS

1. CITIZEN PARTICULARS
This official record certifies that the citizen named above has registered an application under the Citizen Service Portal for ${service}. All documents submitted electronically through the portal have been verified for completeness, resolution, and legibility.

2. SUBMITTED CREDENTIALS
The supporting records attached to this application file have been processed through the Operator Verification Suite. Signatures, photographic identity proofs, and biometric reference attributes match the standard regulatory requirements.

3. OPERATOR NOTES & PROCESSING REMARKS
- Document resolution verified: Pass (Meets Department standard DPI specifications)
- Citizen identity authenticated: Verified against central database
- Status: Ready for final processing, certificate issuance, and archiving

Authority Seal / Operator Signature:
Atal Seva Kendra Documentation Officer
Digital Record ID: ${ref} | CSC Haryana Portal`;
};
