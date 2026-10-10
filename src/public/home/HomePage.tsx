import React from 'react';
import { HeroSection } from './HeroSection';
import { HowItWorksSection } from './HowItWorksSection';
import { Language } from '../../types';

interface HomePageProps {
  language: Language;
  onUploadClick: () => void;
  onSelectServiceForUpload: (serviceTitle: string) => void;
  onNavigateToServices: () => void;
  onNavigateToCommunity?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  language,
  onUploadClick,
  onSelectServiceForUpload,
  onNavigateToServices,
  onNavigateToCommunity,
}) => {
  return (
    <div className="space-y-6 py-4 w-full max-w-full overflow-x-hidden">
      <HeroSection
        language={language}
        onUploadClick={onUploadClick}
        onSelectServiceForUpload={onSelectServiceForUpload}
        onCommunityClick={onNavigateToCommunity}
        onExploreServicesClick={onNavigateToServices}
      />
      <HowItWorksSection language={language} />
    </div>
  );
};

export default HomePage;
