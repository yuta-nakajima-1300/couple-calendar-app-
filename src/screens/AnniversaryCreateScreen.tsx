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
  Image,
  Switch
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { AnniversaryStackParamList } from '../types/navigation';
import { useAnniversaries } from '../contexts/AnniversaryContext';
import { PhotoService } from '../services/photoService';
import DateRangePicker from '../components/DateRangePicker';
import TimePicker from '../components/TimePicker';

export default function AnniversaryCreateScreen() {
  const navigation = useNavigation<NavigationProp<AnniversaryStackParamList>>();
  const { createAnniversary } = useAnniversaries();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [time, setTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }

    if (!date.trim()) {
      Alert.alert('エラー', '日付を選択してください');
      return;
    }

    try {
      setSaving(true);
      await createAnniversary({
        title: title.trim(),
        description: description.trim(),
        date,
        isRecurring,
        photo,
        createdBy: 'current-user',
      });

      // 記念日画面に戻る
      navigation.goBack();
    } catch (error) {
      Alert.alert('エラー', '記念日の作成に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || description.trim() || date.trim() || time.trim() || photo) {
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

  const handleDateChange = (startDate: string) => {
    setDate(startDate);
  };

  const formatDisplayDate = () => {
    if (!date) return '日付を選択';
    const dateObj = new Date(date);
    return `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
  };

  const handleTimeChange = (startTime: string) => {
    setTime(startTime);
  };

  const formatDisplayTime = () => {
    if (!time) return '時刻を選択';
    return time;
  };

  const handlePhotoPress = () => {
    PhotoService.showPhotoOptions(
      async () => {
        const selectedPhoto = await PhotoService.selectPhoto();
        if (selectedPhoto) {
          setPhoto(selectedPhoto);
        }
      },
      async () => {
        const takenPhoto = await PhotoService.takePhoto();
        if (takenPhoto) {
          setPhoto(takenPhoto);
        }
      },
      photo ? () => setPhoto(undefined) : undefined
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>キャンセル</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>記念日作成</Text>
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
            placeholder="記念日のタイトルを入力"
            value={title}
            onChangeText={setTitle}
            maxLength={50}
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
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.allDayContainer}>
            <Text style={styles.label}>終日記念日</Text>
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
            <Text style={styles.hint}>特定の時刻がある場合のみ</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <View style={styles.recurringContainer}>
            <Text style={styles.label}>毎年繰り返す</Text>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: '#e0e0e0', true: '#ff6b6b' }}
              thumbColor={isRecurring ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>詳細</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="記念日の詳細を入力（任意）"
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={200}
          />
          <Text style={styles.charCount}>{description.length}/200</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>写真</Text>
          <TouchableOpacity style={styles.photoButton} onPress={handlePhotoPress}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photoPreview} />
            ) : (
              <Text style={styles.photoButtonText}>写真を追加</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.hint}>1枚まで添付可能</Text>
        </View>
      </ScrollView>

      <DateRangePicker
        startDate={date}
        onDateChange={handleDateChange}
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        allowMultipleDays={false}
      />

      <TimePicker
        startTime={time}
        onTimeChange={handleTimeChange}
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        allowEndTime={false}
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
  recurringContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoButton: {
    backgroundColor: '#fff',
    paddingVertical: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    fontSize: 16,
    color: '#666',
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
  photoPreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
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
});