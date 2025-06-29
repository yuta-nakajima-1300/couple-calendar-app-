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
import { getDateColor, getDateInfo, DATE_COLORS } from '../utils/dateUtils';

export default function CalendarScreen() {
  const navigation = useNavigation<NavigationProp<CalendarStackParamList>>();
  const { events, loading, getEventsByDate } = useFirebaseEvents();
  const [selectedDate, setSelectedDate] = useState('');
  const [showInlineCreator, setShowInlineCreator] = useState(false);

  const displayedEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const targetDate = selectedDate || today;
    return getEventsByDate(targetDate);
  }, [selectedDate, events]);

  const markedDates = useMemo(() => {
    const dates: any = {};
    
    // 現在表示中の月の全日付に土日祝の色分けを適用
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    // 前月・今月・来月の3ヶ月分の日付を色分け
    for (let monthOffset = -1; monthOffset <= 1; monthOffset++) {
      const targetMonth = new Date(currentYear, currentMonth + monthOffset, 1);
      const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateColor = getDateColor(dateString);
        
        dates[dateString] = {
          ...dates[dateString],
          customTextStyle: {
            color: dateColor,
            fontWeight: dateColor !== DATE_COLORS.weekday ? 'bold' : 'normal'
          }
        };
      }
    }
    
    // Mark dates with events - 安全性チェックを追加
    if (!Array.isArray(events)) return dates;
    
    events.forEach(event => {
      if (!event || !event.date) return; // 不正なイベントをスキップ
      try {
        if (event.endDate) {
          // 連日予定の場合
          const startDate = new Date(event.date);
          const endDate = new Date(event.endDate);
          
          // 無効な日付をチェック
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn('Invalid date in event:', event);
            return;
          }
          
          const current = new Date(startDate);
          
          while (current <= endDate) {
            const dateString = current.toISOString().split('T')[0];
            const isStart = dateString === event.date;
            const isEnd = dateString === event.endDate;
            
            dates[dateString] = {
              ...dates[dateString],
              dots: [...(dates[dateString]?.dots || []), { color: event.category.color }]
            };
            current.setDate(current.getDate() + 1);
          }
        } else {
          // 単日予定
          if (event.date && event.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dates[event.date] = {
              ...dates[event.date],
              dots: [...(dates[event.date]?.dots || []), { color: event.category.color }]
            };
          }
        }
      } catch (error) {
        console.error('Error processing event for calendar:', event, error);
      }
    });

    // Mark selected date（土日祝の色分けを保持）
    if (selectedDate) {
      const dateColor = getDateColor(selectedDate);
      dates[selectedDate] = {
        ...dates[selectedDate],
        selected: true,
        selectedColor: '#007AFF',
        selectedTextColor: '#FFFFFF',
        customTextStyle: {
          ...dates[selectedDate]?.customTextStyle,
          color: '#FFFFFF', // 選択時は白文字
        }
      };
    }

    return dates;
  }, [events, selectedDate]);

  const renderEvent = ({ item }: { item: Event }) => (
    <TouchableOpacity 
      style={[styles.eventItem, { borderLeftColor: item.category.color }]}
      onPress={() => navigation.navigate('EventEdit', { eventId: item.id })}
    >
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle} numberOfLines={2} ellipsizeMode="tail">
            {item.title || '無題'}
          </Text>
          <Text style={styles.categoryIcon}>{item.category?.icon || '📅'}</Text>
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
      </View>
    </TouchableOpacity>
  );

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
        markedDates={markedDates}
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
});