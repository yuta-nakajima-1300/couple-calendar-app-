import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert 
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { CalendarStackParamList } from '../types/navigation';
import { useFirebaseEvents } from '../contexts/FirebaseEventContext';
import { Event } from '../types';
import { loadSampleData, clearAllData } from '../utils/sampleData';
import InlineEventCreator from '../components/InlineEventCreator';
import CalendarSkeleton from '../components/CalendarSkeleton';
import EventFilterBar from '../components/EventFilterBar';
import { getDateColor, getDateInfo, DATE_COLORS } from '../utils/dateUtils';
import { generateOptimizedMarkedDates, CalendarProcessingResult } from '../utils/optimizedCalendarUtils';
import { usePerformanceTracker } from '../utils/performanceTracker';
import { useCalendarCache } from '../utils/calendarCache';
import { useCouple } from '../contexts/CoupleContext';
import { EventOwnerType } from '../types/coupleTypes';

export default function CalendarScreen() {
  const navigation = useNavigation<NavigationProp<CalendarStackParamList>>();
  const { events, loading, getEventsByDate } = useFirebaseEvents();
  const [selectedDate, setSelectedDate] = useState('');
  const [showInlineCreator, setShowInlineCreator] = useState(false);
  const [calendarResult, setCalendarResult] = useState<CalendarProcessingResult>({
    markedDates: {},
    processedEventCount: 0,
    processingTime: 0,
    dateRange: { start: '', end: '' }
  });
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const performanceTracker = usePerformanceTracker();
  const calendarCache = useCalendarCache();
  const { filterState, isEventVisible, getEventColor, getEventOwnerInitial } = useCouple();

  const displayedEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const targetDate = selectedDate || today;
    const allEvents = getEventsByDate(targetDate);
    
    // フィルターを適用
    return allEvents.filter(event => {
      const ownerType = event.ownerType || 'shared'; // デフォルトは共通予定
      return isEventVisible(ownerType);
    });
  }, [selectedDate, events, filterState, isEventVisible, getEventsByDate]);

  // 最適化されたカレンダーマーキング処理（非同期版）
  useEffect(() => {
    if (loading) {
      setProcessingMessage('イベントを読み込み中...');
      return;
    }

    const processCalendar = async () => {
      setCalendarLoading(true);
      setProcessingMessage('カレンダーを処理中...');

      try {
        // 重い処理を次のフレームに遅延
        await new Promise(resolve => requestAnimationFrame(resolve));

        // キャッシュ統計を表示
        const cacheStats = calendarCache.getStats();
        if (cacheStats.hits + cacheStats.misses > 0) {
          setProcessingMessage(`キャッシュ確認中... (命中率: ${(cacheStats.hitRate * 100).toFixed(1)}%)`);
        }

        const result = generateOptimizedMarkedDates(events, selectedDate);
        setCalendarResult(result);

        // パフォーマンス情報をコンソールに出力（開発環境）
        if (__DEV__) {
          const updatedStats = calendarCache.getStats();
          console.log('📊 Calendar Performance:', {
            processedEvents: result.processedEventCount,
            processingTime: `${result.processingTime.toFixed(2)}ms`,
            dateRange: `${result.dateRange.start} to ${result.dateRange.end}`,
            cacheHitRate: `${(updatedStats.hitRate * 100).toFixed(1)}%`,
            cacheSize: updatedStats.size,
          });
        }

        setProcessingMessage('');
      } catch (error) {
        console.error('Calendar processing error:', error);
        setProcessingMessage('処理中にエラーが発生しました');
      } finally {
        setCalendarLoading(false);
      }
    };

    // イベント数が多い場合は処理をより分割
    const eventCount = events?.length || 0;
    if (eventCount > 100) {
      setProcessingMessage(`大量のイベントを処理中... (${eventCount}件)`);
      // 重い処理は少し遅延して実行
      const timer = setTimeout(processCalendar, 50);
      return () => clearTimeout(timer);
    } else {
      processCalendar();
    }
  }, [events, selectedDate, loading, calendarCache]);

  const renderEvent = ({ item }: { item: Event }) => {
    const ownerType = (item.ownerType || 'shared') as EventOwnerType;
    const ownerColor = getEventColor(ownerType);
    const ownerInitial = getEventOwnerInitial(ownerType);
    
    return (
      <TouchableOpacity 
        style={[
          styles.eventItem, 
          { borderLeftColor: ownerColor, borderLeftWidth: 4 },
          { backgroundColor: `${ownerColor}08` } // 薄い背景色
        ]}
        onPress={() => navigation.navigate('EventEdit', { eventId: item.id })}
      >
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle} numberOfLines={2} ellipsizeMode="tail">
              {item.title || '無題'}
            </Text>
            <View style={styles.eventIcons}>
              {/* 所有者アイコン */}
              <View style={[styles.ownerBadge, { backgroundColor: ownerColor }]}>
                <Text style={styles.ownerBadgeText}>{ownerInitial}</Text>
              </View>
              {/* カテゴリアイコン */}
              <Text style={styles.categoryIcon}>{item.category?.icon || '📅'}</Text>
            </View>
          </View>
        </View>
        {item.isAllDay ? (
          <Text style={styles.eventTime}>終日</Text>
        ) : (
          item.time && (
            <Text style={styles.eventTime}>
              {item.time}{item.endTime ? ` - ${item.endTime}` : ''}
            </Text>
          )
        )}
        {item.endDate && (
          <Text style={styles.eventDuration}>
            {item.date} - {item.endDate}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // 初回ローディング時はスケルトンスクリーンを表示
  if ((loading || calendarLoading) && Object.keys(calendarResult.markedDates).length === 0) {
    return <CalendarSkeleton processingMessage={processingMessage} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>カレンダー</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.quickAddButton}
            onPress={() => setShowInlineCreator(true)}
          >
            <Text style={styles.quickAddButtonText}>クイック追加</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('EventCreate')}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* フィルターバー */}
      <EventFilterBar />

      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#ff6b6b',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#ff6b6b',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#ff6b6b',
          selectedDotColor: '#ffffff',
          arrowColor: '#ff6b6b',
          disabledArrowColor: '#d9e1e8',
          monthTextColor: '#2d4150',
          indicatorColor: '#ff6b6b',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 13
        }}
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
        }}
        markedDates={calendarResult.markedDates}
        markingType="multi-dot"
        monthFormat={'yyyy年 MM月'}
        hideExtraDays={true}
        disableMonthChange={false}
        firstDay={0}
        hideDayNames={false}
        showWeekNumbers={false}
        onPressArrowLeft={(subtractMonth) => subtractMonth()}
        onPressArrowRight={(addMonth) => addMonth()}
        disableArrowLeft={false}
        disableArrowRight={false}
        disableAllTouchEventsForDisabledDays={true}
        renderHeader={(date) => {
          return (
            <Text style={styles.headerText}>
              {date.toString('yyyy年 MM月')}
            </Text>
          );
        }}
      />

      <View style={styles.eventsSection}>
        <View style={styles.eventsSectionHeader}>
          <Text style={styles.eventsTitle}>
            {selectedDate ? `${selectedDate}の予定` : '今日の予定'}
          </Text>
          {selectedDate && (() => {
            const dateInfo = getDateInfo(selectedDate);
            if (dateInfo.holidayName) {
              return (
                <Text style={[styles.holidayLabel, { color: dateInfo.color }]}>
                  {dateInfo.holidayName}
                </Text>
              );
            } else if (dateInfo.dateType === 'saturday') {
              return (
                <Text style={[styles.holidayLabel, { color: dateInfo.color }]}>
                  土曜日
                </Text>
              );
            } else if (dateInfo.dateType === 'sunday') {
              return (
                <Text style={[styles.holidayLabel, { color: dateInfo.color }]}>
                  日曜日
                </Text>
              );
            }
            return null;
          })()}
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color="#ff6b6b" style={styles.loading} />
        ) : displayedEvents.length > 0 ? (
          <FlatList
            data={displayedEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderEvent}
            style={styles.eventsList}
          />
        ) : (
          <Text style={styles.noEvents}>予定がありません</Text>
        )}
      </View>

      <InlineEventCreator
        visible={showInlineCreator}
        onClose={() => setShowInlineCreator(false)}
        selectedDate={selectedDate || new Date().toISOString().split('T')[0]}
        onEventCreated={() => {
          // イベント作成後の処理（必要に応じて）
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickAddButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ff6b6b',
    marginRight: 12,
  },
  quickAddButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#ff6b6b',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  calendar: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  eventsSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  eventsList: {
    flex: 1,
  },
  eventItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 16,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  eventDuration: {
    fontSize: 12,
    color: '#999',
  },
  noEvents: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 40,
  },
  loading: {
    marginTop: 40,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  holidayLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  eventIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ownerBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  ownerBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});