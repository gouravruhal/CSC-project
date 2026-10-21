import React, { useState, useEffect } from 'react';
import { Navbar } from './public/common/Navbar';
import { Footer } from './public/common/Footer';
import { AdminLoginModal } from './admin/components/AdminLoginModal';

// Public Feature Pages (Modular Architecture)
import HomePage from './public/home/HomePage';
import AboutPage from './public/about/AboutPage';
import ServicesPage from './public/services/ServicesPage';
import FaqPage from './public/faq/FaqPage';
import ContactPage from './public/contact/ContactPage';
import UploadPage from './public/upload/UploadPage';
import SuccessPage from './public/success/SuccessPage';
import CommunityPage from './public/community/CommunityPage';

// Isolated Admin App Module Pages (Distinct Pages)
import AdminLoginPage from './admin/pages/AdminLoginPage';
import AdminDashboardPage from './admin/pages/AdminDashboardPage';
import AdminCommunityPage from './admin/pages/AdminCommunityPage';
import AdminWebsiteContentPage from './admin/pages/AdminWebsiteContentPage';
import AdminWorkspacePage from './admin/pages/AdminWorkspacePage';

import { Language, AdminUser } from './types';
import { notifyAuthChanged, subscribeToAuthChanges, validateAdminSession, handleSessionExpired } from './lib/apiCache';

// Helper to verify if genuine admin auth exists in storage
const checkHasAdminAuth = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const token = localStorage.getItem('atalseva_admin_token');
    const userStr = localStorage.getItem('atalseva_admin_user');
    if (!token || !userStr) return false;
    const user = JSON.parse(userStr);
    return !!(user && user.email && token.length > 10);
  } catch {
    return false;
  }
};

