import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Demo accounts - only available in development environment
  const isDevelopment = process.env.EXPO_PUBLIC_ENVIRONMENT === 'development';
  
  const sampleAccounts = isDevelopment ? [
    { id: '1', email: 'demo1@example.com', password: 'Dev2024!SecurePass', name: '太郎' },
    { id: '2', email: 'demo2@example.com', password: 'Dev2024!SecurePass', name: '花子' },
    { id: '3', email: 'demo3@example.com', password: 'Dev2024!SecurePass', name: 'サンプル' }
  ] : [];

  const login = async (email: string, password: string): Promise<boolean> => {
    // Input validation
    if (!email || !password) {
      return false;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    
    // Only allow demo accounts in development environment
    if (!isDevelopment) {
      console.warn('Demo accounts are not available in production environment');
      return false;
    }
    
    // Rate limiting simulation (in real app, implement proper rate limiting)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // サンプルアカウントで認証
    const account = sampleAccounts.find(acc => 
      acc.email === email && acc.password === password
    );
    
    if (account) {
      setUser({
        id: account.id,
        email: account.email,
        name: account.name
      });
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    isLoggedIn: !!user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};