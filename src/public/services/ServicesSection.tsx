import React, { useState, useEffect } from 'react';
import { 
  Search,
  Keyboard,
  Printer,
  Globe,
  ArrowRight,
  Tag,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { Language, ManagedServiceItem } from '../../types';
import { getCachedWebsiteContent, subscribeToWebsiteContent } from '../../lib/apiCache';

interface ServicesSectionProps {
  language: Language;
  onSelectService?: (serviceTitle: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ 
  language,
  onSelectService 
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [services, setServices] = useState<ManagedServiceItem[]>(() => {
    try {
      const cached = localStorage.getItem('mv_website_content');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.servicesList && Array.isArray(parsed.servicesList)) {
          return parsed.servicesList;
        }
      }
    } catch {}
    return [];
  });
  const [closedToast, setClosedToast] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getCachedWebsiteContent().then((content) => {
      if (isMounted && content?.servicesList && Array.isArray(content.servicesList)) {
        setServices(content.servicesList);
      }
    });

    const unsub = subscribeToWebsiteContent((content) => {
      if (isMounted && content?.servicesList && Array.isArray(content.servicesList)) {
        setServices(content.servicesList);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const query = searchQuery.toLowerCase().trim();

  const handleServiceClick = (item: ManagedServiceItem) => {
    if (item.isClosed) {
      setClosedToast(`"${item.name}" ${language === 'hi' ? 'वर्तमान में काउंटर पर बंद है।' : 'is temporarily closed at our Kendra counter.'}`);
      setTimeout(() => setClosedToast(null), 3000);
      return;
    }

    if (onSelectService) {
      onSelectService(item.name);
    } else {
      const uploadEl = document.getElementById('upload-section');
      if (uploadEl) {
        uploadEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Group services by category
  const categoriesMap = new Map<string, ManagedServiceItem[]>();
  services.forEach((srv) => {
    const cat = srv.category || 'Other';
    if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
    categoriesMap.get(cat)!.push(srv);
  });

  const getCategoryIcon = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('typing')) return Keyboard;
    if (c.includes('print') || c.includes('scan')) return Printer;
    if (c.includes('form') || c.includes('scheme')) return Globe;
    return Layers;
  };

  return (
    <section id="services-section" className="py-8 sm:py-12 bg-[var(--bg-primary)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Closed Service Feedback Toast */}
        {closedToast && (
          <div className="fixed top-5 right-5 z-50 bg-amber-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{closedToast}</span>
          </div>
        )}

        {/* Simple Clean Header */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">
            {language === 'hi' ? 'हमारी सीएससी सेवाएं' : 'Counter Services & Solutions'}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-muted-text)] font-medium">
            {language === 'hi'
              ? 'हिंदी/अंग्रेजी टाइपिंग, प्रिंटिंग, स्कैनिंग, फोटोकॉपी, ऑनलाइन फॉर्म एवं सरकारी योजनाएं।'
              : 'Hindi & English Typing, Laser Printing, HD Scanning, Photocopy, Online Forms & Government Schemes.'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-text)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'सेवा खोजें (उदा. टाइपिंग, प्रिंटिंग, पैन कार्ड, फॉर्म)...'
                : 'Search services (e.g. Typing, Printing, PAN Card, Form)...'
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[#30AFFF]"
          />
        </div>

        {/* Dynamic Categorized Services List */}
        <div className="space-y-6">
          {Array.from(categoriesMap.entries()).map(([categoryName, items]) => {
            const Icon = getCategoryIcon(categoryName);

            const filteredItems = items.filter((item) => {
              if (!query) return true;
              return (
                item.name.toLowerCase().includes(query) ||
                categoryName.toLowerCase().includes(query)
              );
            });

            if (filteredItems.length === 0 && query) return null;

            return (
              <div
                key={categoryName}
                className="container-box p-6 space-y-4 rounded-2xl shadow-xs border border-[var(--color-border)]"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] text-[var(--color-text)] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#30AFFF]" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[var(--color-text)]">
                        {categoryName}
                      </h2>
                      <p className="text-xs text-[var(--color-muted-text)] font-medium">
                        {filteredItems.length} {filteredItems.length === 1 ? 'Service' : 'Services'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredItems.map((item) => {
                    const isClosed = !!item.isClosed;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleServiceClick(item)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between space-x-3 group ${
                          isClosed
                            ? 'bg-amber-500/5 border-amber-500/25 opacity-75 hover:opacity-100'
                            : 'bg-[var(--bg-primary)] border-[var(--color-border)] hover:border-[#30AFFF]'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className={`text-xs font-bold truncate transition-colors ${
                              isClosed
                                ? 'text-amber-900 dark:text-amber-200 line-through'
                                : 'text-[var(--color-text)] group-hover:text-[#30AFFF]'
                            }`}>
                              {item.name}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 mt-1">
                            {isClosed ? (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-black text-amber-600 dark:text-amber-400">
                                <XCircle className="w-2.5 h-2.5" />
                                <span>{language === 'hi' ? 'अस्थायी रूप से बंद' : 'Temporarily Closed'}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>{language === 'hi' ? 'उपलब्ध • दस्तावेज भेजें' : 'Available • Upload Docs'}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                          isClosed
                            ? 'border-amber-400/30 text-amber-500 bg-amber-500/10'
                            : 'bg-[var(--bg-card)] border-[var(--color-border)] text-[var(--color-muted-text)] group-hover:text-[#30AFFF] group-hover:border-[#30AFFF]'
                        }`}>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>



      </div>
    </section>
  );
};

export default ServicesSection;
