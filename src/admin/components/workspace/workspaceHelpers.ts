export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const getDocumentType = (file: { original_name?: string; mime_type?: string }): string => {
  const mime = (file.mime_type || '').toLowerCase();
  const ext = (file.original_name || '').split('.').pop()?.toUpperCase() || '';

  if (mime.includes('pdf') || ext === 'PDF') return 'PDF Document';
  if (mime.includes('jpeg') || mime.includes('jpg') || ext === 'JPG' || ext === 'JPEG') return 'JPG Image';
  if (mime.includes('png') || ext === 'PNG') return 'PNG Image';
  if (mime.includes('webp') || ext === 'WEBP') return 'WebP Image';
  if (mime.startsWith('image/')) return 'Image File';
  if (ext) return `${ext} Document`;
  return 'Document';
};

export const isImageFile = (file: { original_name?: string; mime_type?: string }): boolean => {
  const mime = (file.mime_type || '').toLowerCase();
  const ext = (file.original_name || '').split('.').pop()?.toLowerCase() || '';
  return (
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'].includes(ext)
  );
};

export const isPdfFile = (file: { original_name?: string; mime_type?: string }): boolean => {
  const mime = (file.mime_type || '').toLowerCase();
  const ext = (file.original_name || '').split('.').pop()?.toLowerCase() || '';
  return mime.includes('pdf') || ext === 'pdf';
};

export const isDocFile = (file: { original_name?: string; mime_type?: string }): boolean => {
  const mime = (file.mime_type || '').toLowerCase();
  const ext = (file.original_name || '').split('.').pop()?.toLowerCase() || '';
  return (
    mime.includes('word') ||
    mime.includes('officedocument.wordprocessingml') ||
    ['doc', 'docx', 'rtf', 'odt', 'txt'].includes(ext)
  );
};

export const isSpreadsheetFile = (file: { original_name?: string; mime_type?: string }): boolean => {
  const mime = (file.mime_type || '').toLowerCase();
  const ext = (file.original_name || '').split('.').pop()?.toLowerCase() || '';
  return (
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime.includes('csv') ||
    ['xls', 'xlsx', 'csv', 'tsv', 'ods'].includes(ext)
  );
};

export type DocumentCategory = 'image' | 'pdf' | 'word' | 'spreadsheet' | 'generic';

export const getDocumentCategory = (file: { original_name?: string; mime_type?: string }): DocumentCategory => {
  if (isImageFile(file)) return 'image';
  if (isPdfFile(file)) return 'pdf';
  if (isDocFile(file)) return 'word';
  if (isSpreadsheetFile(file)) return 'spreadsheet';
  return 'generic';
};
