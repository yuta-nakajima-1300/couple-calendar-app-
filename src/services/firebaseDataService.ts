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
import { db } from '../config/firebase';
import { Event, EventCategory, DEFAULT_CATEGORIES } from '../types';

// Firebase接続チェック関数
const checkFirebaseConnection = () => {
  if (!db) {
    throw new Error('Firebase Firestore not initialized. Please check your configuration.');
  }
  return db;
};

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
  createdBy: string;
  coupleId?: string;
  createdAt: any;
  updatedAt: any;
  // 繰り返し機能
  isRecurring?: boolean;
  recurringId?: string;
  recurringRule?: any; // RecurringRuleをanyとして保存
}

export interface FirebaseAnniversary {
  id: string;
  title: string;
  description?: string;
  date: string;
  isRecurring: boolean;
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
    endDate?: string,
    endTime?: string,
    isAllDay?: boolean,
    isRecurring?: boolean,
    recurringId?: string,
    recurringRule?: any
  ): Promise<FirebaseEvent> {
    try {
      const database = checkFirebaseConnection();
      const eventId = doc(collection(database, 'events')).id;
      
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
      if (coupleId) eventData.coupleId = coupleId;
      if (isRecurring) eventData.isRecurring = isRecurring;
      if (recurringId) eventData.recurringId = recurringId;
      if (recurringRule) eventData.recurringRule = recurringRule;

      await setDoc(doc(database, 'events', eventId), eventData);
      
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
      const database = checkFirebaseConnection();
      const eventRef = doc(database, 'events', eventId);
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

  async deleteEvent(eventId: string, userId: string, coupleId?: string): Promise<boolean> {
    try {
      console.log('firebaseDataService.deleteEvent が開始されました');
      console.log('パラメータ:', { eventId, userId, coupleId });
      
      const database = checkFirebaseConnection();
      const eventRef = doc(database, 'events', eventId);
      console.log('イベント参照を作成しました:', eventRef.path);
      
      const eventDoc = await getDoc(eventRef);
      console.log('イベントドキュメントを取得しました:', eventDoc.exists());
      
      if (!eventDoc.exists()) {
        console.error('イベントが見つかりません:', eventId);
        throw new Error('イベントが見つかりません');
      }

      const eventData = eventDoc.data() as FirebaseEvent;
      console.log('イベントデータ:', eventData);
      
      // 削除権限チェック
      const isCreator = eventData.createdBy === userId;
      const isCoupleEvent = eventData.coupleId && eventData.coupleId === coupleId;
      
      console.log('権限チェック:', {
        isCreator,
        isCoupleEvent,
        eventCreatedBy: eventData.createdBy,
        currentUserId: userId,
        eventCoupleId: eventData.coupleId,
        userCoupleId: coupleId
      });
      
      if (!isCreator && !isCoupleEvent) {
        console.error('削除権限がありません');
        throw new Error('削除権限がありません');
      }

      console.log('ドキュメントを削除します');
      await deleteDoc(eventRef);
      console.log('ドキュメントの削除が完了しました');
      
      return true;
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  }

  async getUserEvents(userId: string, coupleId?: string): Promise<Event[]> {
    try {
      const database = checkFirebaseConnection();
      const eventsRef = collection(database, 'events');
      let q;

      if (coupleId) {
        // カップルの場合、両方のイベントを取得
        q = query(
          eventsRef,
          where('coupleId', '==', coupleId)
        );
      } else {
        // 個人のイベントのみ
        q = query(
          eventsRef,
          where('createdBy', '==', userId)
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
    const database = checkFirebaseConnection();
    const eventsRef = collection(database, 'events');
    let q;

    if (coupleId) {
      q = query(
        eventsRef,
        where('coupleId', '==', coupleId)
      );
    } else {
      q = query(
        eventsRef,
        where('createdBy', '==', userId)
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
    description?: string
  ): Promise<FirebaseAnniversary> {
    try {
      const database = checkFirebaseConnection();
      const anniversaryId = doc(collection(database, 'anniversaries')).id;
      
      const anniversaryData: FirebaseAnniversary = {
        id: anniversaryId,
        title,
        description,
        date,
        isRecurring,
        createdBy: userId,
        coupleId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(database, 'anniversaries', anniversaryId), anniversaryData);
      
      return anniversaryData;
    } catch (error) {
      console.error('Failed to create anniversary:', error);
      throw error;
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
      createdBy: firebaseEvent.createdBy,
      createdAt: this.convertTimestamp(firebaseEvent.createdAt),
      updatedAt: this.convertTimestamp(firebaseEvent.updatedAt),
      isRecurring: firebaseEvent.isRecurring,
      recurringId: firebaseEvent.recurringId,
      recurringRule: firebaseEvent.recurringRule,
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
