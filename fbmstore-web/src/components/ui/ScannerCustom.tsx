import { useEffect, useRef, useState } from "react";
import ScanbotSDK from "scanbot-web-sdk";
import type { 
  IBarcodeScannerHandle, 
  BarcodeScannerViewConfiguration 
} from "scanbot-web-sdk/@types";

import { MdClose, MdPhotoLibrary, MdQrCodeScanner, MdArrowBack } from "react-icons/md";

const SCANNER_CONTAINER_ID = "barcode-scanner-container";

export const ScannerCustom = ({ onScanSuccess, onClose }: { onScanSuccess: (data: string) => void, onClose: () => void }) => {
  const scannerHandle = useRef<IBarcodeScannerHandle | null>(null);
  const sdkRef = useRef<ScanbotSDK | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initSDK = async () => {
      try {
        const sdk = await ScanbotSDK.initialize({
          licenseKey: "", 
          enginePath: "/wasm/", // 🚀 Adicione a barra inicial para ser absoluto
        });
        sdkRef.current = sdk;
      } catch (err) {
        setError("Erro ao carregar o motor Scanbot.");
      }
    };
    initSDK();
    return () => {
    // 🚀 Isso força o celular a desligar o hardware da câmera ao sair
    scannerHandle.current?.dispose(); 
    scannerHandle.current = null;
  };
}, []);

  // 🚀 FUNÇÃO PARA VOLTAR OU FECHAR
  const handleBack = () => {
    if (showCamera) {
      // Se a câmera está aberta, apenas desliga ela e volta para a seleção
      scannerHandle.current?.dispose();
      scannerHandle.current = null;
      setShowCamera(false);
    } else {
      // Se já está na seleção, fecha o componente de vez
      onClose();
    }
  };

  const startCamera = async () => {
    if (!sdkRef.current) return;
    setShowCamera(true);

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

    // Criamos o scanner vinculando ao ID do container
    scannerHandle.current = await sdkRef.current.createBarcodeScanner(config);
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
          {/* Mostra ícone de seta se estiver na câmera, ou o título normal se não */}
          {showCamera ? (
            <button onClick={handleBack} style={styles.iconBtn}><MdArrowBack size={24} /> Voltar</button>
          ) : (
            <span style={{ fontWeight: 'bold' }}>Scanner FBM Store</span>
          )}
        </div>
        <button onClick={onClose} style={styles.closeBtn} title="Fechar tudo"><MdClose size={28}/></button>
      </div>

      {!showCamera ? (
        <div style={styles.selectionBody}>
          <p style={styles.title}>Como deseja ler a nota?</p>
          <div style={styles.buttonGrid}>
            <button style={styles.actionCard} onClick={startCamera}>
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
          {/* O Scanbot renderiza o vídeo aqui dentro automaticamente */}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: '#f8fafc', zIndex: 9999, display: 'flex', flexDirection: 'column', color: '#1e293b' },
  header: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' },
  iconBtn: { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', fontSize: '16px' },
  closeBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' },
  selectionBody: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  title: { fontSize: '18px', fontWeight: '600', marginBottom: '30px' },
  buttonGrid: { display: 'flex', gap: '20px', width: '100%', maxWidth: '450px' },
  actionCard: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '30px 20px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
  iconCircle: { width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' },
  scannerContainer: { flex: 1, position: 'relative', backgroundColor: '#000' },
};