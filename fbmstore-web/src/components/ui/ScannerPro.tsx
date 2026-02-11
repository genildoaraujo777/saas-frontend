import React, { useState } from 'react';
import jsQR from 'jsqr'; // Você já tem e funciona no React 18
import { MdCameraAlt, MdClose } from 'react-icons/md';

export const ScannerPro = ({ onScanSuccess, onClose }: any) => {
  const [lendo, setLendo] = useState(false);

  const processarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setLendo(true);
    const leitor = new FileReader();
    leitor.onload = (res) => {
      const img = new Image();
      img.src = res.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        const dadosImagem = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        
        // O jsQR processa a foto nítida da câmera nativa
        const resultado = jsQR(dadosImagem!.data, dadosImagem!.width, dadosImagem!.height);
        
        if (resultado) {
          onScanSuccess(resultado.data); // Abre o site da Fazenda
        } else {
          alert("QR Code não encontrado. Tente tirar a foto mais de perto.");
        }
        setLendo(false);
      };
    };
    leitor.readAsDataURL(arquivo);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <button onClick={onClose} style={styles.fechar}><MdClose size={24}/></button>
        <h3 style={{ marginBottom: '10px' }}>Scanner de Nota</h3>
        <p style={{ fontSize: '14px', color: '#666' }}>
          {lendo ? "Lendo dados..." : "Clique abaixo para abrir a câmera do seu celular"}
        </p>
        
        <label style={styles.botaoCâmera}>
          <MdCameraAlt size={30} />
          <span style={{ fontWeight: 'bold' }}>TIRAR FOTO DA NOTA</span>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" // 🚀 O segredo para iOS e Android
            onChange={processarFoto} 
            style={{ display: 'none' }} 
          />
        </label>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  card: { backgroundColor: '#fff', padding: '30px', borderRadius: '20px', textAlign: 'center', width: '100%', maxWidth: '350px', position: 'relative' },
  fechar: { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer' },
  botaoCâmera: { marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', backgroundColor: '#3b82f6', color: '#fff', padding: '20px', borderRadius: '15px', cursor: 'pointer' }
};