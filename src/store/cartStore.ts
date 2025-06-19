// ที่ไฟล์: src/store/cartStore.ts

import { create } from 'zustand';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string; // << เพิ่มบรรทัดนี้เข้าไป! ให้มันเป็น optional
}

interface CartState {
  items: CartItem[];
  storeId: string | null;
  addItem: (item: Omit<CartItem, 'quantity' | 'image'> & { image?: string }, storeId: string) => void; // แก้ไข type ของ item ที่รับเข้ามา
  removeItem: (itemId: string) => void;
  increaseQuantity: (itemId: string) => void;
  decreaseQuantity: (itemId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  storeId: null,

  // --- ACTIONS ---

  addItem: (item, newStoreId) =>
    set((state) => {
      if (state.storeId && state.storeId !== newStoreId) {
        alert("คุณกำลังสั่งอาหารจากร้านใหม่ ตะกร้าเก่าของคุณจะถูกล้าง");
        return { items: [{ ...item, quantity: 1 }], storeId: newStoreId }; // ล้างตะกร้าแล้วเริ่มใหม่
      }

      const existingItem = state.items.find((i) => i.id === item.id);
      let updatedItems;

      if (existingItem) {
        updatedItems = state.items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        updatedItems = [...state.items, { ...item, quantity: 1 }];
      }

      return { items: updatedItems, storeId: newStoreId }; 
    }),

  // ... ฟังก์ชันอื่นๆ เหมือนเดิม ...
  removeItem: (itemId) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== itemId),
    })),

  increaseQuantity: (itemId) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i
      ),
    })),

  decreaseQuantity: (itemId) =>
    set((state) => ({
      items: state.items
        .map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0),
    })),

  clearCart: () => set({ items: [], storeId: null }),
}));