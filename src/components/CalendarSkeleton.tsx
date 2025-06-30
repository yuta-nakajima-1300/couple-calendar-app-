// カレンダー読み込み中のスケルトンスクリーン

import React from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';

interface CalendarSkeletonProps {
  processingMessage?: string;
  progress?: number; // 0-1の進捗（オプション）
}

export default function CalendarSkeleton({ 
  processingMessage = "カレンダーを読み込み中...",
  progress 
}: CalendarSkeletonProps) {
  const fadeAnim = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      {/* ヘッダースケルトン */}
      <View style={styles.header}>
        <Animated.View 
          style={[styles.headerTitle, { opacity: fadeAnim }]} 
        />
        <View style={styles.headerButtons}>
          <Animated.View 
            style={[styles.button, { opacity: fadeAnim }]} 
          />
          <Animated.View 
            style={[styles.button, styles.addButton, { opacity: fadeAnim }]} 
          />
        </View>
      </View>

      {/* カレンダースケルトン */}
      <View style={styles.calendar}>
        {/* 月表示 */}
        <Animated.View 
          style={[styles.monthHeader, { opacity: fadeAnim }]} 
        />
        
        {/* 曜日ヘッダー */}
        <View style={styles.daysHeader}>
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <View key={day} style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* 日付グリッド */}
        <View style={styles.dateGrid}>
          {Array.from({ length: 35 }, (_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dateCell,
                { opacity: fadeAnim },
                index % 7 === 0 && styles.sundayCell,
                index % 7 === 6 && styles.saturdayCell,
              ]}
            />
          ))}
        </View>
      </View>

      {/* 予定セクションスケルトン */}
      <View style={styles.eventsSection}>
        <View style={styles.eventsSectionHeader}>
          <Animated.View 
            style={[styles.eventsTitle, { opacity: fadeAnim }]} 
          />
        </View>
        
        {/* 予定アイテムスケルトン */}
        {Array.from({ length: 3 }, (_, index) => (
          <Animated.View
            key={index}
            style={[styles.eventItem, { opacity: fadeAnim }]}
          >
            <View style={styles.eventContent}>
              <View style={styles.eventTitleSkeleton} />
              <View style={styles.eventTimeSkeleton} />
            </View>
          </Animated.View>
        ))}
      </View>

      {/* 進捗メッセージ */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>{processingMessage}</Text>
        {typeof progress === 'number' && (
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.max(0, Math.min(100, progress * 100))}%` }
              ]} 
            />
          </View>
        )}
      </View>
    </View>
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
  headerTitle: {
    width: 100,
    height: 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    width: 80,
    height: 32,
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
  },
  addButton: {
    width: 32,
  },
  calendar: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  monthHeader: {
    width: 120,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 16,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateCell: {
    width: '14.28%',
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    margin: 1,
  },
  sundayCell: {
    backgroundColor: '#ffe6e6',
  },
  saturdayCell: {
    backgroundColor: '#e6f3ff',
  },
  eventsSection: {
    flex: 1,
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventsSectionHeader: {
    marginBottom: 16,
  },
  eventsTitle: {
    width: 150,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  eventItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e0e0e0',
  },
  eventContent: {
    flex: 1,
  },
  eventTitleSkeleton: {
    width: '80%',
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 4,
  },
  eventTimeSkeleton: {
    width: '40%',
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  progressContainer: {
    padding: 16,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
});