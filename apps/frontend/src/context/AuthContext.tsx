import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { fetchUserProfile } from '../services/api';
import { AuthContext } from './auth-context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const profile = await fetchUserProfile();
      setUser(profile);
    } catch (e) {
      console.error('Failed to fetch user profile:', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        fetchProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
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
