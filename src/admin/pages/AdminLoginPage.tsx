import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Language, AdminUser } from '../../types';

interface AdminLoginPageProps {
  language: Language;
  onLoginSuccess: (user: AdminUser, token: string) => void;
  onBackToHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    fetch('/api/csrf-token')
      .then((res) => res.json())
      .then((data) => {
        if (data.csrfToken) setCsrfToken(data.csrfToken);
      })
      .catch((e) => console.error('Failed to fetch CSRF token:', e));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both username/email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, csrfToken }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        onLoginSuccess(data.user, data.token);
      } else {
        setErrorMsg(data.error || 'Authentication failed. Invalid email or password.');
      }
    } catch (err) {
      setErrorMsg('Network error connecting to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--bg-primary)] flex flex-col items-center justify-center p-4 sm:p-6 transition-colors">
      <div className="w-full max-w-md container-box p-6 sm:p-8 space-y-6 rounded-3xl border border-[var(--color-border)] shadow-xl relative overflow-hidden">
        
        {/* Centralized Bold Welcome Header */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">
            WELCOME BACK
          </h1>
          <p className="text-xs text-[var(--color-muted-text)] font-semibold tracking-wide">
            Sign in to access Maa Vaishno e-World portal
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 text-xs font-bold text-red-500 border border-red-500/20 text-center">
            {errorMsg}
          </div>
        )}

        {/* Professional Minimal Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          
          {/* Username or Email */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Username or Email
            </label>
            <input
              type="text"
              maxLength={100}
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter username or email"
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] focus:border-[#30AFFF] focus:ring-2 focus:ring-[#30AFFF]/20 focus:outline-none text-xs text-[var(--color-text)] font-mono font-medium transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                maxLength={128}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-4 pr-11 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] focus:border-[#30AFFF] focus:ring-2 focus:ring-[#30AFFF]/20 focus:outline-none text-xs text-[var(--color-text)] font-mono transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-text)] hover:text-[var(--color-text)] text-xs cursor-pointer p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Bold Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 font-black text-xs shadow-md transition-all uppercase tracking-wider ${
              loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default AdminLoginPage;
