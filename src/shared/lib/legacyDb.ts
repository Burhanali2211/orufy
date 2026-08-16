// MOCKED LEGACY DB TO PREVENT VITE CRASHES
// This file is a temporary shim. All hooks should be refactored to use apiClient.

export const supabase: any = {
  from: () => ({
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
        limit: () => Promise.resolve({ data: [], error: null }),
        in: () => Promise.resolve({ data: [], error: null }),
        neq: () => Promise.resolve({ data: [], error: null }),
      }),
      order: () => Promise.resolve({ data: [], error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
      limit: () => Promise.resolve({ data: [], error: null }),
    }),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null })
      })
    }),
    update: () => ({
      eq: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      })
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: null })
    })
  }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    resetPasswordForEmail: () => Promise.resolve({ error: null }),
    updateUser: () => Promise.resolve({ error: null }),
    refreshSession: () => Promise.resolve({ data: { session: null }, error: null }),
  },
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: any, options?: any) => Promise.resolve({ data: { path } as any, error: null as any }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: '' } }),
      remove: (paths: string[]) => Promise.resolve({ data: null as any, error: null as any })
    })
  }
};

export const db: any = {
  query: () => Promise.resolve({ data: [], error: null }),
};
