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

  const sampleAccounts = [
    { id: '1', email: 'test@example.com', password: 'password123', name: '太郎' },
    { id: '2', email: 'demo@example.com', password: 'demo123', name: '花子' },
    { id: '3', email: 'sample@example.com', password: 'sample123', name: 'サンプル' }
  ];

  const login = async (email: string, password: string): Promise<boolean> => {
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