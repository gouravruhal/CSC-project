import React from 'react';
import { SuccessView } from './SuccessView';
import { Language } from '../../types';

interface SuccessPageProps {
  language: Language;
  submission: any;
  onNewSubmission: () => void;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({
  language,
  submission,
  onNewSubmission,
}) => {
  return (
    <div className="py-8 w-full max-w-full overflow-x-hidden">
      <SuccessView
        language={language}
        submission={submission}
        onNewSubmission={onNewSubmission}
      />
    </div>
  );
};

export default SuccessPage;
