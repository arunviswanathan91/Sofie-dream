/**
 * InventoryContext — manages the user's material/product inventory.
 * Persists locally via AsyncStorage. Inventory can be read app-wide.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getLocalInventory,
  addLocalInventoryProduct,
  updateLocalInventoryProduct,
  deleteLocalInventoryProduct,
  generateId,
} from '../lib/localStore';
import type { InventoryProduct, InventoryMaterial } from '../types';

interface InventoryContextValue {
  products: InventoryProduct[];
  loading: boolean;
  addProduct: (data: Omit<InventoryProduct, 'id' | 'createdAt' | 'updatedAt' | 'totalMaterialCost' | 'suggestedPrice'>) => Promise<string>;
  updateProduct: (id: string, updates: Partial<InventoryProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  recalcProduct: (id: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

function calcTotals(materials: InventoryMaterial[], markup: number) {
  const totalMaterialCost = materials.reduce((sum, m) => sum + m.costPerUnit * m.quantity, 0);
  const suggestedPrice = totalMaterialCost * markup;
  return { totalMaterialCost, suggestedPrice };
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLocalInventory().then((p) => {
      setProducts(p);
      setLoading(false);
    });
  }, []);

  const addProduct = useCallback(async (
    data: Omit<InventoryProduct, 'id' | 'createdAt' | 'updatedAt' | 'totalMaterialCost' | 'suggestedPrice'>
  ): Promise<string> => {
    const { totalMaterialCost, suggestedPrice } = calcTotals(data.materials, data.markup);
    const now = new Date();
    const product: InventoryProduct = {
      ...data,
      id: generateId(),
      totalMaterialCost,
      suggestedPrice,
      createdAt: now,
      updatedAt: now,
    };
    await addLocalInventoryProduct(product);
    setProducts((prev) => [product, ...prev]);
    return product.id;
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<InventoryProduct>): Promise<void> => {
    const existing = products.find((p) => p.id === id);
    if (!existing) return;
    const merged = { ...existing, ...updates };
    const { totalMaterialCost, suggestedPrice } = calcTotals(merged.materials, merged.markup);
    const final = { ...merged, totalMaterialCost, suggestedPrice, updatedAt: new Date() };
    await updateLocalInventoryProduct(id, final);
    setProducts((prev) => prev.map((p) => (p.id === id ? final : p)));
  }, [products]);

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    await deleteLocalInventoryProduct(id);
  }, []);

  const recalcProduct = useCallback(async (id: string): Promise<void> => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    await updateProduct(id, {});
  }, [products, updateProduct]);

  return (
    <InventoryContext.Provider value={{ products, loading, addProduct, updateProduct, deleteProduct, recalcProduct }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be inside <InventoryProvider>');
  return ctx;
}
