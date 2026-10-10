import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  ExternalLink, 
  Menu, 
  X,
  LogOut
} from 'lucide-react';
import { Language, AdminTab } from '../../types';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  isAdminLoggedIn: boolean;
  onOpenAdminModal: () => void;
  onLogout?: () => void;
  adminTab?: AdminTab;
  onSelectAdminTab?: (tab: AdminTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  darkMode,
  setDarkMode,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdminView = currentView.startsWith('admin-') && currentView !== 'admin-login';

  const handleNavClick = (view: string) => {
    if (isAdminView) {
      if (view === 'home') {
        setCurrentView('home');
      } else if (view === 'dashboard') {
        setCurrentView('admin-dashboard');
      } else if (view === 'community') {
        setCurrentView('admin-community');
      } else if (view === 'website-content') {
        setCurrentView('admin-content');
      }
      setMobileMenuOpen(false);
      return;
    }
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const navItems = isAdminView ? [
    { id: 'dashboard', label: 'Document Queue' },
    { id: 'community', label: 'Community' },
    { id: 'website-content', label: 'Website Content' },
  ] : [
    { id: 'home', label: 'Home' },
    { id: 'upload', label: 'Upload Document' },
    { id: 'community', label: 'Community' },
    { id: 'services', label: 'Services' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full max-w-full overflow-x-hidden bg-[var(--bg-card)] backdrop-blur-md border-b border-[var(--color-border)] transition-colors duration-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo + "MAA VAISHNO e-WORLD" */}
        <div 
          onClick={() => handleNavClick('home')} 
          className="flex items-center space-x-3 cursor-pointer group select-none shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] p-1 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-200">
            <img 
              src="/logo.png" 
              alt="Maa Vaishno e-World CSC Centre Logo" 
              className="h-8 w-auto object-contain shrink-0"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base sm:text-lg lg:text-xl tracking-tight text-[var(--color-text)] uppercase font-sans leading-none">
              MAA VAISHNO e-WORLD
            </span>
            <span className="text-[10px] font-bold text-[var(--color-muted-text)] tracking-wider uppercase mt-0.5">
              CSC • Rairkalan, Panipat
            </span>
          </div>
        </div>

        {/* Center Navigation Links (Laptop / Desktop) */}
        <nav className="hidden md:flex items-center space-x-1.5 lg:space-x-3 text-sm font-semibold">
          {navItems.map((item) => {
            const isActive = isAdminView
              ? (currentView === 'admin-dashboard' && item.id === 'dashboard') ||
                (currentView === 'admin-community' && item.id === 'community') ||
                (currentView === 'admin-content' && item.id === 'website-content')
              : currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-2 rounded-xl transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent-soft)] text-[var(--color-text)] font-extrabold border border-[var(--color-border)] shadow-2xs'
                    : 'text-[var(--color-muted-text)] hover:text-[var(--color-text)] hover:bg-[var(--bg-primary)]'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          {/* Atal Portal or Public Portal Link */}
          {isAdminView ? (
            <button
              onClick={() => setCurrentView('home')}
              className="px-3.5 py-2 rounded-xl text-[var(--color-muted-text)] hover:text-[var(--color-text)] hover:bg-[var(--bg-primary)] transition-all duration-150 inline-flex items-center space-x-1.5 font-semibold cursor-pointer text-xs"
              title="Return to public portal"
            >
              <span>View Public Site</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </button>
          ) : (
            <a
              href="https://csc.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-[var(--color-muted-text)] hover:text-[var(--color-text)] hover:bg-[var(--bg-primary)] transition-all duration-150 inline-flex items-center space-x-1.5 font-semibold cursor-pointer"
            >
              <span>Atal Portal</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          )}
        </nav>

        {/* Rightmost Side: Admin Logout & Theme Toggle Button */}
        <div className="hidden md:flex items-center space-x-2">
          {isAdminView && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Log out of Operator Panel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] text-xs font-extrabold text-[var(--color-text)] hover:border-[var(--color-border-hover)] transition-all cursor-pointer shadow-2xs"
            title="Toggle Light or Dark Theme"
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[var(--color-muted-text)]" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile Screen Controls */}
        <div className="flex md:hidden items-center space-x-2">
          {/* Quick Theme Toggle for Mobile */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] text-[var(--color-text)]"
            title="Toggle Light or Dark Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-[var(--accent-primary)]" /> : <Moon className="w-4 h-4 text-[var(--color-muted-text)]" />}
          </button>

          {/* Hamburger Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] text-[var(--color-text)]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
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
                onClick={() => handleNavClick(item.id)}
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
                onClick={() => {
                  setCurrentView('home');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2.5 px-4 rounded-xl text-[var(--color-text)] hover:bg-[var(--bg-primary)] flex items-center justify-between"
              >
                <span>View Public Site</span>
                <ExternalLink className="w-4 h-4 opacity-70" />
              </button>
              {onLogout && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
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
      )}
    </header>
  );
};

export default Navbar;
