import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  Platform,
  Switch
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { CalendarStackParamList } from '../types/navigation';
import { useFirebaseEvents } from '../contexts/FirebaseEventContext';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import DateRangePicker from '../components/DateRangePicker';
import CategoryPicker from '../components/CategoryPicker';
import TimePicker from '../components/TimePicker';
import RecurringDeleteModal from '../components/RecurringDeleteModal';
import { EventCategory, DEFAULT_CATEGORIES } from '../types';

export default function EventEditScreen() {
  const navigation = useNavigation<NavigationProp<CalendarStackParamList>>();
  const route = useRoute();
  
  // パラメータの型安全性チェック
  const eventId = (() => {
    if (!route.params || typeof route.params !== 'object') {
      console.error('EventEditScreen: Invalid route params');
      navigation.goBack();
      return '';
    }
    const params = route.params as any;
    if (!params.eventId || typeof params.eventId !== 'string') {
      console.error('EventEditScreen: Missing or invalid eventId parameter');
      navigation.goBack();
      return '';
    }
    return params.eventId;
  })();
  const { events, updateEvent, deleteEvent } = useFirebaseEvents();
  const { user, userProfile } = useFirebaseAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [category, setCategory] = useState<EventCategory>(DEFAULT_CATEGORIES[0]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRecurringDeleteModal, setShowRecurringDeleteModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any>(null);

  useEffect(() => {
    console.log('EventEditScreen useEffect が実行されました');
    console.log('eventId:', eventId);
    console.log('events配列の長さ:', events.length);
    console.log('ユーザー情報:', { 
      userId: user?.uid, 
      userEmail: user?.email,
      userProfile: userProfile 
    });
    
    const event = events.find(e => e.id === eventId);
    console.log('見つかったイベント:', event);
    
    if (event) {
      console.log('イベントデータをセットします');
      setCurrentEvent(event);
      setTitle(event.title);
      setDescription(event.description || '');
      setDate(event.date);
      setEndDate(event.endDate);
      setTime(event.time || '');
      setEndTime(event.endTime || '');
      setIsAllDay(event.isAllDay || false);
      setCategory(event.category);
    } else {
      console.warn('指定されたIDのイベントが見つかりません:', eventId);
    }
  }, [eventId, events, user, userProfile]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }

    if (!date.trim()) {
      Alert.alert('エラー', '日付を選択してください');
      return;
    }

    if (!isAllDay && time && !/^\d{2}:\d{2}$/.test(time)) {
      Alert.alert('エラー', '時刻の形式が正しくありません（HH:MM）');
      return;
    }

    if (!isAllDay && endTime && !/^\d{2}:\d{2}$/.test(endTime)) {
      Alert.alert('エラー', '終了時刻の形式が正しくありません（HH:MM）');
      return;
    }

    try {
      setSaving(true);
      await updateEvent(eventId, {
        title: title.trim(),
        description: description.trim(),
        date,
        endDate,
        time: isAllDay ? undefined : time || undefined,
        endTime: isAllDay ? undefined : endTime || undefined,
        isAllDay,
        category,
      });

      // カレンダー画面に戻る
      navigation.navigate('CalendarHome');
    } catch (error) {
      Alert.alert('エラー', '予定の更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    console.log('削除ボタンがクリックされました');
    console.log('Current event:', currentEvent);
    console.log('Event ID:', eventId);
    console.log('Recurring ID:', currentEvent?.recurringId);
    
    // 繰り返し予定かチェック
    if (currentEvent?.recurringId) {
      console.log('繰り返し予定として処理します');
      console.log('RecurringDeleteModalを表示します');
      console.log('現在のshowRecurringDeleteModal状態:', showRecurringDeleteModal);
      
      // 繰り返し予定の場合は専用モーダルを表示
      setShowRecurringDeleteModal(true);
      console.log('setShowRecurringDeleteModal(true)を実行しました');
    } else {
      console.log('通常の予定として処理します');
      // 通常の予定の場合は従来の削除処理
      handleSingleDelete();
    }
  };

  const handleSingleDelete = () => {
    console.log('handleSingleDelete が呼び出されました');
    console.log('Platform:', Platform.OS);
    
    if (Platform.OS === 'web') {
      console.log('Web環境での削除確認ダイアログを表示します');
      // Web環境での確認ダイアログ
      const confirmed = window.confirm('この予定を削除しますか？');
      console.log('確認ダイアログの結果:', confirmed);
      if (confirmed) {
        performDelete();
      }
    } else {
      console.log('モバイル環境での削除確認ダイアログを表示します');
      // モバイル環境
      Alert.alert(
        '確認',
        'この予定を削除しますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          { 
            text: '削除', 
            style: 'destructive', 
            onPress: () => {
              console.log('削除が確認されました');
              performDelete();
            }
          }
        ]
      );
    }
  };

  const handleRecurringDeleteSuccess = () => {
    // 繰り返し予定削除成功後にカレンダー画面に戻る
    navigation.navigate('CalendarHome');
  };

  const performDelete = async () => {
    try {
      console.log('Performing delete for event:', eventId); // デバッグ用
      console.log('Current event:', currentEvent); // デバッグ用
      setDeleting(true);
      const success = await deleteEvent(eventId);
      console.log('Delete result:', success); // デバッグ用
      if (success) {
        // カレンダー画面に戻る
        navigation.navigate('CalendarHome');
      } else {
        const errorMessage = '予定の削除に失敗しました（戻り値がfalse）';
        console.error(errorMessage);
        if (Platform.OS === 'web') {
          window.alert(errorMessage);
        } else {
          Alert.alert('エラー', errorMessage);
        }
      }
    } catch (error) {
      console.error('Delete error details:', error);
      let errorMessage = '予定の削除に失敗しました';
      if (error instanceof Error) {
        errorMessage = `削除エラー: ${error.message}`;
      }
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('エラー', errorMessage);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleDateChange = (startDate: string, endDate?: string) => {
    setDate(startDate);
    setEndDate(endDate);
  };

  const formatDisplayDate = () => {
    if (!date) return '日付を選択';
    const startDate = new Date(date);
    const startStr = `${startDate.getMonth() + 1}月${startDate.getDate()}日`;
    
    if (endDate) {
      const endDateObj = new Date(endDate);
      const endStr = `${endDateObj.getMonth() + 1}月${endDateObj.getDate()}日`;
      return `${startStr} - ${endStr}`;
    }
    
    return startStr;
  };

  const handleTimeChange = (startTime: string, endTime?: string) => {
    setTime(startTime);
    if (endTime) {
      setEndTime(endTime);
    }
  };

  const formatDisplayTime = () => {
    if (!time) return '時刻を選択';
    return endTime ? `${time} - ${endTime}` : time;
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>キャンセル</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>予定編集</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => {
              console.log('削除ボタンがタップされました');
              handleDelete();
            }} 
            disabled={deleting} 
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>
              {deleting ? '削除中...' : currentEvent?.recurringId ? '削除...' : '削除'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButtonContainer}>
            <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
              {saving ? '保存中...' : '保存'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>タイトル *</Text>
          <TextInput
            style={styles.input}
            placeholder="予定のタイトルを入力"
            value={title}
            onChangeText={setTitle}
            maxLength={50}
            autoCorrect={false}
            spellCheck={false}
            keyboardType="default"
            returnKeyType="done"
            nativeID="edit-event-title"
            accessibilityLabel="予定のタイトル"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>日付 *</Text>
          <TouchableOpacity 
            style={styles.datePickerButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.datePickerText, !date && styles.placeholderText]}>
              {formatDisplayDate()}
            </Text>
          </TouchableOpacity>
          {endDate && (
            <Text style={styles.hint}>連日予定</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.allDayContainer}>
            <Text style={styles.label}>終日予定</Text>
            <Switch
              value={isAllDay}
              onValueChange={setIsAllDay}
              trackColor={{ false: '#e0e0e0', true: '#ff6b6b' }}
              thumbColor={isAllDay ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {!isAllDay && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>時刻</Text>
            <TouchableOpacity 
              style={styles.timePickerButton} 
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={[styles.timePickerText, !time && styles.placeholderText]}>
                {formatDisplayTime()}
              </Text>
            </TouchableOpacity>
            <Text style={styles.hint}>時計から選択 (終了時刻は任意)</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>カテゴリー</Text>
          <TouchableOpacity 
            style={styles.categoryButton} 
            onPress={() => setShowCategoryPicker(true)}
          >
            <View style={styles.categoryContent}>
              <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryText}>{category.name}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>詳細</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="予定の詳細を入力（任意）"
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={200}
            autoCorrect={false}
            spellCheck={false}
            keyboardType="default"
            returnKeyType="done"
            nativeID="edit-event-description"
            accessibilityLabel="予定の詳細"
          />
          <Text style={styles.charCount}>{description.length}/200</Text>
        </View>

      </ScrollView>

      <DateRangePicker
        startDate={date}
        endDate={endDate}
        onDateChange={handleDateChange}
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        allowMultipleDays={true}
      />

      <CategoryPicker
        selectedCategory={category}
        onCategorySelect={setCategory}
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
      />

      <TimePicker
        startTime={time}
        endTime={endTime}
        onTimeChange={handleTimeChange}
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        allowEndTime={true}
      />

      <RecurringDeleteModal
        visible={showRecurringDeleteModal}
        onClose={() => setShowRecurringDeleteModal(false)}
        event={currentEvent}
        selectedDate={date}
        onDeleteSuccess={handleRecurringDeleteSuccess}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginRight: 16,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#ff4757',
    fontWeight: 'bold',
  },
  saveButtonContainer: {},
  saveButton: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  saveButtonDisabled: {
    color: '#ccc',
  },
  form: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  allDayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInputWrapper: {
    flex: 0.48,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  categoryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  timePickerButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timePickerText: {
    fontSize: 16,
    color: '#333',
  },
});