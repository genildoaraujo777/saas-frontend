import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

export function ScannerNfce({ onScanSuccess }: ScannerProps) {
  useEffect(() => {
      // No seu ScannerNfce.tsx
    const scanner = new Html5QrcodeScanner(
        "reader", 
        { 
            fps: 20, 
            qrbox: { width: 280, height: 280 },
            // 🚀 ADICIONE ISTO: Força o suporte a múltiplos formatos em arquivos
            formatsToSupport: [ 0 ], // 0 é o código para QR_CODE
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true 
            },
            videoConstraints: {
            facingMode: { exact: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            focusMode: "continuous",
            } as any 
        },
        false
        );

    scanner.render(onScanSuccess, (error) => {
      // Erros de leitura silenciosos para não travar o vídeo
      console.warn("Erro ao ler QR Code:", error);
    });

    return () => {
      scanner.clear().catch(error => console.error("Erro ao limpar scanner", error));
    };
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      <div id="reader"></div>
      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        Aponte para o QR Code da Nota Fiscal
      </p>
    </div>
  );
}