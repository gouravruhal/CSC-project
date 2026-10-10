import { SlidingWindowRateLimiter } from '../../src/lib/security.js';

export const globalApiLimiter = new SlidingWindowRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 300,
  message: 'Too many requests. Please slow down and try again shortly.',
  name: 'GlobalApi',
});

export const submissionLimiter = new SlidingWindowRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 12,
  message: 'Too many document uploads from this network. Please wait 15 minutes before uploading again.',
  name: 'Submission',
});

export const trackingLimiter = new SlidingWindowRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 25,
  message: 'Status tracking search limit reached. Please wait a few minutes before searching again.',
  name: 'Tracking',
});

export const authLimiter = new SlidingWindowRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 6,
  message: 'Too many sign-in attempts. Account temporarily locked for 15 minutes.',
  name: 'AdminAuth',
});

export const cmsLimiter = new SlidingWindowRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 40,
  message: 'Content management rate limit reached. Please wait before saving again.',
  name: 'CMS',
});

export const csrfLimiter = new SlidingWindowRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 60,
  message: 'Security token rate limit reached. Please refresh later.',
  name: 'CSRF',
});

export const fileDownloadLimiter = new SlidingWindowRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 60,
  message: 'Download rate limit exceeded. Please wait before downloading more documents.',
  name: 'Download',
});
