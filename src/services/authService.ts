import { 
  signInWithPopup, 
  signInWithCredential, 
  signOut, 
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  deleteUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, getSafeDb, googleProvider } from '../config/firebase';
import { Platform } from 'react-native';
import { withRateLimit, RateLimitConfig } from '../utils/rateLimiter';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  coupleId?: string;
  partnerId?: string;
  inviteCode?: string;
  createdAt: any;
  updatedAt: any;
}

export interface CoupleData {
  id: string;
  user1Id: string;
  user2Id: string;
  inviteCode: string;
  createdAt: any;
  updatedAt: any;
}

class AuthService {
  // Google Sign-In
  async signInWithGoogle(): Promise<User | null> {
    try {
      if (Platform.OS === 'web') {
        // Web環境でのGoogle認証
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // ユーザープロフィールをFirestoreに保存
        await this.saveUserProfile(user);
        
        return user;
      } else {
        // モバイル環境では別途実装が必要
        throw new Error('Mobile Google Sign-In not implemented yet');
      }
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  }

  // ユーザープロフィールをFirestoreに保存
  async saveUserProfile(user: User): Promise<void> {
    try {
      const database = getSafeDb();
      if (!database) throw new Error('Database not available');
      const userRef = doc(database, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // 新規ユーザーの場合
        const inviteCode = this.generateInviteCode();
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || undefined,
          inviteCode,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        await setDoc(userRef, userProfile);
      } else {
        // 既存ユーザーの場合は最終ログイン時間を更新
        await updateDoc(userRef, {
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Failed to save user profile:', error);
      throw error;
    }
  }

  // 招待コード生成 - セキュアな生成方法
  generateInviteCode(): string {
    // より安全な招待コード生成
    const characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // 0, O, I, L を除外
    const length = 8;
    let result = '';
    
    // crypto.getRandomValues() を使用してセキュアな乱数を生成
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(length);
      crypto.getRandomValues(array);
      
      for (let i = 0; i < length; i++) {
        result += characters.charAt(array[i] % characters.length);
      }
    } else {
      // フォールバック: 複数の乱数源を組み合わせ
      const timestamp = Date.now().toString(36);
      const randomPart = Math.random().toString(36).substring(2, 10);
      const combined = (timestamp + randomPart).toUpperCase();
      
      // 結果から8文字を選択
      for (let i = 0; i < length && i < combined.length; i++) {
        const char = combined[i];
        if (characters.includes(char)) {
          result += char;
        }
      }
      
      // 不足分を補完
      while (result.length < length) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
    }
    
    return result;
  }

  // ユーザープロフィール取得
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const database = getSafeDb();
      if (!database) throw new Error('Database not available');
      const userRef = doc(database, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  // 招待コードでパートナーを検索
  async findUserByInviteCode(inviteCode: string): Promise<UserProfile | null> {
    try {
      // 入力値検証
      if (!inviteCode || typeof inviteCode !== 'string') {
        throw new Error('無効な招待コードです');
      }
      
      // 招待コードの形式チェック
      const cleanCode = inviteCode.trim().toUpperCase();
      const codePattern = /^[A-Z0-9]{6,10}$/;
      
      if (!codePattern.test(cleanCode)) {
        throw new Error('招待コードの形式が正しくありません');
      }
      
      const database = getSafeDb();
      if (!database) throw new Error('Database not available');
      const usersRef = collection(database, 'users');
      const q = query(usersRef, where('inviteCode', '==', cleanCode));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return userDoc.data() as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to find user by invite code:', error);
      throw error;
    }
  }

  // カップル連携
  async linkCouple(currentUserId: string, partnerInviteCode: string): Promise<boolean> {
    // レート制限を適用
    return withRateLimit(
      `invite_code_${currentUserId}`,
      RateLimitConfig.INVITE_CODE,
      async () => {
        try {
          // パートナーを検索
          const partner = await this.findUserByInviteCode(partnerInviteCode);
      if (!partner) {
        throw new Error('パートナーが見つかりません');
      }

      if (partner.uid === currentUserId) {
        throw new Error('自分の招待コードは使用できません');
      }

      if (partner.coupleId) {
        throw new Error('このユーザーは既に他の人と連携しています');
      }

      // 現在のユーザーの情報を取得
      const currentUser = await this.getUserProfile(currentUserId);
      if (!currentUser) {
        throw new Error('ユーザー情報が見つかりません');
      }

      if (currentUser.coupleId) {
        throw new Error('既に他の人と連携しています');
      }

      // カップルIDを生成
      const coupleId = `couple_${currentUserId}_${partner.uid}`;

      // カップルデータを作成
      const coupleData: CoupleData = {
        id: coupleId,
        user1Id: currentUserId,
        user2Id: partner.uid,
        inviteCode: this.generateInviteCode(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Firestoreにカップルデータを保存
      const database = getSafeDb();
      if (!database) throw new Error('Database not available');
      const coupleRef = doc(database, 'couples', coupleId);
      await setDoc(coupleRef, coupleData);

      // 両方のユーザーにカップル情報を追加
      const user1Ref = doc(database, 'users', currentUserId);
      const user2Ref = doc(database, 'users', partner.uid);

      await updateDoc(user1Ref, {
        coupleId: coupleId,
        partnerId: partner.uid,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(user2Ref, {
        coupleId: coupleId,
        partnerId: currentUserId,
        updatedAt: serverTimestamp(),
      });

          return true;
        } catch (error) {
          console.error('Failed to link couple:', error);
          throw error;
        }
      }
    );
  }

  // カップル連携を解除
  async unlinkCouple(userId: string): Promise<boolean> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile || !userProfile.coupleId) {
        throw new Error('カップル連携が見つかりません');
      }

      const partnerId = userProfile.partnerId;
      if (!partnerId) {
        throw new Error('パートナー情報が見つかりません');
      }

      // カップルデータを削除
      const database = getSafeDb();
      if (!database) throw new Error('Database not available');
      const coupleRef = doc(database, 'couples', userProfile.coupleId);
      await setDoc(coupleRef, { deleted: true, deletedAt: serverTimestamp() }, { merge: true });

      // 両方のユーザーからカップル情報を削除
      const user1Ref = doc(database, 'users', userId);
      const user2Ref = doc(database, 'users', partnerId);

      await updateDoc(user1Ref, {
        coupleId: null,
        partnerId: null,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(user2Ref, {
        coupleId: null,
        partnerId: null,
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('Failed to unlink couple:', error);
      throw error;
    }
  }

  // ユーザープロフィール更新
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const database = getSafeDb();
      if (!database) throw new Error('Database not available');
      
      const userRef = doc(database, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }

  // アカウント削除
  async deleteAccount(userId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== userId) {
        throw new Error('認証エラー: 現在のユーザーのみがアカウントを削除できます');
      }

      // カップル連携を解除
      const userProfile = await this.getUserProfile(userId);
      if (userProfile?.coupleId) {
        await this.unlinkCouple(userId);
      }

      // Firestoreのユーザーデータを削除
      const database = getSafeDb();
      if (!database) throw new Error('Database not available');
      
      // ユーザードキュメントを削除済みとしてマーク
      const userRef = doc(database, 'users', userId);
      await setDoc(userRef, { 
        deleted: true, 
        deletedAt: serverTimestamp(),
        email: null,
        displayName: 'Deleted User',
        photoURL: null,
        inviteCode: null
      }, { merge: true });

      // Firebase Authenticationからユーザーを削除
      await deleteUser(currentUser);
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  }

  // サインアウト
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  // 認証状態の監視
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // 現在のユーザーを取得
  getCurrentUser(): User | null {
    return auth.currentUser;
  }
}

export const authService = new AuthService();