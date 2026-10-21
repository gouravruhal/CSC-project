import React from 'react';
import { ExternalLink, LogOut } from 'lucide-react';

interface NavMobileDrawerProps {
  isOpen: boolean;
  navItems: Array<{ id: string; label: string }>;
  isAdminView: boolean;
  currentView: string;
  onNavClick: (view: string) => void;
  onLogout?: () => void;
}

export const NavMobileDrawer: React.FC<NavMobileDrawerProps> = ({
  isOpen,
  navItems,
  isAdminView,
  currentView,
  onNavClick,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--bg-card)] px-4 py-4 space-y-2 animate-in slide-in-from-top-4 duration-150 text-sm font-semibold shadow-lg">
      {navItems.map((item) => {
        const isActive = isAdminView
          ? (currentView === 'admin-dashboard' && item.id === 'dashboard') ||
            (currentView === 'admin-community' && item.id === 'community') ||
            (currentView === 'admin-content' && item.id === 'website-content')
          : currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavClick(item.id)}
            className={`w-full text-left py-2.5 px-4 rounded-xl transition-all ${
              isActive
                ? 'bg-[var(--accent-soft)] text-[var(--color-text)] font-extrabold border border-[var(--color-border)]'
                : 'text-[var(--color-text)] hover:bg-[var(--bg-primary)]'
            }`}
          >
            {item.label}
          </button>
        );
      })}

      {isAdminView ? (
        <>
          <button
            onClick={() => onNavClick('home')}
            className="w-full text-left py-2.5 px-4 rounded-xl text-[var(--color-text)] hover:bg-[var(--bg-primary)] flex items-center justify-between"
          >
            <span>View Public Site</span>
            <ExternalLink className="w-4 h-4 opacity-70" />
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full text-left py-2.5 px-4 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-between font-bold"
            >
              <span>Logout</span>
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </>
      ) : (
        <a
          href="https://csc.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full text-left py-2.5 px-4 rounded-xl text-[var(--color-text)] hover:bg-[var(--bg-primary)] flex items-center justify-between"
        >
          <span>Atal Portal</span>
          <ExternalLink className="w-4 h-4 opacity-70" />
        </a>
      )}
    </div>
  );
};
