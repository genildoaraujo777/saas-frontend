import React from 'react';
import { useFooter } from '@/contexts/FooterContext';

export const Footer: React.FC = () => {
  const { rightsText, socialLinks } = useFooter();

  return (
    <footer className="w-full py-6 px-4 bg-gray-100 border-t flex flex-col items-center">
      <p className="text-gray-600 text-sm mb-4">{rightsText}</p>
      <div className="flex gap-4">
        <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600">Instagram</a>
        <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="text-blue-600">WhatsApp</a>
      </div>
    </footer>
  );
};