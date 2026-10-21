import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Building,
  ShieldCheck,
  ExternalLink,
  Send
} from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../lib/translations';
import { getCachedWebsiteContent, subscribeToWebsiteContent } from '../../lib/apiCache';

interface AboutContactSectionProps {
  language: Language;
}

export const AboutContactSection: React.FC<AboutContactSectionProps> = ({ language }) => {
  const t = translations[language];
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [siteContent, setSiteContent] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('mv_website_content');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  React.useEffect(() => {
    let isMounted = true;
    getCachedWebsiteContent().then((content) => {
      if (isMounted && content) {
        setSiteContent(content);
      }
    });

    const unsub = subscribeToWebsiteContent((content) => {
      if (isMounted && content) {
        setSiteContent(content);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const defaultFaqs = [
    {
      q: language === 'hi' ? 'क्या दस्तावेज ऑनलाइन भेजने का कोई शुल्क है?' : 'Is there any fee to send documents online?',
      a: language === 'hi' ? 'जी नहीं, दस्तावेज ऑनलाइन भेजना बिल्कुल नि:शुल्क है। आप केवल सेवा या प्रिंटिंग का शुल्क केंद्र पर देते हैं।' : 'No, sending documents through this portal is completely free. You only pay standard printing or service fees at the counter.',
    },
    {
      q: language === 'hi' ? 'हिंदी व अंग्रेजी टाइपिंग का काम कितने समय में होता है?' : 'How long does Hindi & English typing work take?',
      a: language === 'hi' ? 'छोटे दस्तावेज तुरंत और बड़े फॉर्म/एग्रीमेंट बहुत कम समय में तैयार किए जाते हैं।' : 'Short letters are typed immediately and multi-page documents are prepared quickly with special attention to accurate spelling and names.',
    },
    {
      q: language === 'hi' ? 'क्या मेरे दस्तावेज सुरक्षित रहेंगे?' : 'Are my documents safe with Maa Vaishno e-World?',
      a: language === 'hi' ? 'जी हां, आपकी फाइलें एन्क्रिप्टेड स्टोरेज में रहती हैं और सेवा पूरी होने के बाद सुरक्षित रखी जाती हैं।' : 'Yes, customer documents are handled with strict confidentiality and secure processing.',
    },
    {
      q: language === 'hi' ? 'केंद्र खुलने का समय क्या है?' : 'What are the centre operating hours?',
      a: language === 'hi' ? 'सोमवार से शनिवार सुबह 8:30 बजे से शाम 7:30 बजे तक।' : 'Monday through Saturday from 8:30 AM to 7:30 PM (Sunday Closed).',
    },
  ];

  const faqs = (siteContent?.faqs && siteContent.faqs.length > 0) ? siteContent.faqs : defaultFaqs;

  return (
    <section id="contact-section" className="py-8 sm:py-12 bg-[var(--bg-primary)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">
            {language === 'hi' ? 'संपर्क एवं स्थान' : 'Contact & Location Details'}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-muted-text)] font-medium">
            {siteContent?.address || 'Rairkalan, Panipat, Haryana'} • Contact Person: {siteContent?.operatorName || 'Surender Bajwa'}
          </p>
        </div>

        {/* Quick Action Contact Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
          <a
            href="tel:+919896419275"
            className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] transition-all flex items-center space-x-3 cursor-pointer group shadow-2xs"
          >
            <div className="w-9 h-9 rounded-xl bg-[#30AFFF]/10 text-[#30AFFF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Phone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider">Call Centre</p>
              <p className="text-xs font-black text-[var(--color-text)] font-mono truncate">+91 9896419275</p>
            </div>
          </a>

          <a
            href="mailto:surenderbajwa1@gmail.com"
            className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] transition-all flex items-center space-x-3 cursor-pointer group shadow-2xs"
          >
            <div className="w-9 h-9 rounded-xl bg-[#30AFFF]/10 text-[#30AFFF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider">Email Us</p>
              <p className="text-xs font-black text-[var(--color-text)] font-mono truncate">surenderbajwa1@gmail.com</p>
            </div>
          </a>

          <a
            href="https://www.google.com/maps/search/?api=1&query=29.48823169134412,76.83097890513511"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] transition-all flex items-center space-x-3 cursor-pointer group shadow-2xs"
          >
            <div className="w-9 h-9 rounded-xl bg-[#C4F7CA]/30 text-emerald-700 dark:text-[#C4F7CA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase tracking-wider">Location</p>
              <p className="text-xs font-black text-[var(--color-text)] truncate">Rairkalan, Panipat</p>
            </div>
          </a>
        </div>

        {/* 2-Column Main Layout: Left = Info Details, Right = Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-5 container-box p-6 space-y-5 flex flex-col justify-between shadow-2xs rounded-3xl">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[var(--color-text)] border-b border-[var(--color-border)] pb-3 flex items-center justify-between">
              <span>CSC Centre Info</span>
              <span className="text-xs font-bold text-[#30AFFF]">Panipat, HR</span>
            </h2>

            <div className="space-y-4 text-xs flex-1">
              
              {/* Centre Name */}
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] text-[var(--color-text)] flex items-center justify-center shrink-0 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-[#30AFFF]" />
                </div>
                <div>
                  <p className="font-bold text-[var(--color-text)]">Centre Name</p>
                  <p className="text-[var(--color-muted-text)] mt-0.5 font-extrabold text-xs">
                    Maa Vaishno e-World CSC Centre
                  </p>
                </div>
              </div>

              {/* Contact Person */}
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] text-[var(--color-text)] flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-[#30AFFF]" />
                </div>
                <div>
                  <p className="font-bold text-[var(--color-text)]">Operator / Contact Person</p>
                  <p className="text-[var(--color-muted-text)] mt-0.5 font-extrabold text-xs">Surender Bajwa</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] text-[var(--color-text)] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#30AFFF]" />
                </div>
                <div>
                  <p className="font-bold text-[var(--color-text)]">Address</p>
                  <p className="text-[var(--color-muted-text)] mt-0.5 font-medium">
                    Rairkalan, Panipat, Haryana (132103)
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start space-x-3 pt-3 border-t border-[var(--color-border)]">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] text-[var(--color-text)] flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-[#30AFFF]" />
                </div>
                <div>
                  <p className="font-bold text-[var(--color-text)]">Operating Hours</p>
                  <p className="text-[var(--color-muted-text)] mt-0.5 font-medium">
                    Mon – Sat: 8:30 AM – 7:30 PM (Sun Closed)
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Google Maps Embed */}
          <div className="lg:col-span-7 container-box overflow-hidden flex flex-col justify-between min-h-[320px] shadow-2xs rounded-3xl border border-[var(--color-border)]">
            <div className="p-3.5 bg-[var(--bg-primary)] border-b border-[var(--color-border)] flex items-center justify-between text-xs">
              <span className="font-extrabold text-[var(--color-text)] flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#30AFFF]" />
                <span>Google Maps Location</span>
              </span>
              <a
                href="https://www.google.com/maps/search/?api=1&query=29.48823169134412,76.83097890513511"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] text-[#30AFFF] hover:underline flex items-center space-x-1 font-bold"
              >
                <span>29.488231, 76.830978</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="w-full flex-1 min-h-[260px] bg-[var(--bg-primary)] relative">
              <iframe
                title="Maa Vaishno e-World CSC Centre Map"
                src="https://maps.google.com/maps?q=29.48823169134412,76.83097890513511&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '260px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>
          </div>

        </div>

        {/* Minimalist FAQ Accordion */}
        <div className="container-box p-6 space-y-4 shadow-2xs rounded-3xl">
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--color-text)] border-b border-[var(--color-border)] pb-3">
            {language === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions (FAQ)'}
          </h2>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--bg-primary)] overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-3.5 text-left font-extrabold text-xs text-[var(--color-text)] flex items-center justify-between cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 text-[#30AFFF] shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-[var(--color-muted-text)] shrink-0 ml-2" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-3.5 pb-3.5 text-xs text-[var(--color-muted-text)] font-medium leading-relaxed border-t border-[var(--color-border)] pt-2.5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
