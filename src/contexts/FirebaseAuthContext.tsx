import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { authService, UserProfile } from '../services/authService';
import { setSecureItem, getSecureItem, deleteSecureItem, SecureKeys } from '../utils/secureStorage';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  linkCouple: (inviteCode: string) => Promise<boolean>;
  unlinkCouple: () => Promise<boolean>;
  refreshUserProfile: () => Promise<void>;
}

const FirebaseAuthContext = createContext<AuthContextType | undefined>(undefined);

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
};

interface FirebaseAuthProviderProps {
  children: ReactNode;
}

export const FirebaseAuthProvider: React.FC<FirebaseAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ユーザープロフィールを取得
  const fetchUserProfile = async (uid: string) => {
    try {
      const profile = await authService.getUserProfile(uid);
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setUserProfile(null);
    }
  };

  // 認証状態の監視
  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      console.log('Auth state changed - user:', !!user, user?.uid);
      setUser(user);
      
      if (user) {
        console.log('User authenticated, fetching profile...');
        await fetchUserProfile(user.uid);
        
        // 認証トークンを暗号化して保存
        try {
          const token = await user.getIdToken();
          await setSecureItem(SecureKeys.USER_TOKEN, token);
          
          // リフレッシュトークンも保存（利用可能な場合）
          const refreshToken = user.refreshToken;
          if (refreshToken) {
            await setSecureItem(SecureKeys.REFRESH_TOKEN, refreshToken);
          }
        } catch (error) {
          console.error('Failed to save auth tokens:', error);
        }
      } else {
        console.log('User not authenticated, clearing profile');
        setUserProfile(null);
        
        // 保存されているトークンを削除
        try {
          await deleteSecureItem(SecureKeys.USER_TOKEN);
          await deleteSecureItem(SecureKeys.REFRESH_TOKEN);
        } catch (error) {
          console.error('Failed to clear auth tokens:', error);
        }
      }
      
      console.log('Auth loading completed');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Google Sign-In
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const user = await authService.signInWithGoogle();
      if (user) {
        await fetchUserProfile(user.uid);
      }
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
      setUserProfile(null);
      
      // 保存されているトークンを削除
      try {
        await deleteSecureItem(SecureKeys.USER_TOKEN);
        await deleteSecureItem(SecureKeys.REFRESH_TOKEN);
        await deleteSecureItem(SecureKeys.COUPLE_CODE);
      } catch (error) {
        console.error('Failed to clear secure data:', error);
      }
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // カップル連携
  const linkCouple = async (inviteCode: string): Promise<boolean> => {
    try {
      if (!user) {
        throw new Error('ユーザーがログインしていません');
      }

      const success = await authService.linkCouple(user.uid, inviteCode);
      
      if (success) {
        // ユーザープロフィールを再取得
        await fetchUserProfile(user.uid);
        
        // カップルコードを暗号化して保存
        try {
          await setSecureItem(SecureKeys.COUPLE_CODE, inviteCode);
        } catch (error) {
          console.error('Failed to save couple code:', error);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Failed to link couple:', error);
      throw error;
    }
  };

  // カップル連携解除
  const unlinkCouple = async (): Promise<boolean> => {
    try {
      if (!user) {
        throw new Error('ユーザーがログインしていません');
      }

      const success = await authService.unlinkCouple(user.uid);
      
      if (success) {
        // ユーザープロフィールを再取得
        await fetchUserProfile(user.uid);
        
        // カップルコードを削除
        try {
          await deleteSecureItem(SecureKeys.COUPLE_CODE);
        } catch (error) {
          console.error('Failed to clear couple code:', error);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Failed to unlink couple:', error);
      throw error;
    }
  };

  // ユーザープロフィール更新
  const refreshUserProfile = async () => {
    if (user) {
      await fetchUserProfile(user.uid);
    }
  };

  // アカウント削除
  const deleteAccount = async () => {
    try {
      if (!user) {
        throw new Error('ユーザーがログインしていません');
      }

      await authService.deleteAccount(user.uid);
      
      // トークンを削除
      try {
        await deleteSecureItem(SecureKeys.USER_TOKEN);
        await deleteSecureItem(SecureKeys.REFRESH_TOKEN);
        await deleteSecureItem(SecureKeys.COUPLE_CODE);
      } catch (error) {
        console.error('Failed to clear secure data:', error);
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    signOut,
    deleteAccount,
    linkCouple,
    unlinkCouple,
    refreshUserProfile,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};