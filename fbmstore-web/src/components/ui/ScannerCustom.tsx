import { useEffect, useRef, useState } from "react";
import ScanbotSDK from "scanbot-web-sdk";
import type { 
  IBarcodeScannerHandle, 
  BarcodeScannerViewConfiguration 
} from "scanbot-web-sdk/@types";

import { MdClose, MdPhotoLibrary, MdQrCodeScanner, MdArrowBack } from "react-icons/md";

const SCANNER_CONTAINER_ID = "barcode-scanner-container";

// 🚀 Adicionei '?' no onError para ele ser opcional e não quebrar o build
export const ScannerCustom = ({ onScanSuccess, onClose, onError }: { onScanSuccess: (data: string) => void, onClose: () => void, onError?: () => void }) => {
  const scannerHandle = useRef<IBarcodeScannerHandle | null>(null);
  const sdkRef = useRef<ScanbotSDK | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Inicializa o motor (Exatamente o código que você confirmou que funciona)
  useEffect(() => {
    const initSDK = async () => {
      try {
        const sdk = await ScanbotSDK.initialize({
          licenseKey: "", 
          enginePath: "/wasm/", 
        });
        sdkRef.current = sdk;
      } catch (err) {
        setError("Erro ao carregar o motor Scanbot.");
        if (onError) onError();
      }
    };
    initSDK();
    return () => { 
      scannerHandle.current?.dispose(); 
      scannerHandle.current = null;
    };
  }, [onError]);

  // 2. 🚀 LIGA A CÂMERA DE FORMA SEGURA
  useEffect(() => {
    const launchCamera = async () => {
      // SÓ LIGA se o usuário clicou no botão e o SDK está pronto
      if (showCamera && sdkRef.current && !scannerHandle.current) {
        try {
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

          // O motor agora encontrará o container pois o useEffect roda APÓS o render
          scannerHandle.current = await sdkRef.current.createBarcodeScanner(config);
        } catch (err) {
          console.warn("Câmera indisponível");
          if (onError) onError(); 
        }
      }
    };
    launchCamera();
  }, [showCamera, onScanSuccess, onError]);

  const handleBack = () => {
    if (showCamera) {
      scannerHandle.current?.dispose();
      scannerHandle.current = null;
      setShowCamera(false);
    } else {
      onClose();
    }
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {showCamera ? (
            <button onClick={handleBack} style={styles.iconBtn}><MdArrowBack size={24} /> Voltar</button>
          ) : (
            <span style={{ fontWeight: 'bold' }}>Scanner FBM Store</span>
          )}
        </div>
        <button onClick={onClose} style={styles.closeBtn}><MdClose size={28}/></button>
      </div>

      {!showCamera ? (
        // 🚀 LAYOUT DE ESCOLHA (BOTÕES GRANDES)
        <div style={styles.selectionBody}>
          <p style={styles.title}>Como deseja ler a nota?</p>
          <div style={styles.buttonGrid}>
            <button style={styles.actionCard} onClick={() => setShowCamera(true)}>
              <div style={styles.iconCircle}><MdQrCodeScanner size={40} /></div>
              <span>Usar Câmera</span>
            </button>
            <button style={styles.actionCard} onClick={() => fileInputRef.current?.click()}>
              <div style={styles.iconCircle}><MdPhotoLibrary size={40} /></div>
              <span>Galeria / Arquivo</span>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </button>
          </div>
        </div>
      ) : (
        <div id={SCANNER_CONTAINER_ID} style={styles.scannerContainer}>
          {error && <div style={{color: 'red', padding: '20px'}}>{error}</div>}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'absolute', inset: 0, backgroundColor: '#f8fafc', zIndex: 10, display: 'flex', flexDirection: 'column', color: '#1e293b', borderRadius: '12px', overflow: 'hidden' },
  header: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' },
  iconBtn: { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' },
  closeBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' },
  selectionBody: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  title: { fontSize: '18px', fontWeight: '600', marginBottom: '30px' },
  buttonGrid: { display: 'flex', gap: '20px', width: '100%', maxWidth: '450px' },
  actionCard: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '30px 20px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
  iconCircle: { width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' },
  scannerContainer: { flex: 1, position: 'relative', backgroundColor: '#000' },
};