import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Event, EventCategory, DEFAULT_CATEGORIES } from '../types';

export interface FirebaseEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  time?: string;
  endTime?: string;
  isAllDay?: boolean;
  category: string;
  photoURL?: string;
  createdBy: string;
  coupleId?: string;
  createdAt: any;
  updatedAt: any;
}

export interface FirebaseAnniversary {
  id: string;
  title: string;
  description?: string;
  date: string;
  isRecurring: boolean;
  photoURL?: string;
  createdBy: string;
  coupleId?: string;
  createdAt: any;
  updatedAt: any;
}

class FirebaseDataService {
  // イベント関連
  async createEvent(
    userId: string,
    coupleId: string | undefined,
    title: string,
    date: string,
    time?: string,
    description?: string,
    categoryId?: string,
    photoFile?: File | string,
    endDate?: string,
    endTime?: string,
    isAllDay?: boolean
  ): Promise<FirebaseEvent> {
    try {
      const eventId = doc(collection(db, 'events')).id;
      
      let photoURL: string | undefined;
      
      // 写真のアップロード
      if (photoFile) {
        if (typeof photoFile === 'string') {
          // Data URLの場合
          const response = await fetch(photoFile);
          const blob = await response.blob();
          photoURL = await this.uploadPhoto(blob, `events/${eventId}`);
        } else {
          // Fileオブジェクトの場合
          photoURL = await this.uploadPhoto(photoFile, `events/${eventId}`);
        }
      }

      const eventData: Partial<FirebaseEvent> = {
        id: eventId,
        title,
        description,
        date,
        isAllDay: isAllDay || false,
        category: categoryId || 'personal',
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // undefined フィールドを除外
      if (endDate) eventData.endDate = endDate;
      if (time) eventData.time = time;
      if (endTime) eventData.endTime = endTime;
      if (photoURL) eventData.photoURL = photoURL;
      if (coupleId) eventData.coupleId = coupleId;

      await setDoc(doc(db, 'events', eventId), eventData);
      
      return eventData as FirebaseEvent;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  async updateEvent(
    eventId: string,
    userId: string,
    updates: Partial<FirebaseEvent>
  ): Promise<boolean> {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        throw new Error('イベントが見つかりません');
      }

      const eventData = eventDoc.data() as FirebaseEvent;
      
      // 編集権限チェック（作成者またはカップルのパートナー）
      if (eventData.createdBy !== userId && eventData.coupleId) {
        // カップルのパートナーかチェック
        // 実際の実装では、userIdがカップルの一員かを確認する必要があります
      }

      await updateDoc(eventRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string, userId: string): Promise<boolean> {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        throw new Error('イベントが見つかりません');
      }

      const eventData = eventDoc.data() as FirebaseEvent;
      
      // 削除権限チェック
      if (eventData.createdBy !== userId) {
        throw new Error('削除権限がありません');
      }

      // 写真も削除
      if (eventData.photoURL) {
        await this.deletePhoto(`events/${eventId}`);
      }

      await deleteDoc(eventRef);
      return true;
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  }

  async getUserEvents(userId: string, coupleId?: string): Promise<Event[]> {
    try {
      const eventsRef = collection(db, 'events');
      let q;

      if (coupleId) {
        // カップルの場合、両方のイベントを取得
        q = query(
          eventsRef,
          where('coupleId', '==', coupleId),
          orderBy('date', 'desc')
        );
      } else {
        // 個人のイベントのみ
        q = query(
          eventsRef,
          where('createdBy', '==', userId),
          orderBy('date', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const events: Event[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const firebaseEvent = docSnapshot.data() as FirebaseEvent;
        const event = this.convertFirebaseEventToEvent(firebaseEvent);
        events.push(event);
      }

      return events;
    } catch (error) {
      console.error('Failed to get user events:', error);
      throw error;
    }
  }

  // リアルタイムイベント監視
  onEventsSnapshot(
    userId: string,
    coupleId: string | undefined,
    callback: (events: Event[]) => void
  ) {
    const eventsRef = collection(db, 'events');
    let q;

    if (coupleId) {
      q = query(
        eventsRef,
        where('coupleId', '==', coupleId),
        orderBy('date', 'desc')
      );
    } else {
      q = query(
        eventsRef,
        where('createdBy', '==', userId),
        orderBy('date', 'desc')
      );
    }

    return onSnapshot(q, (querySnapshot) => {
      const events: Event[] = [];
      
      querySnapshot.forEach((docSnapshot) => {
        const firebaseEvent = docSnapshot.data() as FirebaseEvent;
        const event = this.convertFirebaseEventToEvent(firebaseEvent);
        events.push(event);
      });

      callback(events);
    });
  }

  // 記念日関連
  async createAnniversary(
    userId: string,
    coupleId: string | undefined,
    title: string,
    date: string,
    isRecurring: boolean,
    description?: string,
    photoFile?: File | string
  ): Promise<FirebaseAnniversary> {
    try {
      const anniversaryId = doc(collection(db, 'anniversaries')).id;
      
      let photoURL: string | undefined;
      
      if (photoFile) {
        if (typeof photoFile === 'string') {
          const response = await fetch(photoFile);
          const blob = await response.blob();
          photoURL = await this.uploadPhoto(blob, `anniversaries/${anniversaryId}`);
        } else {
          photoURL = await this.uploadPhoto(photoFile, `anniversaries/${anniversaryId}`);
        }
      }

      const anniversaryData: FirebaseAnniversary = {
        id: anniversaryId,
        title,
        description,
        date,
        isRecurring,
        photoURL,
        createdBy: userId,
        coupleId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'anniversaries', anniversaryId), anniversaryData);
      
      return anniversaryData;
    } catch (error) {
      console.error('Failed to create anniversary:', error);
      throw error;
    }
  }

  // 写真アップロード
  private async uploadPhoto(file: File | Blob, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Failed to upload photo:', error);
      throw error;
    }
  }

  // 写真削除
  private async deletePhoto(path: string): Promise<void> {
    try {
      const photoRef = ref(storage, path);
      await deleteObject(photoRef);
    } catch (error) {
      console.error('Failed to delete photo:', error);
      // 写真削除の失敗は致命的ではないので、エラーをログに記録するだけ
    }
  }

  // FirebaseEvent を Event に変換
  private convertFirebaseEventToEvent(firebaseEvent: FirebaseEvent): Event {
    const category = DEFAULT_CATEGORIES.find(cat => cat.id === firebaseEvent.category) || DEFAULT_CATEGORIES[0];
    
    return {
      id: firebaseEvent.id,
      title: firebaseEvent.title,
      description: firebaseEvent.description || '',
      date: firebaseEvent.date,
      endDate: firebaseEvent.endDate,
      time: firebaseEvent.time || '',
      endTime: firebaseEvent.endTime,
      isAllDay: firebaseEvent.isAllDay || false,
      category,
      photo: firebaseEvent.photoURL,
      createdBy: firebaseEvent.createdBy,
      createdAt: this.convertTimestamp(firebaseEvent.createdAt),
      updatedAt: this.convertTimestamp(firebaseEvent.updatedAt),
    };
  }

  // Timestamp を ISO string に変換
  private convertTimestamp(timestamp: any): string {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toISOString();
    }
    return new Date().toISOString();
  }
}

export const firebaseDataService = new FirebaseDataService();
