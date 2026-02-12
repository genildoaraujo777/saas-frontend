import React, { useState } from 'react';
import { MdClose, MdPlayCircleOutline, MdPhotoCamera } from 'react-icons/md';
import abrircomchrome from '../../assets/images/abrircomchrome.png';
import tuto_sefaz from '../../assets/videos/tuto_sefaz.mp4';

export const GuiaSefaz = ({ onClose }: { onClose: () => void }) => {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <button onClick={onClose} style={styles.close}><MdClose size={24}/></button>
        
        <h3 style={{ color: '#1e293b', marginBottom: '15px' }}>Tutorial de Captura</h3>

        {/* --- PASSO 1: ABRIR CÂMERA --- */}
        <div style={styles.step}>
          <div style={styles.badge}>1</div>
          <p>Minimize o navegador e abra o app de **Câmera** do seu celular.</p>
        </div>

        {/* --- PASSO 2: SITE DA FAZENDA --- */}
        <div style={styles.step}>
          <div style={styles.badge}>2</div>
          <p>Aponte para o QR Code e entre no site da **Fazenda**.</p>
        </div>
        {/* Imagem que você salvou para orientar o usuário */}
        <img src={abrircomchrome} alt="Instrução Chrome" style={styles.previewImg} />

        <div style={styles.step}>
          <div style={styles.badge}>3</div>
          <p>Selecione toda a página e copie os dados e volte aqui para **Colar os dados**.</p>
        </div>

        {/* --- SEÇÃO DE VÍDEO --- */}
        <div style={styles.videoSection}>
          <button 
            onClick={() => setShowVideo(!showVideo)} 
            style={styles.videoBtn}
          >
            <MdPlayCircleOutline size={22} />
            {showVideo ? "OCULTAR TUTORIAL" : "VER VÍDEO EXPLICATIVO"}
          </button>
        </div>

        {showVideo && (
          <div style={styles.videoWrapper}>
            <video controls style={{ width: '100%', borderRadius: '12px' }}>
              <source src={tuto_sefaz} type="video/mp4" />
              Seu navegador não suporta vídeos.
            </video>
          </div>
        )}

        <button onClick={onClose} style={styles.entendidoBtn}>
          ENTENDI, VAMOS LÁ!
        </button>
      </div>
    </div>
  );
};

// 🚀 O FIX PARA O ERRO ts(2322): Tipamos como React.CSSProperties
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backdropFilter: 'blur(4px)' // Efeito de desfoque elegante no fundo
  },
  card: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '24px',
    // 🚀 O SEGREDO DA ADAPTAÇÃO:
    width: '95%', 
    maxWidth: '500px', // Aumentado para preencher melhor telas grandes
    maxHeight: '85vh',
    overflowY: 'auto',
    textAlign: 'center',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  close: { 
    position: 'absolute', 
    top: '15px', 
    right: '15px', 
    background: '#f1f5f9', 
    border: 'none', 
    borderRadius: '50%', 
    width: '32px', 
    height: '32px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    cursor: 'pointer',
    color: '#64748b'
  },
  step: { 
    display: 'flex', 
    alignItems: 'flex-start', // Alinhado ao topo para textos longos
    textAlign: 'left', 
    gap: '15px', 
    marginTop: '25px',
    lineHeight: '1.5' // Melhor leitura em telas grandes
  },
  badge: { 
    backgroundColor: '#3b82f6', 
    color: '#fff', 
    width: '28px', 
    height: '28px', 
    borderRadius: '50%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontWeight: 'bold', 
    flexShrink: 0, 
    fontSize: '14px' 
  },
  previewImg: { 
    width: '100%', 
    maxWidth: '400px', // Evita que a imagem de exemplo fique gigante no desktop
    borderRadius: '12px', 
    marginTop: '15px', 
    border: '1px solid #e2e8f0',
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  videoSection: { 
    margin: '25px 0', 
    borderTop: '1px solid #eee', 
    paddingTop: '20px' 
  },
  videoBtn: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px', 
    width: '100%', 
    padding: '14px', 
    background: '#eff6ff', // Azul clarinho para destacar
    border: '1px solid #bfdbfe', 
    borderRadius: '12px', 
    color: '#2563eb', 
    fontWeight: '700', 
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  videoWrapper: { 
    marginBottom: '20px', 
    borderRadius: '16px', 
    overflow: 'hidden', 
    backgroundColor: '#000',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
  },
  entendidoBtn: { 
    width: '100%', 
    padding: '18px', 
    backgroundColor: '#22c55e', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '14px', 
    fontWeight: '800', 
    fontSize: '16px', 
    cursor: 'pointer', 
    marginTop: '10px',
    boxShadow: '0 4px 6px -1px rgba(34, 197, 94, 0.4)'
  }
};