// Synchronous initial route resolver with Strict Auth Gate
const getInitialRoute = (): string => {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname;
  const hostname = window.location.hostname;
  const hasAuth = checkHasAdminAuth();

  // Admin Subdomain Routing
  if (hostname.startsWith('admin.')) {
    if (!hasAuth) {
      if (path === '/login') return 'admin-login';
      if (window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/');
      }
      return 'home'; // STRICT AUTH GATE: Unauthenticated kicked to home
    }
    if (path.startsWith('/workspace')) return 'admin-workspace';
    if (path === '/community') return 'admin-community';
    if (path === '/content' || path === '/website-content') return 'admin-content';
    if (path === '/login') {
      window.history.replaceState({}, '', '/admin/dashboard');
      return 'admin-dashboard';
    }
    return 'admin-dashboard';
  }

  // Exact Valid Public Routes
  if (path === '/' || path === '') return 'home';
  if (path === '/about') return 'about';
  if (path === '/services') return 'services';
  if (path === '/community') return 'community';
  if (path === '/faq') return 'faq';
  if (path === '/contact') return 'contact';
  if (path === '/upload') return 'upload';
  if (path === '/success') return 'success';

  // Explicit Admin Login Path
  if (path === '/admin/login') {
    if (hasAuth) {
      window.history.replaceState({}, '', '/admin/dashboard');
      return 'admin-dashboard';
    }
    return 'admin-login';
  }

  // STRICT AUTH GATE FOR ALL AUTHORIZED / ADMIN ROUTES:
  // If an unauthenticated user attempts to access ANY authorized route:
  // KICK TO HOME PAGE IMMEDIATELY AND RESET URL TO /
  if (path === '/admin' || path.startsWith('/admin/') || path === '/dashboard' || path.startsWith('/workspace')) {
    if (!hasAuth) {
      try {
        localStorage.removeItem('atalseva_admin_token');
        localStorage.removeItem('atalseva_admin_user');
      } catch {}
      if (window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/');
      }
      return 'home';
    }

    // Authenticated Admin Pages
    if (path === '/admin/community') return 'admin-community';
    if (path === '/admin/content' || path === '/admin/website-content') return 'admin-content';
    if (path.startsWith('/admin/workspace') || path.startsWith('/workspace')) return 'admin-workspace';
    if (path === '/admin/dashboard' || path === '/admin' || path === '/dashboard') return 'admin-dashboard';

    // Unknown admin sub-route
    if (window.location.pathname !== '/admin/dashboard') {
      window.history.replaceState({}, '', '/admin/dashboard');
    }
    return 'admin-dashboard';
  }

  // ANY WRONG / UNKNOWN PAGE -> NAVIGATE TO HOME PAGE & CLEAN UP URL TO /
  if (window.location.pathname !== '/') {
    window.history.replaceState({}, '', '/');
  }
  return 'home';
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(getInitialRoute);
  const [language, setLanguage] = useState<Language>('en');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  // Purpose pre-fill state
  const [preselectedPurpose, setPreselectedPurpose] = useState<string>('');

  // Modals
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  // Submission Success State
  const [lastSubmission, setLastSubmission] = useState<any | null>(null);

  // Strict Admin Auth State (Default: Verified against localStorage)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem('atalseva_admin_user');
      const token = localStorage.getItem('atalseva_admin_token');
      if (saved && token) {
        return JSON.parse(saved);
      }
      return null;
    } catch {
      return null;
    }
  });

  const [adminToken, setAdminToken] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('atalseva_admin_user');
      const token = localStorage.getItem('atalseva_admin_token');
      return (saved && token) ? token : '';
    } catch {
      return '';
    }
  });

  // Handle URL Path Synchronization & Strict Auth Gate Redirect
  useEffect(() => {
    const handleLocationChange = () => {
      const hostname = window.location.hostname;
      const path = window.location.pathname;
      const hasAuth = checkHasAdminAuth();

      // Admin Subdomain
      if (hostname.startsWith('admin.')) {
        if (!hasAuth) {
          if (path === '/login') {
            setCurrentRoute('admin-login');
            return;
          }
          // STRICT AUTH GATE: Kick unauthenticated to home
          setCurrentRoute('home');
          if (window.location.pathname !== '/') {
            window.history.replaceState({}, '', '/');
          }
          return;
        }
        if (path.startsWith('/workspace')) setCurrentRoute('admin-workspace');
        else if (path === '/community') setCurrentRoute('admin-community');
        else if (path === '/content' || path === '/website-content') setCurrentRoute('admin-content');
        else {
          setCurrentRoute('admin-dashboard');
          if (path !== '/admin/dashboard' && path !== '/dashboard') {
            window.history.replaceState({}, '', '/admin/dashboard');
          }
        }
        return;
      }

      // Exact Valid Public Routes
      if (path === '/' || path === '') {
        setCurrentRoute('home');
        return;
      }
      if (path === '/about') {
        setCurrentRoute('about');
        return;
      }
      if (path === '/services') {
        setCurrentRoute('services');
        return;
      }
      if (path === '/community') {
        setCurrentRoute('community');
        return;
      }
      if (path === '/faq') {
        setCurrentRoute('faq');
        return;
      }
      if (path === '/contact') {
        setCurrentRoute('contact');
        return;
      }
      if (path === '/upload') {
        setCurrentRoute('upload');
        return;
      }
      if (path === '/success') {
        setCurrentRoute('success');
        return;
      }

      // Explicit Admin Login Path
      if (path === '/admin/login') {
        if (hasAuth) {
          setCurrentRoute('admin-dashboard');
          window.history.replaceState({}, '', '/admin/dashboard');
        } else {
          setCurrentRoute('admin-login');
        }
        return;
      }

      // STRICT AUTH GATE FOR ALL AUTHORIZED / ADMIN ROUTES:
      // Any unauthorized request to /admin, /admin/dashboard, /admin/community, /admin/content, etc.
      // NAVIGATES STRAIGHT TO HOME PAGE AND RESETS URL!
      if (path === '/admin' || path.startsWith('/admin/') || path === '/dashboard' || path.startsWith('/workspace')) {
        if (!hasAuth) {
          setCurrentRoute('home');
          try {
            localStorage.removeItem('atalseva_admin_token');
            localStorage.removeItem('atalseva_admin_user');
          } catch {}
          if (window.location.pathname !== '/') {
            window.history.replaceState({}, '', '/');
          }
          return;
        }

        // Authenticated Admin Page Routes
        if (path === '/admin/community') {
          setCurrentRoute('admin-community');
        } else if (path === '/admin/content' || path === '/admin/website-content') {
          setCurrentRoute('admin-content');
        } else if (path.startsWith('/admin/workspace') || path.startsWith('/workspace')) {
          setCurrentRoute('admin-workspace');
        } else {
          setCurrentRoute('admin-dashboard');
          if (path !== '/admin/dashboard') {
            window.history.replaceState({}, '', '/admin/dashboard');
          }
        }
        return;
      }

      // ANY OTHER / WRONG PAGE -> NAVIGATE TO HOME PAGE AND RESET URL TO /
      setCurrentRoute('home');
      if (window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Handle Admin Logout (Security Gate: wipes session and directly returns to Home)
  const handleAdminLogout = () => {
    const currentToken = adminToken || (typeof window !== 'undefined' ? localStorage.getItem('atalseva_admin_token') : '');
    if (currentToken) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
      }).catch(() => {});
    }
    setAdminUser(null);
    setAdminToken('');
    try {
      localStorage.removeItem('atalseva_admin_user');
      localStorage.removeItem('atalseva_admin_token');
      localStorage.removeItem('atalseva_admin_tab');
    } catch {}
    notifyAuthChanged(false);
    if (window.location.pathname !== '/') {
      window.history.replaceState({}, '', '/');
    }
    setCurrentRoute('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Strict Authentication Guard & Proactive Session Verification Effect
  useEffect(() => {
    if (currentRoute.startsWith('admin-') && currentRoute !== 'admin-login') {
      const hasAuth = checkHasAdminAuth();
      if (!hasAuth || !adminUser || !adminToken) {
        handleAdminLogout();
        return;
      }

      // Proactively verify session with backend to prevent console 401s
      validateAdminSession().then((isValid) => {
        if (!isValid) {
          handleAdminLogout();
        }
      });
    }
  }, [currentRoute, adminUser, adminToken]);

  // Periodic and tab focus session liveness check for active admin views
  useEffect(() => {
    const checkLiveSession = () => {
      if (document.visibilityState === 'visible' && currentRoute.startsWith('admin-') && currentRoute !== 'admin-login') {
        validateAdminSession().then((isValid) => {
          if (!isValid) {
            handleAdminLogout();
          }
        });
      }
    };

    window.addEventListener('focus', checkLiveSession);
    document.addEventListener('visibilitychange', checkLiveSession);
    return () => {
      window.removeEventListener('focus', checkLiveSession);
      document.removeEventListener('visibilitychange', checkLiveSession);
    };
  }, [currentRoute]);

  // Listen for session expiration events (from 401 intercepts or session check)
  useEffect(() => {
    const handleExpiredEvent = () => {
      handleAdminLogout();
    };

    window.addEventListener('atalseva:session-expired', handleExpiredEvent);
    return () => window.removeEventListener('atalseva:session-expired', handleExpiredEvent);
  }, []);

  // Success Route Guard: if user lands on /success without submission, redirect to home
  useEffect(() => {
    if (currentRoute === 'success' && !lastSubmission) {
      setCurrentRoute('home');
      if (window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/');
      }
    }
  }, [currentRoute, lastSubmission]);

  // Sync route change to browser history
  const navigateTo = (route: string) => {
    const hasAuth = checkHasAdminAuth();

    // STRICT AUTH GATE: Prevent unauthenticated routing to any admin page
    if (route.startsWith('admin-') && route !== 'admin-login' && !hasAuth) {
      handleAdminLogout();
      return;
    }

    setCurrentRoute(route);
    let targetPath = '/';
    if (route === 'about') targetPath = '/about';
    else if (route === 'services') targetPath = '/services';
    else if (route === 'community') targetPath = '/community';
    else if (route === 'faq') targetPath = '/faq';
    else if (route === 'contact') targetPath = '/contact';
    else if (route === 'upload') targetPath = '/upload';
    else if (route === 'success') targetPath = '/success';
    else if (route === 'admin-login') targetPath = hasAuth ? '/admin/dashboard' : '/admin/login';
    else if (route === 'admin-dashboard') targetPath = '/admin/dashboard';
    else if (route === 'admin-community') targetPath = '/admin/community';
    else if (route === 'admin-content') targetPath = '/admin/content';
    else if (route === 'admin-workspace') targetPath = '/admin/workspace';
    else targetPath = '/';

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Switch between the 3 distinct Admin Pages
  const handleAdminPageSwitch = (page: string) => {
    if (page === 'community') navigateTo('admin-community');
    else if (page === 'website-content') navigateTo('admin-content');
    else navigateTo('admin-dashboard');
  };

  // Handle dark mode root class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle service selection from Services Grid
  const handleSelectServiceForUpload = (serviceTitle: string) => {
    setPreselectedPurpose(serviceTitle);
    navigateTo('upload');
  };

  // Handle submission success
  const handleSubmissionSuccess = (submissionData: any) => {
    setLastSubmission(submissionData);
    navigateTo('success');
  };

  // Cross-Tab and Global Auth State Synchronizer
  useEffect(() => {
    const unsub = subscribeToAuthChanges((data) => {
      if (data.loggedIn && data.user && data.token) {
        setAdminUser(data.user);
        setAdminToken(data.token);
      } else if (!data.loggedIn) {
        setAdminUser(null);
        setAdminToken('');
        if (currentRoute.startsWith('admin-')) {
          handleAdminLogout();
        }
      }
    });
    return () => unsub();
  }, [currentRoute]);

  // Handle Admin Login Success
  const handleAdminLoginSuccess = (user: AdminUser, token: string) => {
    setAdminUser(user);
    setAdminToken(token);
    localStorage.setItem('atalseva_admin_user', JSON.stringify(user));
    localStorage.setItem('atalseva_admin_token', token);
    notifyAuthChanged(true, token, user);
    navigateTo('admin-dashboard');
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--bg-primary)] text-[var(--color-text)] flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Navbar */}
      <Navbar
        currentView={currentRoute}
        setCurrentView={(view) => {
          if (view === 'dashboard') navigateTo('admin-dashboard');
          else if (view === 'community' && currentRoute.startsWith('admin-')) navigateTo('admin-community');
          else if (view === 'website-content' && currentRoute.startsWith('admin-')) navigateTo('admin-content');
          else navigateTo(view);
        }}
        language={language}
        setLanguage={setLanguage}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isAdminLoggedIn={!!adminUser}
        onLogout={handleAdminLogout}
        onOpenAdminModal={() => {
          if (adminUser) navigateTo('admin-dashboard');
          else setIsAdminModalOpen(true);
        }}
      />

      {/* Main View Router */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        
        {/* 1. Admin Workspace Processing Studio Page (Strict Auth Gate) */}
        {currentRoute === 'admin-workspace' ? (
          !adminUser || !adminToken ? (
            <HomePage language={language} onUploadClick={() => navigateTo('upload')} onSelectServiceForUpload={handleSelectServiceForUpload} onNavigateToServices={() => navigateTo('services')} onNavigateToCommunity={() => navigateTo('community')} />
          ) : (
            <AdminWorkspacePage
              submissionId={
                new URLSearchParams(window.location.search).get('id') ||
                window.location.pathname.replace(/^\/(admin\/)?workspace\/?/, '') ||
                ''
              }
              adminToken={adminToken}
              onBackToDashboard={() => navigateTo('admin-dashboard')}
              language={language}
            />
          )
        ) : currentRoute === 'admin-dashboard' ? (
          /* 2. Admin Submissions & Stats Dashboard Page (Strict Auth Gate) */
          !adminUser || !adminToken ? (
            <HomePage language={language} onUploadClick={() => navigateTo('upload')} onSelectServiceForUpload={handleSelectServiceForUpload} onNavigateToServices={() => navigateTo('services')} onNavigateToCommunity={() => navigateTo('community')} />
          ) : (
            <AdminDashboardPage
              adminUser={adminUser}
              adminToken={adminToken}
              onLogout={handleAdminLogout}
              onBackToHome={() => navigateTo('home')}
              onNavigateAdminPage={handleAdminPageSwitch}
              language={language}
            />
          )
        ) : currentRoute === 'admin-community' ? (
          /* 3. Dedicated Admin Community Channel Page (Strict Auth Gate) */
          !adminUser || !adminToken ? (
            <HomePage language={language} onUploadClick={() => navigateTo('upload')} onSelectServiceForUpload={handleSelectServiceForUpload} onNavigateToServices={() => navigateTo('services')} onNavigateToCommunity={() => navigateTo('community')} />
          ) : (
            <AdminCommunityPage
              adminUser={adminUser}
              adminToken={adminToken}
              onLogout={handleAdminLogout}
              onNavigateAdminPage={handleAdminPageSwitch}
              language={language}
            />
          )
        ) : currentRoute === 'admin-content' ? (
          /* 4. Dedicated Admin Website Content CMS Page (Strict Auth Gate) */
          !adminUser || !adminToken ? (
            <HomePage language={language} onUploadClick={() => navigateTo('upload')} onSelectServiceForUpload={handleSelectServiceForUpload} onNavigateToServices={() => navigateTo('services')} onNavigateToCommunity={() => navigateTo('community')} />
          ) : (
            <AdminWebsiteContentPage
              adminUser={adminUser}
              adminToken={adminToken}
              onLogout={handleAdminLogout}
              onNavigateAdminPage={handleAdminPageSwitch}
              language={language}
            />
          )
        ) : currentRoute === 'admin-login' ? (
          /* 5. Secure Admin Login Page */
          <AdminLoginPage
            language={language}
            onLoginSuccess={handleAdminLoginSuccess}
            onBackToHome={() => navigateTo('home')}
          />
        ) : currentRoute === 'success' && lastSubmission ? (
          /* 6. Citizen Submission Success Page */
          <SuccessPage
            language={language}
            submission={lastSubmission}
            onNewSubmission={() => navigateTo('upload')}
          />
        ) : currentRoute === 'upload' ? (
          /* 7. Citizen Upload Page */
          <UploadPage
            language={language}
            preselectedPurpose={preselectedPurpose}
            onSuccess={handleSubmissionSuccess}
          />
        ) : currentRoute === 'services' ? (
          /* 8. Services Catalog Page */
          <ServicesPage
            language={language}
            onSelectService={handleSelectServiceForUpload}
          />
        ) : currentRoute === 'community' ? (
          /* 9. Public Community Announcements Page */
          <CommunityPage
            language={language}
            adminUser={adminUser}
            adminToken={adminToken}
            onNavigateToUpload={() => navigateTo('upload')}
            onBackToHome={() => navigateTo('home')}
            onNavigateToAdminCommunity={() => {
              if (adminUser) navigateTo('admin-community');
              else setIsAdminModalOpen(true);
            }}
          />
        ) : currentRoute === 'faq' ? (
          /* 10. FAQ Page */
          <FaqPage language={language} />
        ) : currentRoute === 'contact' ? (
          /* 11. Contact Page */
          <ContactPage language={language} />
        ) : currentRoute === 'about' ? (
          /* 12. About Kendra Page */
          <AboutPage language={language} />
        ) : (
          /* 13. Default Public Home Page */
          <HomePage
            language={language}
            onUploadClick={() => navigateTo('upload')}
            onSelectServiceForUpload={handleSelectServiceForUpload}
            onNavigateToServices={() => navigateTo('services')}
            onNavigateToCommunity={() => navigateTo('community')}
          />
        )}

      </main>

      {/* Footer (Cleanly hidden on all admin pages to maintain isolated admin layout) */}
      {!currentRoute.startsWith('admin-') && (
        <Footer
          setCurrentView={(view) => navigateTo(view)}
          onOpenAdminModal={() => {
            if (adminUser) navigateTo('admin-dashboard');
            else setIsAdminModalOpen(true);
          }}
          isAdminLoggedIn={!!adminUser}
          language={language}
        />
      )}

      {/* Admin Login Modal (Single-instance modal trigger) */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        language={language}
      />

    </div>
  );
}
