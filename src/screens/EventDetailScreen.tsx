import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import type { CalendarStackParamList } from '../types/navigation';
import { useFirebaseEvents } from '../contexts/FirebaseEventContext';
import { useCouple } from '../contexts/CoupleContext';
import { Event } from '../types';
import { getDateInfo } from '../utils/dateUtils';

type EventDetailScreenNavigationProp = NavigationProp<CalendarStackParamList, 'EventDetail'>;
type EventDetailScreenRouteProp = RouteProp<CalendarStackParamList, 'EventDetail'>;

export default function EventDetailScreen() {
  const navigation = useNavigation<EventDetailScreenNavigationProp>();
  const route = useRoute<EventDetailScreenRouteProp>();
  const { eventId } = route.params;
  const { events, deleteEvent } = useFirebaseEvents();
  const { getEventOwnerName, getEventColor, getEventOwnerInitial } = useCouple();
  const [event, setEvent] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const foundEvent = events.find(e => e.id === eventId);
    setEvent(foundEvent || null);
  }, [eventId, events]);

  const handleEdit = () => {
    navigation.navigate('EventEdit', { eventId });
  };

  const handleDelete = () => {
    Alert.alert(
      '予定を削除',
      'この予定を削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteEvent(eventId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('エラー', '予定の削除に失敗しました');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const formatDateWithDay = (dateString: string) => {
    const date = new Date(dateString);
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const dayName = dayNames[date.getDay()];
    return `${formatDate(dateString)}（${dayName}）`;
  };

  const formatTime = (time?: string, endTime?: string) => {
    if (!time) return '';
    return endTime ? `${time} - ${endTime}` : time;
  };

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>予定詳細</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>予定が見つかりません</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ownerType = event.ownerType || 'shared';
  const ownerColor = getEventColor(ownerType);
  const ownerName = getEventOwnerName(ownerType);
  const ownerInitial = getEventOwnerInitial(ownerType);
  const dateInfo = getDateInfo(event.date);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>予定詳細</Text>
        <TouchableOpacity onPress={handleEdit}>
          <Text style={styles.editButton}>編集</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* タイトル */}
        <View style={styles.section}>
          <Text style={styles.title}>{event.title}</Text>
        </View>

        {/* 所有者 */}
        <View style={styles.section}>
          <Text style={styles.label}>予定の所有者</Text>
          <View style={styles.ownerContainer}>
            <View style={[styles.ownerBadge, { backgroundColor: ownerColor }]}>
              <Text style={styles.ownerBadgeText}>{ownerInitial}</Text>
            </View>
            <Text style={styles.ownerText}>{ownerName}</Text>
          </View>
        </View>

        {/* 日付・時刻 */}
        <View style={styles.section}>
          <Text style={styles.label}>日時</Text>
          <Text style={styles.value}>{formatDateWithDay(event.date)}</Text>
          {dateInfo.holidayName && (
            <Text style={[styles.holidayText, { color: dateInfo.color }]}>
              {dateInfo.holidayName}
            </Text>
          )}
          {event.endDate && (
            <Text style={styles.value}>
              終了: {formatDateWithDay(event.endDate)}
            </Text>
          )}
          {!event.isAllDay && (
            <Text style={styles.timeText}>
              {formatTime(event.time, event.endTime) || '時刻未設定'}
            </Text>
          )}
          {event.isAllDay && (
            <Text style={styles.allDayText}>終日</Text>
          )}
        </View>

        {/* カテゴリ */}
        <View style={styles.section}>
          <Text style={styles.label}>カテゴリ</Text>
          <View style={styles.categoryContainer}>
            <View style={[styles.categoryColor, { backgroundColor: event.category.color }]} />
            <Text style={styles.categoryIcon}>{event.category.icon}</Text>
            <Text style={styles.categoryText}>{event.category.name}</Text>
          </View>
        </View>

        {/* 詳細 */}
        {event.description && (
          <View style={styles.section}>
            <Text style={styles.label}>詳細</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}

        {/* 作成日時 */}
        <View style={styles.section}>
          <Text style={styles.label}>作成日時</Text>
          <Text style={styles.metaText}>
            {new Date(event.createdAt).toLocaleDateString('ja-JP')} {new Date(event.createdAt).toLocaleTimeString('ja-JP')}
          </Text>
          {event.updatedAt !== event.createdAt && (
            <Text style={styles.metaText}>
              更新: {new Date(event.updatedAt).toLocaleDateString('ja-JP')} {new Date(event.updatedAt).toLocaleTimeString('ja-JP')}
            </Text>
          )}
        </View>

        {/* 削除ボタン */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDelete}
            disabled={deleting}
          >
            <Text style={styles.deleteButtonText}>
              {deleting ? '削除中...' : '予定を削除'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const isMobile = Platform.OS !== 'web' || (typeof window !== 'undefined' && window.innerWidth < 768);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 16,
    color: '#666',
  },
  allDayText: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  holidayText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  ownerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  ownerBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  ownerText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  metaText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  deleteButton: {
    backgroundColor: '#ff4757',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});