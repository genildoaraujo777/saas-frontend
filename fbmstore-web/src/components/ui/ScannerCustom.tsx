import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { MdClose, MdFlashOn, MdFlashOff } from 'react-icons/md';

export const ScannerCustom = ({ onScanSuccess, onClose }: { onScanSuccess: (data: string) => void, onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null); // 🚀 Ref para guardar a câmera
  
  const [error, setError] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);

  // 🚀 FUNÇÃO DA LANTERNA (Colocada aqui dentro do componente)
  const toggleFlash = async () => {
    const track = trackRef.current;
    if (!track) return;

    try {
      const capabilities = track.getCapabilities() as any; // 👈 O "any" resolve o erro ts(2339)
      
      if (capabilities.torch) {
        const novoEstado = !flashOn;
        await track.applyConstraints({
          advanced: [{ torch: novoEstado }] 
        } as any);
        setFlashOn(novoEstado);
      }
    } catch (err) {
      console.error("Erro ao alternar lanterna", err);
    }
  };

  useEffect(() => {
    let animationFrameId: number;
    let stream: MediaStream | null = null;

    const iniciarCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          const track = stream.getVideoTracks()[0];
          trackRef.current = track; // 🚀 Guarda para usar na lanterna

          // 🛠️ CONFIGURAÇÕES DE EXPOSIÇÃO (Corrigido com 'any')
          const capabilities = track.getCapabilities() as any;
          
          // Verifica se tem lanterna disponível
          if (capabilities.torch) setHasFlash(true);

          if (capabilities.exposureMode && capabilities.exposureMode.includes('continuous')) {
            await track.applyConstraints({
              advanced: [{ 
                exposureMode: 'continuous',
                exposureCompensation: 1.0 
              }]
            } as any);
          }

          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (err) {
        setError("Erro ao acessar a câmera. Verifique as permissões.");
      }
    };

    let frameCount = 0;
    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        frameCount++;

        if (context) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;

          // Ciclo de "Exposição Virtual" (HDR via Software)
          if (frameCount % 30 < 10) {
            context.filter = 'contrast(1.2) brightness(1.0) grayscale(100%)';
          } else if (frameCount % 30 < 20) {
            context.filter = 'contrast(1.8) brightness(1.2) grayscale(100%)';
          } else {
            context.filter = 'contrast(1.5) brightness(0.8) grayscale(100%)';
          }

          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth", 
          });

          if (code && code.data) {
            if (/fazenda|sefaz|nfe/i.test(code.data)) {
              if (navigator.vibrate) navigator.vibrate(200);
              onScanSuccess(code.data);
              return; 
            }
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
          <div style={{ display: 'flex', gap: '15px' }}>
            {/* Botão da Lanterna só aparece se o celular tiver flash */}
            {hasFlash && (
              <button onClick={toggleFlash} style={styles.iconBtn}>
                {flashOn ? <MdFlashOff size={24} color="#facc15" /> : <MdFlashOn size={24} />}
              </button>
            )}
            <button onClick={onClose} style={styles.iconBtn}><MdClose size={24}/></button>
          </div>
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
                <p style={styles.hint}>Centralize o QR Code no quadrado</p>
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
  iconBtn: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '5px' },
  videoBox: { flex: 1, position: 'relative', overflow: 'hidden' },
  video: { width: '100%', height: '100%', objectFit: 'cover' },
  overlayGuide: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  targetBox: { width: '250px', height: '250px', border: '2px solid #22c55e', borderRadius: '20px', boxShadow: '0 0 0 4000px rgba(0,0,0,0.5)' },
  hint: { color: '#fff', marginTop: '20px', fontSize: '14px', fontWeight: '500', textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  error: { color: '#ff4d4d', padding: '40px', textAlign: 'center' }
};