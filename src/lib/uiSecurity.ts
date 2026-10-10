/**
 * Strict UI Security Utilities
 * Enforces field sanitization, character limiting, OWASP XSS defense,
 * Indian phone number validation, safe URL checks, and anti-injection masking.
 */

// Strip HTML tags, script vectors, and malicious protocol injections
export function sanitizeText(val: string, maxLength?: number): string {
  if (!val) return '';
  let cleaned = val
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/javascript\s*:/gi, '') // Strip javascript: protocol
    .replace(/data\s*:\s*text\/html/gi, '') // Strip data HTML
    .replace(/vbscript\s*:/gi, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ''); // Strip control characters

  // Neutralize common SQL Injection patterns
  cleaned = cleaned.replace(/(--|\/\*|\*\/|;\s*DROP|;\s*DELETE|;\s*UPDATE)/gi, '');

  if (typeof maxLength === 'number' && maxLength > 0) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned;
}

// Strict digits-only sanitization for phone numbers
export function sanitizePhone(val: string): string {
  if (!val) return '';
  return val.replace(/\D/g, '').slice(0, 10);
}

// Validate Indian 10-digit mobile number format
export function validateIndianPhone(val: string): { valid: boolean; error?: string } {
  const digits = sanitizePhone(val);
  if (!digits) {
    return { valid: false, error: 'Mobile number is required' };
  }
  if (digits.length !== 10) {
    return { valid: false, error: 'Must be exactly 10 digits' };
  }
  if (!/^[6-9]/.test(digits)) {
    return { valid: false, error: 'Must start with 6, 7, 8, or 9' };
  }
  return { valid: true };
}

// Validate email format and check boundaries
export function validateEmail(val: string): { valid: boolean; error?: string } {
  const trimmed = val.trim();
  if (!trimmed) {
    return { valid: false, error: 'Email address is required' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Email cannot exceed 100 characters' };
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Enter a valid email address' };
  }
  return { valid: true };
}

// Validate safe HTTP/HTTPS URL and block SSRF vectors
export function validateSafeUrl(urlStr: string): { valid: boolean; error?: string } {
  if (!urlStr || !urlStr.trim()) return { valid: true };
  const trimmed = urlStr.trim();

  if (trimmed.length > 500) {
    return { valid: false, error: 'URL is too long (max 500 characters)' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Invalid URL format. Must start with https://' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only http:// and https:// protocols are allowed' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block loopback, internal networks, and cloud metadata (SSRF defense)
  const blockedHostnames = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '169.254.169.254'];
  if (blockedHostnames.includes(hostname)) {
    return { valid: false, error: 'Access to local/private network addresses is blocked' };
  }

  // Block private IP ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x
  if (
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
  ) {
    return { valid: false, error: 'Private local IP addresses are blocked' };
  }

  return { valid: true };
}

// Mask sensitive identifiers (e.g. Aadhaar or Token for UI displays)
export function maskSensitive(val: string, visibleStart = 2, visibleEnd = 2): string {
  if (!val || val.length <= visibleStart + visibleEnd) return val;
  const start = val.slice(0, visibleStart);
  const end = val.slice(-visibleEnd);
  const maskedLength = val.length - visibleStart - visibleEnd;
  return `${start}${'•'.repeat(Math.min(maskedLength, 8))}${end}`;
}
