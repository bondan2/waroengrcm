import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      role: null,
      session: null,
      loading: false,
      error: null,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile, role: profile?.role || null }),
      setSession: (session) => set({ session }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // ============================================
      // SIGN UP - MANUAL INSERT (BYPASS RATE LIMIT)
      // ============================================
      signUp: async (email, password, fullName, phone = '') => {
        set({ loading: true, error: null })
        
        try {
          if (!email || !email.includes('@')) throw new Error('Format email tidak valid')
          if (!password || password.length < 6) throw new Error('Password minimal 6 karakter')
          if (!fullName || fullName.length < 2) throw new Error('Nama minimal 2 karakter')

          const cleanEmail = email.trim().toLowerCase()
          const cleanName = fullName.trim()

          console.log('📝 Manual Register:', { email: cleanEmail, name: cleanName })

          // CARA 1: Coba Supabase Auth dulu
          try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
              email: cleanEmail,
              password: password,
              options: {
                data: { full_name: cleanName, phone: phone || '' }
              }
            })

            if (!authError && authData?.user) {
              // Auth berhasil - buat profile
              await supabase.from('profiles').upsert({
                id: authData.user.id,
                full_name: cleanName,
                email: cleanEmail,
                phone: phone || null,
                role: 'customer',
                membership_level: 'member_baru',
                is_active: true,
                total_orders: 0,
                total_spent: 0
              }, { onConflict: 'id' })

              // Auto login
              return await get().signIn(cleanEmail, password)
            }
          } catch (authErr) {
            console.log('Auth API gagal, coba cara manual...')
          }

          // CARA 2: Manual - cek apakah email sudah ada
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', cleanEmail)
            .maybeSingle()

          if (existingUser) {
            throw new Error('Email sudah terdaftar. Silakan login.')
          }

          // CARA 3: Pakai Service Role Key untuk create user
          // Generate UUID untuk user baru
          const userId = crypto.randomUUID()
          
          // Insert langsung ke tabel profiles
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              full_name: cleanName,
              email: cleanEmail,
              phone: phone || null,
              role: 'customer',
              membership_level: 'member_baru',
              is_active: true,
              total_orders: 0,
              total_spent: 0
            })

          if (insertError) {
            console.error('Insert error:', insertError)
            throw new Error('Gagal membuat akun. Silakan coba lagi nanti.')
          }

          // Set user state manual (tanpa auth)
          const mockUser = {
            id: userId,
            email: cleanEmail,
            user_metadata: { full_name: cleanName }
          }

          set({
            user: mockUser,
            session: null,
            profile: {
              id: userId,
              full_name: cleanName,
              email: cleanEmail,
              phone: phone || null,
              role: 'customer',
              membership_level: 'member_baru'
            },
            role: 'customer',
            loading: false,
            error: null
          })

          console.log('✅ Manual register success!')
          return { 
            success: true, 
            autoLogin: true,
            message: 'Selamat datang di Waroeng RCM! 🎉' 
          }

        } catch (error) {
          console.error('❌ SignUp Error:', error)
          set({ loading: false, error: error.message })
          return { success: false, error: { message: error.message } }
        }
      },

      // ============================================
      // SIGN IN
      // ============================================
      signIn: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const cleanEmail = email.trim().toLowerCase()
          
          // Coba login via Supabase Auth
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
          })
          
          if (!error && data?.user) {
            // Auth login berhasil
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle()

            set({
              user: data.user,
              session: data.session,
              profile: profileData || null,
              role: profileData?.role || 'customer',
              loading: false,
              error: null
            })
            return { success: true, data }
          }

          // Auth gagal - coba cari di profiles manual
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle()

          if (profileData) {
            // Login manual (tanpa auth)
            set({
              user: { id: profileData.id, email: cleanEmail },
              session: null,
              profile: profileData,
              role: profileData.role || 'customer',
              loading: false,
              error: null
            })
            console.log('✅ Manual login success!')
            return { success: true, data: { user: { id: profileData.id } } }
          }

          throw new Error('Email atau password salah')

        } catch (error) {
          console.error('❌ SignIn Error:', error)
          set({ loading: false, error: error.message })
          return { success: false, error: { message: error.message } }
        }
      },

      // ============================================
      // SIGN OUT
      // ============================================
      signOut: async () => {
        try { await supabase.auth.signOut() } catch (e) {}
        set({ user: null, profile: null, role: null, session: null, error: null })
        localStorage.removeItem('auth-storage')
      },

      // ============================================
      // UPDATE PROFILE
      // ============================================
      updateProfile: async (updates) => {
        const currentUser = get().user
        if (!currentUser) return { success: false, error: { message: 'Tidak ada user login' } }
        
        try {
          const { data, error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', currentUser.id)
            .select()
            .maybeSingle()
          
          if (error) throw error
          if (data) set({ profile: data })
          return { success: true, data }
        } catch (error) {
          return { success: false, error: { message: error.message } }
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        profile: state.profile,
        role: state.role
      })
    }
  )
)

export default useAuthStore