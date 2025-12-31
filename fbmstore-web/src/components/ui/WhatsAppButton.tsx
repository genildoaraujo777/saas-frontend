import React, { useState } from 'react';
import { FaWhatsapp } from "react-icons/fa";

export const WhatsAppButton = () => {
  // Substitua pelo número real
  const phoneNumber = "5511944688144"; 
  const message = "Olá! Vim pelo site da FBM Store e gostaria de tirar uma dúvida.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={styles.wrapper}>
      {/* Label "Fale Conosco" (Aparece ao lado) */}
      <div style={{
          ...styles.label,
          opacity: isHovered ? 1 : 0, // Opção A: Só aparece no hover (mais limpo)
          // opacity: 1,              // Opção B: Sempre visível (mais chamativo)
          visibility: isHovered ? 'visible' : 'hidden',
          transform: isHovered ? 'translateX(0)' : 'translateX(10px)',
        }}
      >
        Fale Conosco
      </div>

      <a 
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={styles.container}
        aria-label="Falar no WhatsApp"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <FaWhatsapp size={32} color="#fff" />
      </a>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end', // Garante alinhamento à direita
    gap: '12px', // Espaço entre o texto e o botão
  },
  container: {
    backgroundColor: '#25D366',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
    cursor: 'pointer',
    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s',
    textDecoration: 'none',
  },
  label: {
    backgroundColor: '#fff',
    color: '#0f172a', // Cor escura para contraste (padrão do seu app)
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    whiteSpace: 'nowrap', // Impede que o texto quebre linha
    transition: 'all 0.3s ease-in-out',
    // Pequena seta apontando para a direita (opcional, dá um charme)
    position: 'relative',
  }
};