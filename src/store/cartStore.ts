import { create } from 'zustand';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  storeId: string | null; // << เพิ่มเข้ามา! สำหรับเก็บ ID ร้านค้า
  addItem: (item: Omit<CartItem, 'quantity'>, storeId: string) => void; // << แก้ไข! ต้องรับ storeId ด้วย
  removeItem: (itemId: string) => void;
  increaseQuantity: (itemId: string) => void;
  decreaseQuantity: (itemId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  storeId: null, // << เริ่มต้นยังไม่มีร้าน

  // --- ACTIONS (ฟังก์ชันสำหรับจัดการตะกร้า) ---

  addItem: (item, newStoreId) =>
    set((state) => {
      // ตรวจสอบว่ากำลังสั่งของจากร้านใหม่หรือไม่
      if (state.storeId && state.storeId !== newStoreId) {
        // ถ้ามาจากร้านใหม่ ให้ล้างตะกร้าเก่าก่อน
        alert("คุณกำลังสั่งอาหารจากร้านใหม่ ตะกร้าเก่าของคุณจะถูกล้าง");
        state.items = []; 
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

      return { items: updatedItems, storeId: newStoreId }; // << อัปเดต storeId ด้วย
    }),

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

  clearCart: () => set({ items: [], storeId: null }), // << ล้าง storeId ด้วย
}));
