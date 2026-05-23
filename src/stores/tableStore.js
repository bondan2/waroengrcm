import { create } from 'zustand';

export const useTableStore = create((set, get) => ({
  tables: [],
  activeTables: [],
  
  setTables: (tables) => set({ tables }),
  
  updateTableStatus: (tableId, status) => {
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === tableId ? { ...table, status } : table
      ),
    }));
  },

  setActiveTables: (tables) => set({ activeTables: tables }),
  
  addActiveTable: (table) => {
    set((state) => ({
      activeTables: [...state.activeTables, table],
    }));
  },

  removeActiveTable: (tableId) => {
    set((state) => ({
      activeTables: state.activeTables.filter((t) => t.id !== tableId),
    }));
  },
}));