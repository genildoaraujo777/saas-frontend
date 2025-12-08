// src/contexts/SupplierContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Supplier } from '@/types';
import api from '@/services/api';

interface SupplierContextType {
  suppliersItems: Supplier[];
  updateSupplier: (supplierId: string, name: string) => void;
  searchSuppliers: () => Promise<Supplier[]>;
  createSupplier: (newSupplier: Supplier) => void;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

export const SupplierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [suppliersItems, setSuppliersItems] = useState<Supplier[]>([]);

  useEffect(() => {
    searchSuppliers();
  }, []);

  const updateSupplier = (supplierId: string, name: string) => {
    setSuppliersItems((prev) =>
      prev.map((item) =>
        item._id === supplierId ? { ...item, name } : item
      )
    );
  };

  const createSupplier = (newSupplier: Supplier) => {
    setSuppliersItems((prev) => [...prev, newSupplier]);
  };

  const searchSuppliers = async (): Promise<Supplier[]> => {
    const response = await api.get<Supplier[]>(`/fbm/suppliers`);
    setSuppliersItems(response.data);
    return [...response.data].sort((a, b) => a.name.localeCompare(b.name));
  };

  return (
    <SupplierContext.Provider
      value={{ suppliersItems, updateSupplier, createSupplier, searchSuppliers }}
    >
      {children}
    </SupplierContext.Provider>
  );
};

export const useSupplier = () => {
  const context = useContext(SupplierContext);
  if (!context) {
    throw new Error('useSupplier must be used within a SupplierProvider');
  }
  return context;
};
