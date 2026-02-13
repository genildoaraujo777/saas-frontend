// import { useEffect, useRef, useState } from "react";
// import ScanbotSDK from "scanbot-web-sdk";
// import type { 
//   IBarcodeScannerHandle, 
//   BarcodeScannerViewConfiguration 
// } from "scanbot-web-sdk/@types";

// import { MdClose, MdPhotoLibrary, MdQrCodeScanner, MdArrowBack } from "react-icons/md";

// const SCANNER_CONTAINER_ID = "barcode-scanner-container";

// // 🚀 O '?' no onError resolve o seu erro de Build no Docker
// export const ScannerCustom = ({ onScanSuccess, onClose, onError }: { onScanSuccess: (data: string) => void, onClose: () => void, onError?: () => void }) => {
//   const scannerHandle = useRef<IBarcodeScannerHandle | null>(null);
//   const sdkRef = useRef<ScanbotSDK | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);
  
//   const [showCamera, setShowCamera] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // 1. Inicializa o motor Scanbot (Exatamente como na sua versão que funcionava)
//   useEffect(() => {
//     const initSDK = async () => {
//       try {
//         const sdk = await ScanbotSDK.initialize({
//           licenseKey: "", 
//           enginePath: "/wasm/", // Caminho absoluto para evitar erro no celular
//         });
//         sdkRef.current = sdk;
//       } catch (err) {
//         setError("Erro ao carregar motor de busca.");
//         if (onError) onError();
//       }
//     };
//     initSDK();
//     return () => { 
//       scannerHandle.current?.dispose(); 
//       scannerHandle.current = null;
//     };
//   }, [onError]);

//   // 2. Liga a câmera quando o usuário escolhe "Usar Câmera"
//   useEffect(() => {
//     const launchCamera = async () => {
//       if (showCamera && sdkRef.current && !scannerHandle.current) {
//         // Pequeno delay para garantir que o Modal terminou de abrir e o DIV existe no DOM
//         setTimeout(async () => {
//           try {
//             // 🚀 Usando a configuração direta que você confirmou que funciona
//             const config: any = {
//               containerId: SCANNER_CONTAINER_ID,
//               onBarcodesDetected: (result: any) => {
//                 const barcode = result.barcodes[0];
//                 if (barcode && /fazenda|sefaz|nfe/i.test(barcode.text)) {
//                   onScanSuccess(barcode.text);
//                 }
//               },
//               scannerConfiguration: {
//                 barcodeFormats: ["QR_CODE"],
//                 engineMode: "NEXT_GEN", 
//               }
//             };

//             scannerHandle.current = await sdkRef.current!.createBarcodeScanner(config);
//           } catch (err) {
//             console.error(err);
//             if (onError) onError();
//           }
//         }, 100);
//       }
//     };
//     launchCamera();
//   }, [showCamera, onScanSuccess, onError]);

//   const handleBack = () => {
//     if (showCamera) {
//       scannerHandle.current?.dispose();
//       scannerHandle.current = null;
//       setShowCamera(false);
//     } else {
//       onClose();
//     }
//   };

//   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file || !sdkRef.current) return;
//     const reader = new FileReader();
//     reader.onload = async (event) => {
//       const imageDataUrl = event.target?.result as string;
//       const result = await sdkRef.current!.detectBarcodes(imageDataUrl);
//       const barcode = result.barcodes[0];
//       if (barcode && /fazenda|sefaz|nfe/i.test(barcode.text)) {
//         onScanSuccess(barcode.text);
//       } else {
//         alert("Nenhum QR Code de Nota Fiscal encontrado no arquivo.");
//       }
//     };
//     reader.readAsDataURL(file);
//   };

//   return (
//     <div style={styles.overlay}>
//       <div style={styles.header}>
//         <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//           {showCamera && (
//             <button onClick={handleBack} style={styles.iconBtn}><MdArrowBack size={24} /> Voltar</button>
//           )}
//           {!showCamera && <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Scanner de Notas</span>}
//         </div>
//         <button onClick={onClose} style={styles.closeBtn}><MdClose size={28}/></button>
//       </div>

//       {!showCamera ? (
//         // 🚀 SELETOR CENTRALIZADO (MODAL)
//         <div style={styles.modalContent}>
//            <div style={styles.selectionCard}>
//               <p style={styles.title}>Como deseja capturar a nota?</p>
//               <div style={styles.buttonGrid}>
//                 <button style={styles.actionCard} onClick={() => setShowCamera(true)}>
//                   <div style={styles.iconCircle}><MdQrCodeScanner size={32} /></div>
//                   <span style={{fontWeight: 'bold', fontSize: '0.85rem'}}>CÂMERA</span>
//                 </button>
//                 <button style={styles.actionCard} onClick={() => fileInputRef.current?.click()}>
//                   <div style={styles.iconCircle}><MdPhotoLibrary size={32} /></div>
//                   <span style={{fontWeight: 'bold', fontSize: '0.85rem'}}>ARQUIVO</span>
//                   <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
//                 </button>
//               </div>
//            </div>
//         </div>
//       ) : (
//         // 🚀 SCANNER EM TELA CHEIA (DENTRO DO MODAL)
//         <div id={SCANNER_CONTAINER_ID} style={styles.scannerContainer}>
//           {error && <div style={{color: '#fff', padding: '20px', textAlign: 'center'}}>{error}</div>}
//         </div>
//       )}
//     </div>
//   );
// };

// const styles: Record<string, React.CSSProperties> = {
//   overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', flexDirection: 'column' },
//   header: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' },
//   modalContent: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
//   selectionCard: { backgroundColor: '#f8fafc', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '450px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' },
//   iconBtn: { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' },
//   closeBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' },
//   title: { fontSize: '1.1rem', fontWeight: '700', marginBottom: '25px', color: '#1e293b' },
//   buttonGrid: { display: 'flex', gap: '15px' },
//   actionCard: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', cursor: 'pointer', transition: 'transform 0.1s' },
//   iconCircle: { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' },
//   // 🚀 IMPORTANTE: width/height 100% garante que o Scanbot consiga ler os pixels
//   scannerContainer: { flex: 1, width: '100%', height: '100%', position: 'relative', backgroundColor: '#000' },
// };