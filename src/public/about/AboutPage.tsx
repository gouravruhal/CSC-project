import React from 'react';
import { AboutContactSection } from '../shared/AboutContactSection';
import { Language } from '../../types';

interface AboutPageProps {
  language: Language;
}

export const AboutPage: React.FC<AboutPageProps> = ({ language }) => {
  return (
    <div className="py-8 w-full max-w-full overflow-x-hidden">
      <AboutContactSection language={language} />
    </div>
  );
};

export default AboutPage;
