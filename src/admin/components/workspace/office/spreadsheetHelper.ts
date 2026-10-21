import { Submission } from '../../../../types';

export interface SpreadsheetCell {
  row: number;
  col: number;
  value: string;
}

export const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export const generateInitialSpreadsheetData = (submission?: Submission | null): Record<string, string> => {
  const name = submission?.name || (submission as any)?.customer_name || 'Citizen Customer';
  const service = submission?.purpose || (submission as any)?.service_type || 'Aadhaar / Certificate Service';
  const phone = submission?.phone || '+91 9876543210';
  const ref = submission?.id ? `ASK-${submission.id.slice(0, 8).toUpperCase()}` : 'ASK-REF-001';

  return {
    'A1': 'ATAL SEVA KENDRA - CITIZEN LEDGER & SERVICE SHEET',
    'A3': 'Reference ID', 'B3': ref, 'C3': 'Status', 'D3': 'VERIFIED',
    'A4': 'Citizen Name', 'B4': name, 'C4': 'Contact', 'D4': phone,
    'A6': 'Item No', 'B6': 'Service Description', 'C6': 'Govt Fee (₹)', 'D6': 'Operator Fee (₹)', 'E6': 'Total (₹)',
    'A7': '1', 'B7': service, 'C7': '50', 'D7': '30', 'E7': '80',
    'A8': '2', 'B8': 'Document Scanning & Upload', 'C8': '20', 'D8': '20', 'E8': '40',
    'A9': '3', 'B9': 'Lamination & Color Printout', 'C9': '30', 'D9': '20', 'E9': '50',
    'A10': '4', 'B10': 'Attestation & Verification', 'C10': '0', 'D10': '30', 'E10': '30',
    'B11': 'TOTAL AMOUNT (₹)', 'E11': '200',
  };
};

export const calculateGridStats = (data: Record<string, string>) => {
  const values = Object.values(data).filter(v => v !== undefined && v !== '');
  const numericValues = values
    .map(v => parseFloat(v.replace(/[^0-9.-]+/g, '')))
    .filter(n => !isNaN(n));

  const count = numericValues.length;
  const sum = numericValues.reduce((a, b) => a + b, 0);
  const avg = count > 0 ? (sum / count) : 0;
  const max = count > 0 ? Math.max(...numericValues) : 0;
  const min = count > 0 ? Math.min(...numericValues) : 0;

  return { totalCells: values.length, count, sum, avg, min, max };
};

export const exportGridToCsv = (data: Record<string, string>, rows = 15, cols = COLUMNS): string => {
  const csvLines: string[] = [];
  for (let r = 1; r <= rows; r++) {
    const rowValues = cols.map(c => {
      const val = data[`${c}${r}`] || '';
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvLines.push(rowValues.join(','));
  }
  return csvLines.join('\n');
};
