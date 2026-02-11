import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

export function ScannerNfce({ onScanSuccess }: ScannerProps) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
        "reader", 
        { 
            fps: 20, 
            qrbox: { width: 280, height: 280 }, 
            aspectRatio: 1.0,
            videoConstraints: {
            facingMode: { exact: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            // ✅ O "as any" avisa o TypeScript para ignorar a regra aqui
            focusMode: "continuous",
            } as any 
        },
        false
        );

    scanner.render(onScanSuccess, (error) => {
      // Erros de leitura silenciosos para não travar o vídeo
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