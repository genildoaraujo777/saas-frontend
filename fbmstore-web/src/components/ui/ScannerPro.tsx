import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import jsQR from 'jsqr';
import { MdCameraAlt, MdPhotoLibrary, MdClose } from 'react-icons/md';

interface ScannerProProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const ScannerPro = ({ onScanSuccess, onClose }: ScannerProProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<'camera' | 'file'>('camera');
  const reader = new BrowserMultiFormatReader();

  // --- Lógica da Câmera (ZXing) ---
  useEffect(() => {
    if (mode === 'camera' && videoRef.current) {
      // Usa null para pegar a câmera padrão
      reader.decodeFromVideoDevice(null, videoRef.current, (result) => {
        if (result) {
          onScanSuccess(result.getText());
        }
      });
    }
    return () => reader.reset();
  }, [mode, onScanSuccess]);

  // --- Lógica de Arquivo (jsQR) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imgReader = new FileReader();
    imgReader.onload = (res) => {
        const image = new Image();
        image.src = res.target?.result as string;
        image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // 🚀 REDIMENSIONAMENTO ESTRATÉGICO
        // Se a foto for gigante, o jsQR falha. Limitamos a 800px.
        const scale = Math.min(1, 800 / Math.max(image.width, image.height));
        canvas.width = image.width * scale;
        canvas.height = image.height * scale;
        
        if (ctx) {
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            
            // 🚀 FILTRO DE CONTRASTE (Opcional, mas ajuda muito)
            // ctx.filter = 'grayscale(100%) contrast(120%)'; 

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert", // Aumenta a velocidade
            });
            
            if (code) {
            onScanSuccess(code.data);
            } else {
            // Se falhou no tamanho reduzido, tentamos no tamanho original como última chance
            alert("Não detectado. Tente tirar a foto mais de cima e sem reflexos.");
            }
        }
        };
    };
    imgReader.readAsDataURL(file);
    };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Scanner de Nota Fiscal</h3>
          <button onClick={onClose} style={styles.closeBtn}><MdClose size={24}/></button>
        </div>

        {mode === 'camera' ? (
          <div style={styles.videoWrapper}>
            <video ref={videoRef} style={styles.video} />
            <div style={styles.scanRegion} />
          </div>
        ) : (
          <div style={styles.fileArea}>
            <p>Selecione a foto da nota fiscal:</p>
            <input type="file" accept="image/*" onChange={handleFileUpload} style={styles.fileInput} />
            <div style={styles.tip}>Dica: Evite reflexos e sombras sobre o QR Code.</div>
          </div>
        )}

        <div style={styles.footer}>
          <button 
            onClick={() => setMode('camera')} 
            style={{ ...styles.modeBtn, opacity: mode === 'camera' ? 1 : 0.5 }}
          >
            <MdCameraAlt size={20} /> Câmera
          </button>
          {/* Botão que chama a Câmera Nativa do Celular */}
<label style={styles.nativeBtn}>
    <MdCameraAlt size={24} />
    <span>USAR CÂMERA NATIVA</span>
    <input 
        type="file" 
        accept="image/*" 
        capture="environment" // 🚀 A MÁGICA ESTÁ AQUI
        onChange={handleFileUpload} // Usa a mesma lógica do jsQR que já fizemos
        style={{ display: 'none' }} 
    />
</label>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' },
  container: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '450px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  header: { padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
  videoWrapper: { position: 'relative', backgroundColor: '#000', width: '100%', aspectRatio: '1/1' },
  video: { width: '100%', height: '100%', objectFit: 'cover' },
  scanRegion: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '220px', height: '220px', border: '3px solid #22c55e', borderRadius: '16px', boxShadow: '0 0 0 4000px rgba(0,0,0,0.4)' },
  fileArea: { padding: '40px 20px', textAlign: 'center', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  fileInput: { padding: '10px', width: '100%', marginBottom: '15px' },
  tip: { fontSize: '12px', color: '#94a3b8' },
  footer: { padding: '15px', display: 'flex', gap: '10px', backgroundColor: '#f8fafc' },
  modeBtn: { flex: 1, padding: '12px', border: 'none', borderRadius: '8px', backgroundColor: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }
};