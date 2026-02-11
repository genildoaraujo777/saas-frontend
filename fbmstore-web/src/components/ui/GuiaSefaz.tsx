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
    padding: '20px'
  },
  card: {
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '380px',
    maxHeight: '90vh',
    overflowY: 'auto',
    textAlign: 'center',
    position: 'relative'
  },
  close: { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer' },
  step: { display: 'flex', alignItems: 'center', textAlign: 'left', gap: '12px', marginTop: '20px' },
  badge: { backgroundColor: '#3b82f6', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, fontSize: '12px' },
  previewImg: { width: '100%', borderRadius: '12px', marginTop: '10px', border: '1px solid #e2e8f0' },
  videoSection: { margin: '20px 0', borderTop: '1px solid #eee', paddingTop: '15px' },
  videoBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#475569', fontWeight: '600', cursor: 'pointer' },
  videoWrapper: { marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000' },
  entendidoBtn: { width: '100%', padding: '15px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }
};