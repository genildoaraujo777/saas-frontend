// src/contexts/ModalContext.tsx
import React, { useState, createContext, useContext } from 'react';

interface ModalContextType {
  showModal: (title: string, body: React.ReactNode, footer: React.ReactNode) => void;
  updateModal: (title: string, body: React.ReactNode, footer: React.ReactNode) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    body: React.ReactNode;
    footer: React.ReactNode;
  } | null>(null);

  const showModal = (title: string, body: React.ReactNode, footer: React.ReactNode) => {
    setModalContent({ title, body, footer });
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
  };

  const updateModal = (title: string, body: React.ReactNode, footer: React.ReactNode) => {
    setModalContent({ title, body, footer });
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal, updateModal }}>
      {children}

      {modalVisible && (
        <div
          role="dialog"
          aria-modal="true"
          style={styles.overlay}
        >
          <div style={styles.center}>
            <div style={styles.modalBox}>
              <div style={styles.title}>{modalContent?.title}</div>
              <div>{modalContent?.body}</div>
              <div style={styles.footer}>{modalContent?.footer}</div>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  center: {
    minHeight: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    width: 300,
    maxWidth: '90vw',
    backgroundColor: 'white',
    color: '#111',
    borderRadius: 10,
    padding: 20,
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
  title: {
    fontWeight: 700,
    marginBottom: 12,
    fontSize: 16,
  },
  footer: {
    marginTop: 16,
  },
};
