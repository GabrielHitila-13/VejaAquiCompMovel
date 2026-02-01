import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { isValidUUID } from '@/utils/validation';

export type User = {
  id: string;
  email?: string;
  role?: string;
  accountType?: 'proprietario' | 'arrendatario';
} | null;

type AuthContextType = {
  user: User;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  accountType?: 'proprietario' | 'arrendatario';
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        setIsLoading(true);
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          // Fetch role
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .maybeSingle();

          // Fetch account type from profiles
          const { data: profileData } = await supabase
            .from('profiles')
            .select('account_type')
            .eq('user_id', data.user.id)
            .maybeSingle();

          const u = {
            id: data.user.id,
            email: data.user.email || undefined,
            role: roleData?.role,
            accountType: profileData?.account_type
          };
          if (mounted) setUser(u);
        } else {
          if (mounted) setUser(null);
        }
      } catch (err) {
        console.error('Error fetching auth user:', err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadUser();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      loadUser();
    });

    return () => {
      mounted = false;
      if (sub && typeof sub.subscription?.unsubscribe === 'function') {
        sub.subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const uRaw = data.user;
      if (uRaw) {
        if (!isValidUUID(uRaw.id)) {
          setUser(null);
          throw new Error('Invalid user id');
        }

        // Fetch role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', uRaw.id)
          .maybeSingle();

        // Fetch account type
        const { data: profileData } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('user_id', uRaw.id)
          .maybeSingle();

        setUser({
          id: uRaw.id,
          email: uRaw.email || undefined,
          role: roleData?.role,
          accountType: profileData?.account_type
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Sign in error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      const uRaw = data.user;
      // Note: New users might not have a role yet until assigned
      if (uRaw) {
        setUser({
          id: uRaw.id,
          email: uRaw.email || undefined,
          role: undefined // Default logic or fetch if auto-assigned
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Sign up error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isOwner = (user as any)?.accountType === 'proprietario';

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, signUp, isLoading, isAdmin, isOwner }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}




