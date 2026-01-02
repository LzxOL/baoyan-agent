'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, name: string) => Promise<any>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data?.user || null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);

        // 如果用户刚刚登录，检查并创建profile
        if (event === 'SIGNED_IN' && currentUser) {
          // 检查是否已有profile，如果没有则创建
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', currentUser.id)
            .single();

          if (!existingProfile) {
            await supabase.from('profiles').insert({
              user_id: currentUser.id,
              email: currentUser.email,
              name: currentUser.user_metadata?.name || null
            });
          }
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user) setUser(data.user);
    return data;
  }

  async function signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;

    // 注意：注册后不要立即创建profile，因为用户还未验证邮箱
    // profile将在邮箱验证成功后创建，或在用户首次登录时创建

    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function resendVerificationEmail(email: string) {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
    return data;
  }
  // notify other windows/components when auth changes
  useEffect(() => {
    try { window.dispatchEvent(new CustomEvent('auth-changed')); } catch (e) {}
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
