import { useEffect, useRef, useState } from "react";
import ScanbotSDK from "scanbot-web-sdk";
import type { 
  IBarcodeScannerHandle, 
  BarcodeScannerViewConfiguration 
} from "scanbot-web-sdk/@types";

import { MdClose, MdPhotoLibrary, MdQrCodeScanner, MdArrowBack } from "react-icons/md";

const SCANNER_CONTAINER_ID = "barcode-scanner-container";

// 🚀 Removido o onError. Apenas o sucesso e o fechar.
export const ScannerCustom = ({ onScanSuccess, onClose }: { onScanSuccess: (data: string) => void, onClose: () => void }) => {
  const scannerHandle = useRef<IBarcodeScannerHandle | null>(null);
  const sdkRef = useRef<ScanbotSDK | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showCamera, setShowCamera] = useState(false);

  // 1. Inicializa o motor do Scanbot
  useEffect(() => {
    const initSDK = async () => {
      try {
        const sdk = await ScanbotSDK.initialize({
          licenseKey: "", 
          enginePath: "/wasm/", 
        });
        sdkRef.current = sdk;
      } catch (err) {
        console.error("Erro Scanbot:", err);
      }
    };
    initSDK();
    return () => { 
      scannerHandle.current?.dispose(); 
    };
  }, []);

  // 2. Lógica de disparo da câmera (com delay para o modal estabilizar)
  useEffect(() => {
    if (showCamera && sdkRef.current) {
      // 🚀 O SEGREDO: Esperamos 300ms para o modal terminar de abrir
      // e o DIV ter altura/largura real para o scanner conseguir ler os pixels.
      const timer = setTimeout(async () => {
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
          scannerHandle.current = await sdkRef.current!.createBarcodeScanner(config);
        } catch (e) {
          console.error("Erro ao abrir câmera:", e);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        scannerHandle.current?.dispose();
        scannerHandle.current = null;
      };
    }
  }, [showCamera, onScanSuccess]);

  const handleBack = () => {
    scannerHandle.current?.dispose();
    scannerHandle.current = null;
    setShowCamera(false);
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
        alert("Nota não encontrada na imagem.");
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
            <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Leitor de Notas</span>
          )}
        </div>
        <button onClick={onClose} style={styles.closeBtn}><MdClose size={28}/></button>
      </div>

      {!showCamera ? (
        <div style={styles.modalContent}>
           <div style={styles.selectionCard}>
              <p style={styles.title}>Como deseja capturar a nota?</p>
              <div style={styles.buttonGrid}>
                <button style={styles.actionCard} onClick={() => setShowCamera(true)}>
                  <div style={styles.iconCircle}><MdQrCodeScanner size={32} /></div>
                  <span style={{fontWeight: 'bold', fontSize: '0.8rem'}}>CÂMERA</span>
                </button>
                <button style={styles.actionCard} onClick={() => fileInputRef.current?.click()}>
                  <div style={styles.iconCircle}><MdPhotoLibrary size={32} /></div>
                  <span style={{fontWeight: 'bold', fontSize: '0.8rem'}}>ARQUIVO</span>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                </button>
              </div>
           </div>
        </div>
      ) : (
        <div id={SCANNER_CONTAINER_ID} style={styles.scannerContainer}></div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', flexDirection: 'column' },
  header: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' },
  modalContent: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  selectionCard: { backgroundColor: '#f8fafc', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '450px', textAlign: 'center' },
  iconBtn: { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' },
  closeBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' },
  title: { fontSize: '1rem', fontWeight: '700', marginBottom: '25px', color: '#1e293b' },
  buttonGrid: { display: 'flex', gap: '15px' },
  actionCard: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', cursor: 'pointer' },
  iconCircle: { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' },
  scannerContainer: { flex: 1, width: '100%', height: '100%', backgroundColor: '#000' },
};