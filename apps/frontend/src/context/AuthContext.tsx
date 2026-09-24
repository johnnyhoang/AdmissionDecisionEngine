import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { fetchUserProfile } from '../services/api';
import { AuthContext } from './auth-context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (sessionUser?: any) => {
    try {
      const profile = await fetchUserProfile();
      setUser(profile);
    } catch (e) {
      console.warn('Backend profile fetch failed, using session fallback:', e);
      if (sessionUser) {
        setUser({
          id: sessionUser.id,
          email: sessionUser.email,
          fullName: sessionUser.user_metadata?.full_name || sessionUser.email,
          role: sessionUser.email?.toLowerCase() === 'hoang.hoa@gmail.com' ? 'ADMIN' : 'USER',
        });
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // INITIAL_SESSION fires after supabase-js has processed any OAuth tokens in the URL.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user), 0); // never call supabase inside this callback synchronously (auth lock)
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const redirectTarget = window.location.origin.replace(/\/+$/, '');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTarget,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  const hasPermission = (module: string, functionKey: string, type: 'view' | 'edit'): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;

    const matchedPerm = user.permissions?.find(
      (p: any) => p.module === module && p.functionKey === functionKey
    );

    if (!matchedPerm) return false;
    return type === 'view' ? !!matchedPerm.canView : !!matchedPerm.canEdit;
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};
