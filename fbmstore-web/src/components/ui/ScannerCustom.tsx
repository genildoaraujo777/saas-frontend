import { useEffect, useRef, useState } from "react";
import ScanbotSDK from "scanbot-web-sdk";
import type { 
  IBarcodeScannerHandle, 
  BarcodeScannerViewConfiguration 
} from "scanbot-web-sdk/@types";

import { MdClose, MdPhotoLibrary, MdQrCodeScanner, MdArrowBack } from "react-icons/md";

// ID do container onde o vídeo será renderizado
const SCANNER_CONTAINER_ID = "barcode-scanner-container";

export const ScannerCustom = ({ onScanSuccess, onClose }: { onScanSuccess: (data: string) => void, onClose: () => void }) => {
  const scannerHandle = useRef<IBarcodeScannerHandle | null>(null);
  const sdkRef = useRef<ScanbotSDK | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initScanner = async () => {
      try {
        // 1. Inicializa o SDK
        const sdk = await ScanbotSDK.initialize({
          licenseKey: "", // Deixe vazio para o trial de 1 minuto
          enginePath: "/wasm/", // Certifique-se de que os arquivos .wasm estão na pasta public/wasm/
        });
        sdkRef.current = sdk;

        // 2. Configura e cria o scanner de câmera
        const config: BarcodeScannerViewConfiguration = {
              containerId: SCANNER_CONTAINER_ID,
              onBarcodesDetected: (result) => {
                const barcode = result.barcodes[0];
                if (barcode && /fazenda|sefaz|nfe/i.test(barcode.text)) {
                  onScanSuccess(barcode.text);
                }
              },
              scannerConfiguration: {
                barcodeFormatConfigurations: [
                  { 
                    _type: "BarcodeFormatCommonConfiguration", 
                    formats: ["QR_CODE"], 
                    strictMode: true 
                  }
                ],
                engineMode: "NEXT_GEN" as any
              }
            };

        scannerHandle.current = await sdk.createBarcodeScanner(config);
      } catch (err) {
        setError("Erro ao inicializar o motor de busca Scanbot.");
        console.error(err);
      }
    };

    initScanner();

    return () => {
      // 3. Limpa a instância ao fechar
      scannerHandle.current?.dispose();
    };
  }, [onScanSuccess]);

  // --- PLANO B: Detecção em Arquivos usando o Motor Scanbot ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sdkRef.current) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageDataUrl = event.target?.result as string;
      const result = await sdkRef.current!.detectBarcodes(imageDataUrl);
      const barcode = result.barcodes[0];

      if (barcode && /fazenda|sefaz|nfe/i.test(barcode.text)) {
        onScanSuccess(barcode.text);
      } else {
        alert("Nenhuma Nota Fiscal detectada na imagem.");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.header}>
        <span style={{ fontWeight: 'bold' }}>Scanbot Engine Active</span>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button onClick={() => fileInputRef.current?.click()} style={styles.iconBtn}>
            <MdPhotoLibrary size={26} />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </button>
          <button onClick={onClose} style={styles.iconBtn}><MdClose size={28}/></button>
        </div>
      </div>

      <div id={SCANNER_CONTAINER_ID} style={styles.scannerContainer}>
        {error && <div style={styles.error}>{error}</div>}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed' as const, inset: 0, backgroundColor: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column' },
  header: { padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, background: 'rgba(0,0,0,0.7)' },
  iconBtn: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer' },
  scannerContainer: { flex: 1, width: '100%', height: '100%' },
  error: { color: '#ff4d4d', padding: '40px', textAlign: 'center' }
};