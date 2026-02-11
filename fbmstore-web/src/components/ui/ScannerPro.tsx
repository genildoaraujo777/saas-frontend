import React, { useState } from 'react';
import jsQR from 'jsqr'; // Você já tem
import { MdPhotoCamera, MdClose } from 'react-icons/md';

export const ScannerPro = ({ onScanSuccess, onClose }: any) => {
  const [loading, setLoading] = useState(false);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (res) => {
      const image = new Image();
      image.src = res.target?.result as string;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(image, 0, 0);
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        
        // 🚀 O jsQR lê a foto perfeita tirada pela câmera nativa
        const code = jsQR(imageData!.data, imageData!.width, imageData!.height);
        
        if (code) {
          onScanSuccess(code.data);
        } else {
          alert("Não conseguimos ler o QR Code. Tente tirar a foto com o código bem centralizado e focado.");
        }
        setLoading(false);
      };
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Scanner Inteligente</h3>
          <button onClick={onClose} style={styles.closeBtn}><MdClose size={24} /></button>
        </div>
        
        <div style={styles.body}>
          <p style={styles.text}>Para um foco perfeito, use a câmera do seu celular.</p>
          
          <label style={{...styles.button, opacity: loading ? 0.6 : 1}}>
            {loading ? "PROCESSANDO..." : <><MdPhotoCamera size={24} /> ABRIR CÂMERA</>}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" // 🚀 ISSO CHAMA A CÂMERA NATIVA
              onChange={handleCapture} 
              style={{ display: 'none' }}
              disabled={loading}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  container: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '350px', padding: '20px', textAlign: 'center' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  body: { padding: '10px 0' },
  text: { fontSize: '14px', color: '#64748b', marginBottom: '25px' },
  button: { backgroundColor: '#3b82f6', color: '#fff', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)' }
};