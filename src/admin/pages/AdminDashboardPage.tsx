import React from 'react';
import { AdminDashboard } from '../components/AdminDashboard';
import { AdminUser, Language, AdminTab } from '../../types';

interface AdminDashboardPageProps {
  adminUser: AdminUser;
  adminToken: string;
  onLogout: () => void;
  onBackToHome?: () => void;
  onNavigateAdminPage?: (page: string) => void;
  activeAdminTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
  language?: Language;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  adminUser,
  adminToken,
  onLogout,
  onBackToHome,
  onNavigateAdminPage,
  activeAdminTab = 'dashboard',
  onTabChange,
}) => {
  return (
    <div className="py-2 animate-in fade-in duration-150">
      <AdminDashboard
        adminUser={adminUser}
        adminToken={adminToken}
        onLogout={onLogout}
        onBackToHome={onBackToHome}
        activeAdminTab={activeAdminTab}
        onTabChange={(tab) => {
          if (onNavigateAdminPage) onNavigateAdminPage(tab);
          if (onTabChange) onTabChange(tab);
        }}
      />
    </div>
  );
};

export default AdminDashboardPage;
