import { useState, useEffect } from 'react';
import { Submission } from '../../../../types';
import { generateInitialSpreadsheetData, calculateGridStats, exportGridToCsv } from './spreadsheetHelper';
import { downloadFile } from '../../../../lib/pdfSuite/pdfDownload';

export function useSpreadsheetStudioState(
  submission: Submission | null,
  activeFileName?: string,
  showToast?: (msg: string) => void
) {
  const [data, setData] = useState<Record<string, string>>({});
  const [activeCell, setActiveCell] = useState('A1');
  const [rowCount, setRowCount] = useState(14);

  useEffect(() => {
    setData(generateInitialSpreadsheetData(submission));
  }, [submission?.id]);

  const formulaValue = data[activeCell] || '';
  const stats = calculateGridStats(data);

  const handleChangeCell = (cellKey: string, val: string) => {
    setData((prev) => ({ ...prev, [cellKey]: val }));
  };

  const handleChangeFormula = (val: string) => {
    setData((prev) => ({ ...prev, [activeCell]: val }));
  };

  const handleAddRow = () => {
    setRowCount((r) => r + 1);
    if (showToast) showToast('Row appended to worksheet!');
  };

  const handleExportCsv = () => {
    try {
      const csv = exportGridToCsv(data, rowCount);
      const bytes = new TextEncoder().encode(csv);
      const name = `${activeFileName || 'Worksheet'}_Export.csv`;
      downloadFile(bytes, name, 'text/csv');
      if (showToast) showToast('Exported spreadsheet to CSV successfully!');
    } catch (e: any) {
      if (showToast) showToast('CSV Export error: ' + (e.message || 'Failed'));
    }
  };

  const handlePrint = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    const csv = exportGridToCsv(data, rowCount);
    const rows = csv.split('\n').map((r) => r.split(','));
    const tableHtml = `
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:12px;">
        ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell.replace(/^"|"$/g, '')}</td>`).join('')}</tr>`).join('')}
      </table>
    `;

    printWin.document.write(`
      <html>
        <head>
          <title>${activeFileName || 'Spreadsheet'}</title>
          <style>@page { size: A4 landscape; margin: 15mm; }</style>
        </head>
        <body>
          <h3 style="font-family:Arial,sans-serif;margin-bottom:10px;">${activeFileName || 'Worksheet'}</h3>
          ${tableHtml}
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    printWin.print();
    printWin.close();
  };

  return {
    data,
    activeCell,
    setActiveCell,
    formulaValue,
    rowCount,
    stats,
    handleChangeCell,
    handleChangeFormula,
    handleAddRow,
    handleExportCsv,
    handlePrint,
  };
}
