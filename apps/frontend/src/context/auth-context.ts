import { createContext } from 'react';

export interface AuthContextType {
  user: any | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (module: string, functionKey: string, type: 'view' | 'edit') => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
