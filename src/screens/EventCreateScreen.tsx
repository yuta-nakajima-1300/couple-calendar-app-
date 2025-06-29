import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { CalendarStackParamList } from '../types/navigation';
import { useFirebaseEvents } from '../contexts/FirebaseEventContext';
import DateRangePicker from '../components/DateRangePicker';
import CategoryPicker from '../components/CategoryPicker';
import TimePicker from '../components/TimePicker';
import RecurringPicker from '../components/RecurringPicker';
import EventOwnershipPicker from '../components/EventOwnershipPicker';
import { EventCategory, DEFAULT_CATEGORIES, RecurringRule } from '../types';
import { EventOwnerType } from '../types/coupleTypes';
import { useCouple } from '../contexts/CoupleContext';
import { generateRecurringEvents, generateRecurringId, getRecurringEventSummary } from '../utils/recurringEventGenerator';

export default function EventCreateScreen() {
  const navigation = useNavigation<NavigationProp<CalendarStackParamList>>();
  const { createEvent } = useFirebaseEvents();
  const { settings } = useCouple();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [category, setCategory] = useState<EventCategory>(DEFAULT_CATEGORIES[0]);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRecurringPicker, setShowRecurringPicker] = useState(false);
  const [recurringRule, setRecurringRule] = useState<RecurringRule | undefined>(undefined);
  const [ownerType, setOwnerType] = useState<EventOwnerType>(settings.defaultEventType);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }

    if (!date.trim()) {
      Alert.alert('エラー', '日付を選択してください');
      return;
    }

    // Validate time format if provided
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

      if (recurringRule) {
        // 繰り返し予定の場合
        const recurringId = generateRecurringId();
        const baseEventData = {
          title: title.trim(),
          description: description.trim(),
          time: isAllDay ? undefined : time || undefined,
          endTime: isAllDay ? undefined : endTime || undefined,
          isAllDay,
          category,
          ownerType,
          createdBy: 'current-user',
        };

        const recurringEvents = generateRecurringEvents(
          baseEventData,
          date,
          recurringRule,
          recurringId
        );

        // 各繰り返し予定を作成
        for (const eventData of recurringEvents) {
          await createEvent(eventData);
        }

        if (Platform.OS === 'web') {
          window.alert(`${recurringEvents.length}個の繰り返し予定を作成しました`);
        } else {
          Alert.alert('成功', `${recurringEvents.length}個の繰り返し予定を作成しました`);
        }
      } else {
        // 通常の予定
        await createEvent({
          title: title.trim(),
          description: description.trim(),
          date,
          endDate,
          time: isAllDay ? undefined : time || undefined,
          endTime: isAllDay ? undefined : endTime || undefined,
          isAllDay,
          category,
          ownerType,
          createdBy: 'current-user',
        });
      }

      // カレンダー画面に戻る
      navigation.navigate('CalendarHome');
    } catch (error) {
      console.error('Event creation error:', error);
      if (Platform.OS === 'web') {
        window.alert('予定の作成に失敗しました');
      } else {
        Alert.alert('エラー', '予定の作成に失敗しました');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || description.trim() || date.trim() || time.trim() || endTime.trim()) {
      Alert.alert(
        '確認',
        '入力内容が破棄されます。よろしいですか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '破棄', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
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
        <Text style={styles.headerTitle}>予定作成</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
            {saving ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>
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
          />
          <Text style={styles.charCount}>{description.length}/200</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>繰り返し</Text>
          <TouchableOpacity 
            style={styles.recurringButton} 
            onPress={() => setShowRecurringPicker(true)}
          >
            <Text style={[styles.recurringText, !recurringRule && styles.placeholderText]}>
              {recurringRule ? getRecurringEventSummary(recurringRule) : '繰り返しなし'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>予定の種類</Text>
          <EventOwnershipPicker
            selectedType={ownerType}
            onTypeChange={setOwnerType}
          />
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

      <RecurringPicker
        recurringRule={recurringRule}
        onRuleChange={setRecurringRule}
        visible={showRecurringPicker}
        onClose={() => setShowRecurringPicker(false)}
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
  recurringButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recurringText: {
    fontSize: 16,
    color: '#333',
  },
});