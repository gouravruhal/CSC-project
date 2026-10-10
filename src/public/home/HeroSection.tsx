import React from 'react';
import { 
  Upload, 
  ArrowRight,
  Phone,
  MapPin,
  Radio
} from 'lucide-react';
import { Language } from '../../types';

interface HeroSectionProps {
  onUploadClick: () => void;
  onSelectServiceForUpload?: (serviceTitle: string) => void;
  onCommunityClick?: () => void;
  onExploreServicesClick?: () => void;
  language: Language;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  onUploadClick, 
  onSelectServiceForUpload,
  onCommunityClick,
  onExploreServicesClick,
  language 
}) => {
  const [isCounterOpen, setIsCounterOpen] = React.useState<boolean>(true);
  const [siteContent, setSiteContent] = React.useState<any>(() => {
    try {
      const saved = localStorage.getItem('mv_website_content');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  React.useEffect(() => {
    fetch('/api/counter-status')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.isOpen === 'boolean') setIsCounterOpen(data.isOpen);
      })
      .catch(() => {
        const saved = localStorage.getItem('mv_counter_open');
        if (saved !== null) setIsCounterOpen(saved === 'true');
      });

    fetch('/api/website-content')
      .then((res) => res.json())
      .then((data) => {
        if (data.content) {
          setSiteContent(data.content);
          localStorage.setItem('mv_website_content', JSON.stringify(data.content));
        }
      })
      .catch(() => {});
  }, []);

  const servicesList: Array<{ id: string; name: string; category: string; isClosed?: boolean }> =
    React.useMemo(() => {
      if (siteContent?.servicesList && Array.isArray(siteContent.servicesList) && siteContent.servicesList.length > 0) {
        return siteContent.servicesList;
      }
      return [];
    }, [siteContent]);

  const dynamicCategories = React.useMemo(() => {
    const cats = new Set<string>();
    servicesList.forEach((s) => {
      if (s.category && s.category.trim()) {
        cats.add(s.category.trim());
      }
    });
    return Array.from(cats);
  }, [servicesList]);

  return (
    <section className="relative py-6 sm:py-10 overflow-hidden w-full max-w-full">
      
      {/* Background subtle glow using #30AFFF & #92EEFF & #C4F7CA */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-[#30AFFF]/15 via-[#92EEFF]/10 to-transparent blur-2xl pointer-events-none -z-10 overflow-hidden" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        
        {/* Dynamic Public Alert Banner */}
        {siteContent?.announcementBannerEnabled && siteContent?.announcementBannerText && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/40 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center justify-center space-x-2 shadow-xs text-center animate-in fade-in">
            <Radio className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
            <span>{siteContent.announcementBannerText}</span>
          </div>
        )}

        {/* Main Hero Card Container */}
        <div className="container-box p-6 sm:p-10 space-y-8 shadow-sm">
          
          {/* Centered Main Title & Place Name & Contact */}
          <div className="text-center space-y-3">

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--color-text)] uppercase font-sans">
              {siteContent?.heroHeadline || 'MAA VAISHNO e-WORLD CSC CENTRE'}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-semibold text-[var(--color-muted-text)]">
              <a
                href={siteContent?.mapsUrl || 'https://www.google.com/maps/search/?api=1&query=29.48823169134412,76.83097890513511'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-[var(--color-text)] hover:text-[#30AFFF] transition-colors font-semibold"
                title="View on Google Maps"
              >
                <MapPin className="w-4 h-4 text-[#30AFFF]" />
                <span>{siteContent?.address || 'Rairkalan, Panipat'}</span>
              </a>
              <span>|</span>
              <a href={`tel:${(siteContent?.phone || '+919896419275').replace(/\s+/g, '')}`} className="inline-flex items-center space-x-1 text-[var(--color-text)] hover:text-[#30AFFF] transition-colors font-mono font-bold">
                <Phone className="w-4 h-4 text-[#30AFFF]" />
                <span>{siteContent?.phone || '+91 9896419275'}</span>
              </a>
            </div>

            {/* Live Counter Open / Closed Status (Simple Text) */}
            <div className="flex items-center justify-center space-x-1.5 text-xs font-bold pt-1">
              <span className={`w-2 h-2 rounded-full shrink-0 ${isCounterOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className={isCounterOpen ? 'text-emerald-700 dark:text-[#C4F7CA]' : 'text-rose-600 dark:text-rose-400'}>
                {isCounterOpen ? 'Counter Open' : 'Counter Closed'}
              </span>
            </div>
          </div>

          {/* Tagline Left and Buttons Right */}
          <div className="pt-8 border-t border-[var(--color-border)] flex flex-col lg:flex-row items-center justify-between gap-8">
            
            {/* Tagline Text on the Left */}
            <div className="space-y-4 max-w-xl text-center lg:text-left">

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
                Typing, Printing, Scanning & Online Services
              </h2>

              <p className="text-xs sm:text-sm text-[var(--color-muted-text)] font-normal leading-relaxed">
                {siteContent?.heroSubtitle || (language === 'hi' 
                  ? 'हिंदी और अंग्रेजी टाइपिंग, प्रिंटिंग, स्कैनिंग, फोटोकॉपी, पीडीएफ मर्ज, ऑनलाइन फॉर्म, रिज्यूमे एवं डेटा एंट्री का काम 100% शुद्धता व सुरक्षा के साथ।'
                  : 'Fast & Accurate Typing (Hindi & English), Government & Private Online Forms, B/W & Colour Printing, PDF Creation & Merging, Document Scanning, Resumes, and Data Entry.')}
              </p>

              {/* Service Pills / Categories Banner */}
              {dynamicCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 justify-center lg:justify-start">
                  {dynamicCategories.map((cat, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={onExploreServicesClick}
                      className="px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[11px] font-bold text-[var(--color-text)] shadow-2xs transition-colors cursor-pointer"
                      title={`View ${cat} Services`}
                    >
                      • {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons to the Right */}
            <div className="flex flex-col space-y-3 w-full sm:w-auto shrink-0 min-w-[240px]">
              
              {/* Upload Document Button */}
              <button
                onClick={onUploadClick}
                className="w-full px-6 py-3.5 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 font-black text-sm transition-all duration-200 shadow-md flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                <Upload className="w-4 h-4 text-slate-950" />
                <span>Upload Document Now</span>
              </button>

              {/* Community Updates Button */}
              <button
                onClick={onCommunityClick || onExploreServicesClick}
                className="w-full px-6 py-3.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--accent-soft)] text-[var(--color-text)] font-bold text-sm transition-all duration-200 border border-[var(--color-border)] hover:border-[#30AFFF] flex items-center justify-center space-x-2 cursor-pointer shadow-2xs group"
              >
                <Radio className="w-4 h-4 text-[#30AFFF] shrink-0" />
                <span>Community Updates</span>
                <ArrowRight className="w-4 h-4 text-[var(--color-muted-text)] group-hover:text-[#30AFFF] group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              <div className="text-center pt-1">
                <span className="text-[11px] font-medium text-[var(--color-muted-text)]">
                  {siteContent?.address || 'Rairkalan, Panipat'} | {siteContent?.phone || '+91 9896419275'}
                </span>
              </div>

            </div>

          </div>

        </div>

        {/* Dynamic Services Container Connected to Backend */}
        <div id="our-services-boxes" className="container-box p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--color-border)] pb-4">
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-extrabold text-[var(--color-text)] tracking-tight">
                {language === 'hi' ? 'मां वैष्णो ई-वर्ल्ड सीएससी सेंटर की प्रमुख सेवाएं' : 'Main Services at Maa Vaishno e-World CSC Centre'}
              </h3>
              <p className="text-xs text-[var(--color-muted-text)]">
                {language === 'hi' ? 'सेवा पर क्लिक करें और सीधे दस्तावेज अपलोड करें' : 'Click any active service to immediately upload documents'}
              </p>
            </div>
            {servicesList.length > 0 && (
              <span className="text-[11px] font-bold text-[#30AFFF] bg-[#30AFFF]/10 px-2.5 py-1 rounded-full border border-[#30AFFF]/20">
                {servicesList.filter(s => !s.isClosed).length} Available Services
              </span>
            )}
          </div>

          {/* Clean Interactive Services Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {servicesList.map((service) => {
              const isClosed = !!service.isClosed;
              return (
                <button
                  key={service.id}
                  type="button"
                  disabled={isClosed}
                  onClick={() => {
                    if (!isClosed && onSelectServiceForUpload) {
                      onSelectServiceForUpload(service.name);
                    }
                  }}
                  className={`px-3 py-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-between space-x-1.5 transition-all text-left shadow-2xs ${
                    isClosed
                      ? 'bg-amber-500/5 border-amber-500/25 text-[var(--color-muted-text)] opacity-60 cursor-not-allowed'
                      : 'bg-[var(--bg-primary)] border-[var(--color-border)] text-[var(--color-text)] hover:border-[#30AFFF] hover:bg-[var(--accent-soft)] hover:text-[#30AFFF] cursor-pointer group'
                  }`}
                  title={isClosed ? `${service.name} (Temporarily Closed at Counter)` : `Upload documents for ${service.name}`}
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isClosed ? 'bg-amber-500' : 'bg-[#30AFFF]'}`} />
                    <span className={`truncate ${isClosed ? 'line-through text-amber-900/60 dark:text-amber-300/60' : ''}`}>{service.name}</span>
                  </div>
                  {isClosed ? (
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 shrink-0">Closed</span>
                  ) : (
                    <ArrowRight className="w-3 h-3 text-[var(--color-muted-text)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                  )}
                </button>
              );
            })}

            {/* Navigation to Services Page */}
            <button
              onClick={onExploreServicesClick}
              className="px-3 py-2.5 rounded-xl bg-[var(--accent-soft)] hover:bg-[#30AFFF] text-[#30AFFF] hover:text-slate-950 border border-[#30AFFF]/40 text-[11px] font-bold flex items-center justify-between space-x-1.5 transition-all cursor-pointer shadow-2xs group"
              title="Explore all services & government forms"
            >
              <span className="truncate">View All Services</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          </div>

          {/* Quick Right-Corner Link */}
          <div className="flex justify-end pt-1">
            <button
              onClick={onExploreServicesClick}
              className="inline-flex items-center space-x-1 text-xs font-bold text-[#30AFFF] hover:text-[#209CEF] transition-colors cursor-pointer group"
            >
              <span>{language === 'hi' ? 'सभी सेवाएं व फॉर्म देखें' : `View All (${servicesList.length}) Services & Forms`}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
