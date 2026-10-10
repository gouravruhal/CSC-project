import React from 'react';
import { AdminWebsiteContentManager } from '../components/AdminWebsiteContentManager';
import { AdminUser, Language } from '../../types';

interface AdminWebsiteContentPageProps {
  adminUser: AdminUser;
  adminToken: string;
  onLogout?: () => void;
  language?: Language;
}

export const AdminWebsiteContentPage: React.FC<AdminWebsiteContentPageProps> = ({
  adminToken,
}) => {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--bg-primary)] text-[var(--color-text)] p-3 sm:p-6 transition-colors font-sans animate-in fade-in duration-150">
      <div className="max-w-7xl mx-auto">
        <AdminWebsiteContentManager adminToken={adminToken} />
      </div>
    </div>
  );
};

export default AdminWebsiteContentPage;
