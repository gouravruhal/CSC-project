import React from 'react';
import { AboutContactSection } from '../shared/AboutContactSection';
import { Language } from '../../types';

interface ContactPageProps {
  language: Language;
}

export const ContactPage: React.FC<ContactPageProps> = ({ language }) => {
  return (
    <div className="py-8 w-full max-w-full overflow-x-hidden">
      <AboutContactSection language={language} />
    </div>
  );
};

export default ContactPage;
