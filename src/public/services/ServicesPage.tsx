import React from 'react';
import { ServicesSection } from './ServicesSection';
import { Language } from '../../types';

interface ServicesPageProps {
  language: Language;
  onSelectService?: (serviceTitle: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({
  language,
  onSelectService,
}) => {
  return (
    <div className="py-4 w-full max-w-full overflow-x-hidden">
      <ServicesSection
        language={language}
        onSelectService={onSelectService}
      />
    </div>
  );
};

export default ServicesPage;
