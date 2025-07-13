import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform
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
import CalendarSwipeGesture from '../components/CalendarSwipeGesture';
import { getDateColor, getDateInfo, DATE_COLORS } from '../utils/dateUtils';
import { generateOptimizedMarkedDates, CalendarProcessingResult } from '../utils/optimizedCalendarUtils';
import { useCouple } from '../contexts/CoupleContext';
import { EventOwnerType } from '../types/coupleTypes';
import { japaneseHolidays, getHolidayName } from '../constants/japaneseHolidays';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375;
const isMobile = Platform.OS !== 'web' || screenWidth < 768;

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
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().split('T')[0]);
  const { filterState, isEventVisible, getEventColor, getEventOwnerInitial, settings } = useCouple();

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

  // 大幅軽量化されたカレンダーマーキング処理
  useEffect(() => {
    if (loading) return;

    const processCalendar = () => {
      setCalendarLoading(true);
      setProcessingMessage('');

      try {
        const result = generateOptimizedMarkedDates(events, selectedDate);
        
        // 祝日表示が有効な場合、祝日をマークに追加
        if (settings.calendarSettings.showHolidays) {
          const enhancedMarkedDates = { ...result.markedDates };
          
          japaneseHolidays.forEach(holiday => {
            const existingMark = enhancedMarkedDates[holiday.date];
            const isSelected = selectedDate === holiday.date;
            
            if (existingMark) {
              // 既存のマークがある場合、祝日スタイルを上書き（予定がある祝日は少し異なる色）
              enhancedMarkedDates[holiday.date] = {
                ...existingMark,
                customStyles: {
                  container: {
                    backgroundColor: existingMark.dots && existingMark.dots.length > 0 ? '#f8bbd9' : '#ffcdd2',
                    borderRadius: 6,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: existingMark.dots && existingMark.dots.length > 0 ? 2 : 0,
                    borderColor: '#c62828',
                  },
                  text: {
                    color: '#c62828',
                    fontWeight: 'bold',
                  }
                }
              };
            } else {
              // 新しいマークを作成（祝日のみ）
              enhancedMarkedDates[holiday.date] = {
                customStyles: {
                  container: {
                    backgroundColor: '#ffcdd2',
                    borderRadius: 6,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                  text: {
                    color: '#c62828',
                    fontWeight: 'bold',
                  }
                }
              };
            }
          });
          
          result.markedDates = enhancedMarkedDates;
        }
        
        setCalendarResult(result);
        
        // 開発環境での簡易ログ（50ms以上のみ）
        if (__DEV__ && result.processingTime > 50) {
          console.log(`⚡ Calendar processed: ${result.processingTime.toFixed(2)}ms`);
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Calendar processing error:', error);
        }
      } finally {
        setCalendarLoading(false);
      }
    };

    // 即座に実行（デバウンスなし）
    processCalendar();
  }, [events, selectedDate, loading, settings.calendarSettings.showHolidays, settings.calendarSettings.weekStartsOnMonday]);

  // スワイプナビゲーション（アニメーション対応）
  const handleSwipeLeft = () => {
    // 左スワイプ = 次月
    const currentDate = new Date(currentMonth);
    currentDate.setMonth(currentDate.getMonth() + 1);
    const newMonth = currentDate.toISOString().split('T')[0];
    console.log('Swipe left - moving to next month:', newMonth);
    
    // アニメーション中にカレンダー更新（より滑らか）
    setTimeout(() => {
      setCurrentMonth(newMonth);
    }, 100);
  };

  const handleSwipeRight = () => {
    // 右スワイプ = 前月
    const currentDate = new Date(currentMonth);
    currentDate.setMonth(currentDate.getMonth() - 1);
    const newMonth = currentDate.toISOString().split('T')[0];
    console.log('Swipe right - moving to previous month:', newMonth);
    
    setTimeout(() => {
      setCurrentMonth(newMonth);
    }, 100);
  };

  const handleSwipeUp = () => {
    // 上スワイプ = 次月（垂直方向設定時）
    const currentDate = new Date(currentMonth);
    currentDate.setMonth(currentDate.getMonth() + 1);
    const newMonth = currentDate.toISOString().split('T')[0];
    console.log('Swipe up - moving to next month:', newMonth);
    
    setTimeout(() => {
      setCurrentMonth(newMonth);
    }, 100);
  };

  const handleSwipeDown = () => {
    // 下スワイプ = 前月（垂直方向設定時）
    const currentDate = new Date(currentMonth);
    currentDate.setMonth(currentDate.getMonth() - 1);
    const newMonth = currentDate.toISOString().split('T')[0];
    console.log('Swipe down - moving to previous month:', newMonth);
    
    setTimeout(() => {
      setCurrentMonth(newMonth);
    }, 100);
  };

  const renderEvent = ({ item }: { item: Event }) => {
    const ownerType = (item.ownerType || 'shared') as EventOwnerType;
    const ownerColor = getEventColor(ownerType);
    const ownerInitial = getEventOwnerInitial(ownerType);
    
    return (
      <TouchableOpacity 
        style={[
          styles.eventItem, 
          { 
            borderLeftColor: ownerColor, 
            borderLeftWidth: 4,
          }
        ]}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
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
  if (loading) {
    return <CalendarSkeleton processingMessage="読み込み中..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* フィルターバー */}
      <EventFilterBar compact={isMobile} />

      <CalendarSwipeGesture
        key={`swipe-${settings.swipeSettings.direction}-${settings.swipeSettings.sensitivity}`}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        onSwipeUp={handleSwipeUp}
        onSwipeDown={handleSwipeDown}
      >
        <Calendar
        key={`${currentMonth}-${settings.calendarSettings.weekStartsOnMonday}-${settings.calendarSettings.showHolidays}-v3`} // Force re-render when month or settings change
        style={styles.calendar}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#666666',
          selectedDayBackgroundColor: '#007AFF',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#ff6b6b',
          dayTextColor: '#333333',
          textDisabledColor: '#999999',
          dotColor: '#ff6b6b',
          selectedDotColor: '#ffffff',
          arrowColor: '#ff6b6b',
          disabledArrowColor: '#999999',
          monthTextColor: '#333333',
          indicatorColor: '#ff6b6b',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: isMobile ? 14 : 16,
          textMonthFontSize: isMobile ? 14 : 16,
          textDayHeaderFontSize: isMobile ? 11 : 13,
          // 曜日ヘッダーの色分け
          'stylesheet.calendar.header': {
            dayHeader: {
              color: '#666666'
            },
            week: {
              marginTop: 5,
              flexDirection: 'row',
              justifyContent: 'space-around'
            }
          },
          // 日付テキストの色分け（すべてのケースに対応）
          'stylesheet.day.basic': {
            base: {
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center'
            },
            text: {
              marginTop: Platform.OS === 'android' ? 4 : 6,
              fontSize: isMobile ? 14 : 16,
              fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'Roboto',
              fontWeight: '300',
              color: '#333333'
            },
            today: {
              backgroundColor: 'transparent'
            },
            todayText: {
              color: '#ff6b6b',
              fontWeight: 'bold'
            }
          },
          'stylesheet.day.multiDot': {
            base: {
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center'
            },
            text: {
              marginTop: Platform.OS === 'android' ? 4 : 6,
              fontSize: isMobile ? 14 : 16,
              fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'Roboto',
              fontWeight: '300',
              color: '#333333'
            },
            today: {
              backgroundColor: 'transparent'
            },
            todayText: {
              color: '#ff6b6b',
              fontWeight: 'bold'
            }
          }
        }}
        firstDay={settings.calendarSettings.weekStartsOnMonday ? 1 : 0}
        showWeekNumbers={settings.calendarSettings.showWeekNumbers}
        monthFormat={
          settings.calendarSettings.monthFormat === 'japanese' ? 'yyyy年 MM月' :
          settings.calendarSettings.monthFormat === 'english' ? 'MMMM yyyy' : 'MM月'
        }
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
        }}
        markedDates={calendarResult.markedDates as any}
        markingType="custom"
        hideExtraDays={true}
        disableMonthChange={true}
        hideDayNames={false}
        onPressArrowLeft={() => handleSwipeRight()}
        onPressArrowRight={() => handleSwipeLeft()}
        disableArrowLeft={false}
        disableArrowRight={false}
        disableAllTouchEventsForDisabledDays={true}
        current={currentMonth}
        // onMonthChange disabled to prevent conflicts with swipe navigation
        renderHeader={(date) => {
          const formatMap = {
            japanese: 'yyyy年 MM月',
            english: 'MMMM yyyy',
            short: 'MM月'
          };
          const format = formatMap[settings.calendarSettings.monthFormat] || 'yyyy年 MM月';
          return (
            <Text style={styles.headerText}>
              {date.toString(format)}
            </Text>
          );
        }}
        />
      </CalendarSwipeGesture>

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
        
        {/* インライン予定作成フォーム */}
        <View style={styles.inlineCreatorContainer}>
          <TouchableOpacity
            style={styles.inlineAddButton}
            onPress={() => setShowInlineCreator(true)}
          >
            <Text style={styles.inlineAddButtonText}>+ 予定を追加</Text>
          </TouchableOpacity>
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
          <View style={styles.noEventsContainer}>
            <Text style={styles.noEvents}>予定がありません</Text>
          </View>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: isMobile ? 16 : 20,
    paddingVertical: isMobile ? 12 : 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    ...(Platform.OS === 'ios' && {
      paddingTop: isMobile ? 8 : 16,
    }),
  },
  title: {
    fontSize: isMobile ? 18 : 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickAddButton: {
    backgroundColor: '#fff',
    paddingHorizontal: isMobile ? 10 : 12,
    paddingVertical: isMobile ? 10 : 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ff6b6b',
    marginRight: isMobile ? 8 : 12,
    minHeight: 44, // iOS Human Interface Guidelines minimum touch target
  },
  quickAddButtonText: {
    color: '#ff6b6b',
    fontSize: isMobile ? 12 : 14,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#ff6b6b',
    width: isMobile ? 44 : 40,
    height: isMobile ? 44 : 40,
    borderRadius: isMobile ? 22 : 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: isMobile ? 20 : 24,
    fontWeight: 'bold',
  },
  calendar: {
    backgroundColor: '#fff',
    marginHorizontal: isMobile ? 8 : 16,
    marginTop: isMobile ? 8 : 16,
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
    paddingHorizontal: isMobile ? 8 : 16,
    paddingTop: isMobile ? 12 : 20,
  },
  eventsTitle: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
    marginBottom: isMobile ? 8 : 12,
    color: '#333',
  },
  eventsList: {
    flex: 1,
  },
  eventItem: {
    backgroundColor: '#fff',
    padding: isMobile ? 12 : 16,
    marginBottom: isMobile ? 6 : 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 44, // Minimum touch target size
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
    fontSize: isMobile ? 14 : 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  categoryIcon: {
    fontSize: isMobile ? 14 : 16,
  },
  eventTime: {
    fontSize: isMobile ? 12 : 14,
    color: '#666',
    marginBottom: 2,
  },
  eventDuration: {
    fontSize: isMobile ? 10 : 12,
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
    width: isMobile ? 18 : 20,
    height: isMobile ? 18 : 20,
    borderRadius: isMobile ? 9 : 10,
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
    fontSize: isMobile ? 8 : 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  inlineCreatorContainer: {
    marginBottom: isMobile ? 12 : 16,
  },
  inlineAddButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: isMobile ? 12 : 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineAddButtonText: {
    color: '#ff6b6b',
    fontSize: isMobile ? 14 : 16,
    fontWeight: '500',
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});