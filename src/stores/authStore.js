import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      loading: true,
      error: null,

      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            set({ session, user: session.user });
            await get().fetchProfile();
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
        } finally {
          set({ loading: false });
        }
      },

      fetchProfile: async () => {
        const { user } = get();
        if (!user) return;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        set({ profile });
      },

      login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        set({ session: data.session, user: data.user });
        await get().fetchProfile();
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, session: null });
      },

      isAdmin: () => {
        const { profile } = get();
        return profile?.role === 'admin' || profile?.role === 'super_admin';
      },

      isCashier: () => {
        const { profile } = get();
        return profile?.role === 'cashier';
      },

      isCustomer: () => {
        const { profile } = get();
        return !profile || profile?.role === 'customer';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        session: state.session,
      }),
    }
  )
);

// Initialize auth
useAuthStore.getState().initialize();

// Listen to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    useAuthStore.setState({ session, user: session.user });
    useAuthStore.getState().fetchProfile();
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, profile: null, session: null });
  }
});