import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onDateChange: (startDate: string, endDate?: string) => void;
  visible: boolean;
  onClose: () => void;
  allowMultipleDays?: boolean;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  visible,
  onClose,
  allowMultipleDays = false
}: DateRangePickerProps) {
  const [selectedStartDate, setSelectedStartDate] = useState<string>(startDate || '');
  const [selectedEndDate, setSelectedEndDate] = useState<string>(endDate || '');
  const [isMultipleDays, setIsMultipleDays] = useState<boolean>(!!endDate);
  const [isSelectingEndDate, setIsSelectingEndDate] = useState(false);

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getMarkedDates = () => {
    const marked: any = {};

    if (selectedStartDate) {
      marked[selectedStartDate] = {
        selected: true,
        selectedColor: '#ff6b6b',
        startingDay: true,
        endingDay: !selectedEndDate || selectedStartDate === selectedEndDate,
      };
    }

    if (selectedEndDate && selectedEndDate !== selectedStartDate) {
      marked[selectedEndDate] = {
        selected: true,
        selectedColor: '#ff6b6b',
        endingDay: true,
      };

      // 期間中の日付をマークする
      const start = new Date(selectedStartDate);
      const end = new Date(selectedEndDate);
      const current = new Date(start);
      current.setDate(current.getDate() + 1);

      while (current < end) {
        const dateString = current.toISOString().split('T')[0];
        marked[dateString] = {
          selected: true,
          selectedColor: '#ffb3b3',
        };
        current.setDate(current.getDate() + 1);
      }
    }

    return marked;
  };

  const handleDayPress = (day: DateData) => {
    if (!allowMultipleDays || !isMultipleDays) {
      // 単日予定の場合
      setSelectedStartDate(day.dateString);
      setSelectedEndDate('');
      setIsSelectingEndDate(false);
      return;
    }

    if (!selectedStartDate || (selectedStartDate && selectedEndDate && !isSelectingEndDate)) {
      // 新しい開始日を選択
      setSelectedStartDate(day.dateString);
      setSelectedEndDate('');
      setIsSelectingEndDate(true);
    } else if (isSelectingEndDate) {
      // 終了日を選択
      const startDate = new Date(selectedStartDate);
      const endDate = new Date(day.dateString);
      
      if (endDate >= startDate) {
        setSelectedEndDate(day.dateString);
        setIsSelectingEndDate(false);
      } else {
        // 開始日より前の日付が選択された場合、新しい開始日とする
        setSelectedStartDate(day.dateString);
        setSelectedEndDate('');
      }
    }
  };

  const handleConfirm = () => {
    if (isMultipleDays && allowMultipleDays) {
      onDateChange(selectedStartDate, selectedEndDate || undefined);
    } else {
      onDateChange(selectedStartDate, undefined);
    }
    onClose();
  };

  const handleCancel = () => {
    setSelectedStartDate(startDate || '');
    setSelectedEndDate(endDate || '');
    setIsMultipleDays(!!endDate);
    setIsSelectingEndDate(false);
    onClose();
  };

  const toggleMultipleDays = () => {
    setIsMultipleDays(!isMultipleDays);
    if (!isMultipleDays) {
      // 連日予定に切り替える場合
      setSelectedEndDate('');
      if (selectedStartDate) {
        setIsSelectingEndDate(true);
      }
    } else {
      // 単日予定に切り替える場合
      setSelectedEndDate('');
      setIsSelectingEndDate(false);
    }
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet"
      accessible={true}
      accessibilityViewIsModal={true}
      aria-hidden={!visible}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelButton}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={styles.title}>日付を選択</Text>
          <TouchableOpacity onPress={handleConfirm} disabled={!selectedStartDate}>
            <Text style={[styles.confirmButton, !selectedStartDate && styles.disabledButton]}>
              完了
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateInfo}>
          <Text style={styles.dateInfoText}>
            {selectedStartDate ? (
              selectedEndDate && selectedEndDate !== selectedStartDate 
                ? `${formatDate(selectedStartDate)} - ${formatDate(selectedEndDate)}`
                : formatDate(selectedStartDate)
            ) : (
              '日付を選択してください'
            )}
          </Text>
          {allowMultipleDays && (
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, !isMultipleDays && styles.activeToggle]}
                onPress={() => !isMultipleDays || toggleMultipleDays()}
              >
                <Text style={[styles.toggleButtonText, !isMultipleDays && styles.activeToggleText]}>
                  単日予定
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, isMultipleDays && styles.activeToggle]}
                onPress={() => isMultipleDays || toggleMultipleDays()}
              >
                <Text style={[styles.toggleButtonText, isMultipleDays && styles.activeToggleText]}>
                  連日予定
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {allowMultipleDays && isMultipleDays && selectedStartDate && isSelectingEndDate && (
            <Text style={styles.helpText}>終了日を選択してください</Text>
          )}
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
          onDayPress={handleDayPress}
          markedDates={getMarkedDates()}
          markingType={'period'}
          monthFormat={'yyyy年 MM月'}
          hideExtraDays={true}
          firstDay={0}
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
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  disabledButton: {
    color: '#ccc',
  },
  dateInfo: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dateInfoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
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
  toggleContainer: {
    flexDirection: 'row',
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    padding: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#ff6b6b',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeToggleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});