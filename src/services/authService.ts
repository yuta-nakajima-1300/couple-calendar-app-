import { 
  signInWithPopup, 
  signInWithCredential, 
  signOut, 
  onAuthStateChanged,
  User,
  GoogleAuthProvider
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
import { auth, db, googleProvider } from '../config/firebase';
import { Platform } from 'react-native';

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
      const userRef = doc(db, 'users', user.uid);
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

  // 招待コード生成
  generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // ユーザープロフィール取得
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', uid);
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
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('inviteCode', '==', inviteCode.toUpperCase()));
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
      const coupleRef = doc(db, 'couples', coupleId);
      await setDoc(coupleRef, coupleData);

      // 両方のユーザーにカップル情報を追加
      const user1Ref = doc(db, 'users', currentUserId);
      const user2Ref = doc(db, 'users', partner.uid);

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
      const coupleRef = doc(db, 'couples', userProfile.coupleId);
      await setDoc(coupleRef, { deleted: true, deletedAt: serverTimestamp() }, { merge: true });

      // 両方のユーザーからカップル情報を削除
      const user1Ref = doc(db, 'users', userId);
      const user2Ref = doc(db, 'users', partnerId);

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