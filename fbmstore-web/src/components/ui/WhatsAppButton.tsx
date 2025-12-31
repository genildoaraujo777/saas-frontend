import React from 'react';
import { FaWhatsapp } from "react-icons/fa"; // Certifique-se de ter react-icons instalado

export const WhatsAppButton = () => {
  // Substitua pelo número da sua empresa (DDI + DDD + Numero)
  const phoneNumber = "5511944688144"; 
  const message = "Olá! Vim pelo site da FBM Store e gostaria de tirar uma dúvida.";

  // Link oficial da API do WhatsApp
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a 
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={styles.container}
      aria-label="Falar no WhatsApp"
    >
      <FaWhatsapp size={32} color="#fff" />
      
      <span style={styles.text}>Fale Conosco</span>
    </a>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: '#25D366', // Verde oficial do WhatsApp
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
    cursor: 'pointer',
    zIndex: 9999, // Garante que fique acima de tudo
    transition: 'transform 0.3s ease-in-out',
    textDecoration: 'none',
  },
};