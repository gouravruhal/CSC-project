import React from 'react';
import AdminCommunityManager from '../components/AdminCommunityManager';
import { AdminUser, Language } from '../../types';

interface AdminCommunityPageProps {
  adminUser: AdminUser;
  adminToken: string;
  onLogout?: () => void;
  language?: Language;
}

export const AdminCommunityPage: React.FC<AdminCommunityPageProps> = ({
  adminToken,
}) => {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--bg-primary)] text-[var(--color-text)] p-3 sm:p-6 transition-colors font-sans animate-in fade-in duration-150">
      <div className="max-w-7xl mx-auto">
        <AdminCommunityManager adminToken={adminToken} />
      </div>
    </div>
  );
};

export default AdminCommunityPage;
