import React from 'react';
import { OperatorWorkspace } from '../components/OperatorWorkspace';
import { Language } from '../../types';

interface AdminWorkspacePageProps {
  submissionId: string;
  adminToken: string;
  onBackToDashboard: () => void;
  language: Language;
}

export const AdminWorkspacePage: React.FC<AdminWorkspacePageProps> = ({
  submissionId,
  adminToken,
  onBackToDashboard,
  language,
}) => {
  return (
    <OperatorWorkspace
      submissionId={submissionId}
      adminToken={adminToken}
      onBack={onBackToDashboard}
      language={language}
    />
  );
};

export default AdminWorkspacePage;
