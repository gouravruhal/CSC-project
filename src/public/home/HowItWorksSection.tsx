import React, { useState, useEffect } from 'react';
import { Language, EquipmentItem } from '../../types';
import { getCachedWebsiteContent, subscribeToWebsiteContent } from '../../lib/apiCache';

interface HowItWorksSectionProps {
  language: Language;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ language }) => {
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>(() => {
    try {
      const cached = localStorage.getItem('mv_website_content');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.equipmentList && Array.isArray(parsed.equipmentList)) {
          return parsed.equipmentList;
        }
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    let isMounted = true;
    getCachedWebsiteContent().then((content) => {
      if (isMounted && content?.equipmentList && Array.isArray(content.equipmentList)) {
        setEquipmentList(content.equipmentList);
      }
    });

    const unsub = subscribeToWebsiteContent((content) => {
      if (isMounted && content?.equipmentList && Array.isArray(content.equipmentList)) {
        setEquipmentList(content.equipmentList);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  if (equipmentList.length === 0) {
    return null;
  }

  return (
    <section className="py-6 sm:py-10 bg-[var(--bg-primary)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="container-box p-6 sm:p-8 space-y-6 rounded-3xl border border-[var(--color-border)] shadow-xs">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[var(--color-text)] tracking-tight">
                {language === 'hi' ? 'केन्द्र उपकरण व हार्डवेयर सेटअप' : 'Center Equipment & Hardware Setup'}
              </h3>
              <p className="text-xs text-[var(--color-muted-text)] font-semibold mt-0.5">
                Maa Vaishno e-World CSC Centre • Rairkalan, Panipat
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
              Rairkalan, Panipat
            </span>
          </div>

          {/* Equipment Grid: Only Pic and Name Below */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {equipmentList.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-[var(--bg-primary)] border border-[var(--color-border)] overflow-hidden flex flex-col shadow-xs hover:border-[#30AFFF]/60 transition-all duration-200 group"
              >
                {/* Photo */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-900">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Name Below */}
                <div className="p-3.5 sm:p-4 text-center">
                  <h4 className="text-xs sm:text-sm font-black text-[var(--color-text)] tracking-tight line-clamp-2" title={item.name}>
                    {item.name}
                  </h4>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
