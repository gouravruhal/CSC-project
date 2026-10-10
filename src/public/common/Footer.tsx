import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, User } from 'lucide-react';
import { Language, WebsiteContent } from '../../types';

interface FooterProps {
  setCurrentView: (view: string) => void;
  onOpenAdminModal: () => void;
  isAdminLoggedIn: boolean;
  language: Language;
}

export const Footer: React.FC<FooterProps> = ({
  setCurrentView,
  language,
}) => {
  const [content, setContent] = useState<Partial<WebsiteContent>>(() => {
    try {
      const cached = localStorage.getItem('mv_website_content');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    fetch('/api/website-content')
      .then((res) => res.json())
      .then((data) => {
        if (data?.content) {
          setContent(data.content);
        }
      })
      .catch(() => {});
  }, []);

  const phone = content.phone || '+91 9896419275';
  const email = content.email || 'surenderbajwa1@gmail.com';
  const address = content.address || 'Rairkalan, Panipat, Haryana';
  const mapsUrl = content.mapsUrl || 'https://www.google.com/maps/search/?api=1&query=29.48823169134412,76.83097890513511';
  const operatorName = content.operatorName || 'Surender Bajwa';

  return (
    <footer className="w-full max-w-full overflow-x-hidden bg-[var(--bg-card)] border-t border-[var(--color-border)] text-[var(--color-text)] py-10 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-8 border-b border-[var(--color-border)]">
          
          {/* Brand Info (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="Maa Vaishno e-World"
                className="w-10 h-10 object-contain shrink-0"
              />
              <div>
                <p className="font-black text-base tracking-tight text-[var(--color-text)] uppercase font-sans">
                  MAA VAISHNO e-WORLD
                </p>
                <p className="text-xs font-semibold text-[var(--color-muted-text)]">
                  CSC Centre • Rairkalan, Panipat
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--color-muted-text)] leading-relaxed max-w-sm">
              {language === 'hi'
                ? 'हिंदी व अंग्रेजी टाइपिंग, प्रिंटिंग, स्कैनिंग, फोटोकॉपी, पीडीएफ सेवाएं, ऑनलाइन फॉर्म, रिज्यूमे एवं डेटा एंट्री।'
                : 'Fast & accurate Hindi & English Typing, Printing, Scanning, Photocopy, PDF Services, Online Forms, Resume & Data Entry.'}
            </p>
          </div>

          {/* CSC Centre Details (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
              {language === 'hi' ? 'केंद्र का विवरण व संपर्क' : 'CSC Centre Details'}
            </p>

            <div className="space-y-2.5 text-xs text-[var(--color-muted-text)] leading-relaxed">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start space-x-2.5 hover:text-[#30AFFF] transition-colors group"
                title="View location on Google Maps"
              >
                <MapPin className="w-4 h-4 text-[#30AFFF] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[var(--color-text)] font-bold group-hover:text-[#30AFFF] transition-colors">
                    Maa Vaishno e-World CSC Centre
                  </strong>
                  <br />
                  Location: {address}
                </span>
              </a>

              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-[#30AFFF] shrink-0" />
                <a
                  href={`tel:${phone.replace(/\s+/g, '')}`}
                  className="text-[var(--color-text)] font-mono font-bold hover:text-[#30AFFF] transition-colors"
                >
                  {phone}
                </a>
              </div>

              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-[#30AFFF] shrink-0" />
                <a
                  href={`mailto:${email}`}
                  className="text-[var(--color-text)] font-semibold hover:text-[#30AFFF] transition-colors"
                >
                  {email}
                </a>
              </div>

              <div className="flex items-center space-x-2.5 pt-0.5">
                <User className="w-4 h-4 text-[#30AFFF] shrink-0" />
                <span className="text-xs">
                  Contact Person: <strong className="text-[var(--color-text)] font-bold">{operatorName}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Website Navigations (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
              {language === 'hi' ? 'वेबसाइट नेविगेशन' : 'Website Navigations'}
            </p>
            <ul className="space-y-2 text-xs font-semibold text-[var(--color-muted-text)]">
              <li>
                <button
                  onClick={() => setCurrentView('home')}
                  className="hover:text-[#30AFFF] cursor-pointer transition-colors text-left"
                >
                  {language === 'hi' ? 'होम (Home)' : 'Home'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('upload')}
                  className="hover:text-[#30AFFF] cursor-pointer transition-colors text-left"
                >
                  {language === 'hi' ? 'दस्तावेज भेजें (Upload)' : 'Upload Document'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('services')}
                  className="hover:text-[#30AFFF] cursor-pointer transition-colors text-left"
                >
                  {language === 'hi' ? 'सेवाएं (Services)' : 'Services'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('community')}
                  className="hover:text-[#30AFFF] cursor-pointer transition-colors text-left"
                >
                  {language === 'hi' ? 'कम्युनिटी (Community)' : 'Community'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('contact')}
                  className="hover:text-[#30AFFF] cursor-pointer transition-colors text-left"
                >
                  {language === 'hi' ? 'संपर्क (Contact Us)' : 'Contact Us'}
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--color-muted-text)] gap-2 text-center sm:left">
          <p>© {new Date().getFullYear()} Maa Vaishno e-World CSC Centre. All Rights Reserved.</p>
          <p className="font-semibold text-[var(--color-text)]">
            Rairkalan, Panipat • Fast & Accurate Service
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
