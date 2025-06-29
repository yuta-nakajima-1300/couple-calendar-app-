import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Switch,
  Modal,
  ScrollView
} from 'react-native';
import { useFirebaseEvents } from '../contexts/FirebaseEventContext';
import CategoryPicker from './CategoryPicker';
import TimePicker from './TimePicker';
import { EventCategory, DEFAULT_CATEGORIES } from '../types';

interface InlineEventCreatorProps {
  visible: boolean;
  onClose: () => void;
  selectedDate?: string;
  onEventCreated?: () => void;
}

export default function InlineEventCreator({
  visible,
  onClose,
  selectedDate,
  onEventCreated
}: InlineEventCreatorProps) {
  const { createEvent } = useFirebaseEvents();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [category, setCategory] = useState<EventCategory>(DEFAULT_CATEGORIES[0]);
  const [saving, setSaving] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTime('');
    setEndTime('');
    setIsAllDay(false);
    setCategory(DEFAULT_CATEGORIES[0]);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }

    if (!selectedDate) {
      Alert.alert('エラー', '日付が選択されていません');
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
      await createEvent({
        title: title.trim(),
        description: description.trim(),
        date: selectedDate,
        time: isAllDay ? undefined : time || undefined,
        endTime: isAllDay ? undefined : endTime || undefined,
        isAllDay,
        category,
        createdBy: 'current-user',
      });

      resetForm();
      onEventCreated?.();
      onClose();
    } catch (error) {
      Alert.alert('エラー', '予定の作成に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || description.trim() || time.trim() || endTime.trim()) {
      Alert.alert(
        '確認',
        '入力内容が破棄されます。よろしいですか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '破棄', style: 'destructive', onPress: () => {
            resetForm();
            onClose();
          }}
        ]
      );
    } else {
      resetForm();
      onClose();
    }
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

  const formatDisplayDate = () => {
    if (!selectedDate) return '';
    const date = new Date(selectedDate);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };


  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelButton}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {formatDisplayDate()}の予定作成
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
              {saving ? '保存中...' : '保存'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>タイトル *</Text>
            <TextInput
              style={styles.input}
              placeholder="予定のタイトルを入力"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
              autoFocus={true}
              autoCorrect={false}
              spellCheck={false}
              keyboardType="default"
              returnKeyType="done"
            />
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
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={200}
              autoCorrect={false}
              spellCheck={false}
              keyboardType="default"
              returnKeyType="done"
            />
            <Text style={styles.charCount}>{description.length}/200</Text>
          </View>

        </ScrollView>

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
      </View>
    </Modal>
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
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
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
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 20,
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
    height: 80,
    textAlignVertical: 'top',
  },
  allDayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  placeholderText: {
    color: '#999',
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
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
});