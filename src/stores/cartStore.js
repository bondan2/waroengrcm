import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      orderType: null,
      tableId: null,
      customerName: '',
      customerPhone: '',
      notes: '',

      addItem: (menuItem, quantity = 1) => {
        const items = [...get().items];
        const existingIndex = items.findIndex((item) => item.id === menuItem.id);

        if (existingIndex >= 0) {
          items[existingIndex].quantity += quantity;
        } else {
          items.push({
            ...menuItem,
            quantity,
            notes: '',
          });
        }

        set({ items });
      },

      removeItem: (menuId) => {
        set({ items: get().items.filter((item) => item.id !== menuId) });
      },

      updateQuantity: (menuId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuId);
          return;
        }
        
        set({
          items: get().items.map((item) =>
            item.id === menuId ? { ...item, quantity } : item
          ),
        });
      },

      updateItemNotes: (menuId, notes) => {
        set({
          items: get().items.map((item) =>
            item.id === menuId ? { ...item, notes } : item
          ),
        });
      },

      setOrderType: (orderType) => set({ orderType }),
      setTableId: (tableId) => set({ tableId }),
      setCustomerInfo: (name, phone) => set({ customerName: name, customerPhone: phone }),
      setNotes: (notes) => set({ notes }),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTax: () => {
        return get().getSubtotal() * 0.11; // 11% PPN
      },

      getTotal: () => {
        return get().getSubtotal() + get().getTax();
      },

      clearCart: () => {
        set({
          items: [],
          orderType: null,
          tableId: null,
          customerName: '',
          customerPhone: '',
          notes: '',
        });
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        orderType: state.orderType,
        tableId: state.tableId,
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        notes: state.notes,
      }),
    }
  )
);