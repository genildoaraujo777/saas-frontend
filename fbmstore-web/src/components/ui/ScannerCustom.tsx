import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { MdClose } from 'react-icons/md';

export const ScannerCustom = ({ onScanSuccess, onClose }: { onScanSuccess: (data: string) => void, onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    let stream: MediaStream | null = null;

    const iniciarCamera = async () => {
      try {
        // 1. Abre a câmera nativa via Navegador 
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true"); // Requisito para iOS
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (err) {
        setError("Não foi possível acessar a câmera. Verifique as permissões.");
      }
    };

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (context) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // 2. Extrai os pixels da imagem
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          // 3. O jsQR faz a matemática pesada 
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            onScanSuccess(code.data);
            return; // Para o loop se encontrar
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    iniciarCamera();

    return () => {
      cancelAnimationFrame(animationFrameId);
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [onScanSuccess]);

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={{ fontWeight: 'bold' }}>Scanner FBM Store</span>
          <button onClick={onClose} style={styles.closeBtn}><MdClose size={24}/></button>
        </div>

        <div style={styles.videoBox}>
          {error ? (
            <div style={styles.error}>{error}</div>
          ) : (
            <>
              <video ref={videoRef} style={styles.video} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div style={styles.overlayGuide}>
                <div style={styles.targetBox} />
                <p style={styles.hint}>Aponte para o QR Code da nota</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  container: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column' },
  header: { padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  closeBtn: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer' },
  videoBox: { flex: 1, position: 'relative', overflow: 'hidden' },
  video: { width: '100%', height: '100%', objectFit: 'cover' },
  overlayGuide: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  targetBox: { width: '250px', height: '250px', border: '2px solid #22c55e', borderRadius: '20px', boxShadow: '0 0 0 4000px rgba(0,0,0,0.5)' },
  hint: { color: '#fff', marginTop: '20px', fontSize: '14px', fontWeight: '500', textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  error: { color: '#ff4d4d', padding: '40px', textAlign: 'center' }
};