import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { Language } from '../../types';

interface FaqPageProps {
  language: Language;
}

export const FaqPage: React.FC<FaqPageProps> = ({ language }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: language === 'hi' ? 'क्या दस्तावेज अपलोड करने का कोई शुल्क है?' : 'Is there any fee to upload documents online?',
      a: language === 'hi' ? 'जी नहीं, दस्तावेज ऑनलाइन अपलोड करना बिल्कुल नि:शुल्क और सुरक्षित है। आप केंद्र पर आकर केवल प्रिंट या सरकारी सेवा का आधिकारिक शुल्क देते हैं।' : 'No, uploading your documents online is 100% free and secure. You only pay standard printing or government application charges at the Kendra counter.',
    },
    {
      q: language === 'hi' ? 'व्हाट्सएप की तुलना में यह पोर्टल कितना सुरक्षित है?' : 'How is this portal safer than sending files on WhatsApp?',
      a: language === 'hi' ? 'व्हाट्सएप पर फाइलें व्यक्ति के फोन गैलरी में जमा हो जाती हैं। इस पोर्टल में आपकी फाइलें एन्क्रिप्टेड प्राइवेट स्टोरेज में रहती हैं और काम पूरा होने के बाद ऑटो-डिलीट हो जाती हैं।' : 'WhatsApp stores sensitive document photos in phone galleries. This portal uses encrypted server storage, virus magic-byte scanning, and strict auto-purge policies to protect citizen identity.',
    },
    {
      q: language === 'hi' ? 'अपलोड के बाद मुझे प्रिंटआउट कैसे मिलेगा?' : 'How do I collect my prints after uploading?',
      a: language === 'hi' ? 'अपलोड पूरा होते ही आपको एक सबमिशन आईडी और क्यूआर कोड मिलता है। अटल सेवा केंद्र काउंटर पर क्यूआर कोड दिखाएं और तुरंत प्रिंट प्राप्त करें।' : 'Upon upload, you get a unique Submission Tracking ID and QR ticket. Show the QR ticket at the Kendra counter for instant printing without waiting in queue.',
    },
    {
      q: language === 'hi' ? 'कौन-कौन से फाइल फॉर्मेट समर्थित हैं?' : 'Which file formats are supported?',
      a: language === 'hi' ? 'आप PDF, DOC, DOCX, PNG, JPG, JPEG, WEBP, TXT और ZIP फाइलें (अधिकतम 25MB) अपलोड कर सकते हैं।' : 'You can upload PDF, DOC, DOCX, PNG, JPG, JPEG, WEBP, TXT, and ZIP files up to 25MB each.',
    },
    {
      q: language === 'hi' ? 'क्या मैं अपने सबमिशन की स्थिति ट्रैक कर सकता हूं?' : 'Can I track the status of my uploaded document?',
      a: language === 'hi' ? 'हां, आप मुख्य मेनू में "ट्रैक सबमिशन" पर क्लिक करके और अपनी 10-अंकीय सबमिशन आईडी (जैसे ASK-2026-XXXXXX) या मोबाइल नंबर दर्ज करके स्थिति देख सकते हैं।' : 'Yes! Click "Track Status" in the top navigation and enter your Submission ID or mobile number to see real-time operator progress.',
    },
  ];

  return (
    <div className="py-16 bg-[var(--bg-primary)] min-h-[70vh] w-full max-w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FFE2E2] dark:bg-[#3A3A3A] text-xs font-bold text-[var(--color-text)]">
            <HelpCircle className="w-4 h-4 text-[#C5B3D3]" />
            <span>Citizen Knowledge Base</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text)] tracking-tight">
            {language === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न (FAQ)' : 'Frequently Asked Questions'}
          </h1>
          <p className="text-sm text-[var(--color-muted-text)] font-medium">
            {language === 'hi' ? 'अटल सेवा केंद्र दस्तावेज अपलोड पोर्टल के बारे में सामान्य प्रश्न और उत्तर।' : 'Clear answers regarding document privacy, counter pick-up, and supported formats.'}
          </p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-[var(--color-border)] rounded-2xl overflow-hidden bg-[var(--bg-primary)] transition-all"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full p-5 text-left font-bold text-sm text-[var(--color-text)] flex items-center justify-between gap-4"
              >
                <span>{faq.q}</span>
                {openIndex === idx ? (
                  <ChevronUp className="w-5 h-5 text-[#C5B3D3] shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[var(--color-muted-text)] shrink-0" />
                )}
              </button>

              {openIndex === idx && (
                <div className="px-5 pb-5 text-xs text-[var(--color-muted-text)] leading-relaxed border-t border-[var(--color-border)] pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default FaqPage;
