import React from 'react';
import { UploadDocumentSection } from './UploadDocumentSection';
import { Language } from '../../types';

interface UploadPageProps {
  language: Language;
  preselectedPurpose?: string;
  onSuccess: (data: any) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({
  language,
  preselectedPurpose,
  onSuccess,
}) => {
  return (
    <div className="py-8 w-full max-w-full overflow-x-hidden">
      <UploadDocumentSection
        language={language}
        preselectedPurpose={preselectedPurpose}
        onSuccess={onSuccess}
      />
    </div>
  );
};

export default UploadPage;
