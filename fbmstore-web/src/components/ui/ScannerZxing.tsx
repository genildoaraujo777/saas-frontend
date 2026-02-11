import { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

export function ScannerZxing({ onScanSuccess }: { onScanSuccess: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reader = new BrowserMultiFormatReader();

  useEffect(() => {
    // 🚀 O FIX: Trocamos undefined por null para usar a câmera padrão
    if (videoRef.current) {
      reader.decodeFromVideoDevice(null, videoRef.current, (result, error) => {
        if (result) {
          onScanSuccess(result.getText());
        }
        // O erro (error) pode ser ignorado pois ele dispara a cada frame sem código
      });
    }

    return () => reader.reset();
  }, [onScanSuccess]);

  return (
    <div style={{ position: 'relative', width: '100%', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
      <video ref={videoRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
      {/* Moldura verde de foco para o usuário saber onde apontar */}
      <div style={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
          width: '220px', height: '220px', border: '3px solid #22c55e', borderRadius: '16px', 
          pointerEvents: 'none', boxShadow: '0 0 0 4000px rgba(0,0,0,0.3)' 
      }} />
    </div>
  );
}