import React, { useEffect, useRef, useState } from 'react';
import { MdClose } from 'react-icons/md';

export const ScannerPro = ({ onScanSuccess, onClose }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stream: MediaStream;

    const startScanner = async () => {
      try {
        // 1. Pede a câmera em alta resolução para o foco não falhar
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();

          // 2. VERIFICA SE O CELULAR TEM O SCANNER NATIVO DO GOOGLE
          if (!('BarcodeDetector' in window)) {
            setError("Seu navegador não suporta o Scanner Nativo. Use o modo arquivo.");
            return;
          }

          // @ts-ignore (O TS ainda não conhece essa API nativa perfeitamente)
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

          // 3. Loop de detecção ultra-rápido
          const detect = async () => {
            if (videoRef.current && stream.active) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  onScanSuccess(barcodes[0].rawValue); // Sucesso instantâneo!
                  return; // Para o loop
                }
                requestAnimationFrame(detect);
              } catch (e) {
                requestAnimationFrame(detect);
              }
            }
          };
          detect();
        }
      } catch (err) {
        setError("Erro ao acessar a câmera.");
      }
    };

    startScanner();
    return () => stream?.getTracks().forEach(track => track.stop());
  }, [onScanSuccess]);

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.header}>
          <span>Scanner Turbo (Nativo)</span>
          <button onClick={onClose} style={styles.close}><MdClose size={24}/></button>
        </div>
        <div style={styles.videoBox}>
          <video ref={videoRef} style={styles.video} playsInline />
          <div style={styles.target} /> {/* Mira verde */}
          {error && <div style={styles.error}>{error}</div>}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  container: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column' },
  header: { padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', zIndex: 10 },
  videoBox: { position: 'relative', flex: 1, overflow: 'hidden' },
  video: { width: '100%', height: '100%', objectFit: 'cover' },
  target: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '250px', height: '250px', border: '3px solid #22c55e', borderRadius: '20px' },
  close: { background: 'none', border: 'none', color: '#fff' },
  error: { position: 'absolute', bottom: '20px', width: '100%', textAlign: 'center', color: '#ff4d4d' }
};