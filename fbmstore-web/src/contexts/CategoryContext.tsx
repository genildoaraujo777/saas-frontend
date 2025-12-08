// src/contexts/CategoryContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Category } from '@/types';
import api from '@/services/api';

interface CategoryContextType {
  categoriesItems: Category[];
  updateCategory: (categoryId: string, name: string) => void;
  searchCategories: () => Promise<Category[]>;
  createCategory: (newCategory: Category) => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categoriesItems, setCategoriesItems] = useState<Category[]>([]);

  useEffect(() => {
    searchCategories();
  }, []);

  const updateCategory = (categoryId: string, name: string) => {
    setCategoriesItems((prev) =>
      prev.map((item) =>
        item._id === categoryId
          ? { ...item, name }
          : item
      )
    );
  };

  const createCategory = (newCategory: Category) => {
    setCategoriesItems((prev) => [...prev, newCategory]);
  };

  const searchCategories = async () => {
    const response = await api.get(`/fbm/categories`);
    setCategoriesItems(response.data);
    return [...response.data].sort((a, b) => a.name.localeCompare(b.name));
  };

  return (
    <CategoryContext.Provider value={{ categoriesItems, updateCategory, createCategory, searchCategories }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategory = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
};
