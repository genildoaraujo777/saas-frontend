import React, { createContext, useContext, useState } from 'react';

interface SocialLinks {
  instagram: string;
  whatsapp: string;
  facebook?: string;
}

interface FooterContextType {
  rightsText: string;
  socialLinks: SocialLinks;
  contactEmail: string;
}

const FooterContext = createContext<FooterContextType | undefined>(undefined);

export const FooterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [footerData] = useState<FooterContextType>({
    rightsText: `© ${new Date().getFullYear()} FBMSTORE. Todos os direitos reservados.`,
    contactEmail: 'frontbackmobile@gmail.com',
    socialLinks: {
      instagram: 'https://instagram.com/fbmdev',
      whatsapp: 'https://wa.me/5511944688144',
      facebook: 'https://facebook.com/fbmstore'
    }
  });

  return (
    <FooterContext.Provider value={footerData}>
      {children}
    </FooterContext.Provider>
  );
};

export const useFooter = () => {
  const context = useContext(FooterContext);
  if (!context) throw new Error('useFooter must be used within a FooterProvider');
  return context;
};