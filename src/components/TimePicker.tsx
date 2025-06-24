import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';

interface TimePickerProps {
  startTime?: string;
  endTime?: string;
  onTimeChange: (startTime: string, endTime?: string) => void;
  visible: boolean;
  onClose: () => void;
  allowEndTime?: boolean;
  is24Hour?: boolean;
}

export default function TimePicker({
  startTime,
  endTime,
  onTimeChange,
  visible,
  onClose,
  allowEndTime = false,
  is24Hour = true
}: TimePickerProps) {
  const [selectedStartHour, setSelectedStartHour] = useState<number>(
    startTime ? parseInt(startTime.split(':')[0]) : 9
  );
  const [selectedStartMinute, setSelectedStartMinute] = useState<number>(
    startTime ? parseInt(startTime.split(':')[1]) : 0
  );
  const [selectedEndHour, setSelectedEndHour] = useState<number>(
    endTime ? parseInt(endTime.split(':')[0]) : 10
  );
  const [selectedEndMinute, setSelectedEndMinute] = useState<number>(
    endTime ? parseInt(endTime.split(':')[1]) : 0
  );

  const hours = Array.from({ length: is24Hour ? 24 : 12 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const formatTime = (hour: number, minute: number): string => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const handleConfirm = () => {
    const start = formatTime(selectedStartHour, selectedStartMinute);
    const end = allowEndTime ? formatTime(selectedEndHour, selectedEndMinute) : undefined;
    onTimeChange(start, end);
    onClose();
  };

  const handleCancel = () => {
    // Reset to initial values
    if (startTime) {
      setSelectedStartHour(parseInt(startTime.split(':')[0]));
      setSelectedStartMinute(parseInt(startTime.split(':')[1]));
    }
    if (endTime) {
      setSelectedEndHour(parseInt(endTime.split(':')[0]));
      setSelectedEndMinute(parseInt(endTime.split(':')[1]));
    }
    onClose();
  };

  const renderPickerColumn = (
    items: number[],
    selectedValue: number,
    onValueChange: (value: number) => void,
    formatter?: (value: number) => string
  ) => (
    <View style={styles.pickerColumn}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.pickerItem,
              selectedValue === item && styles.selectedPickerItem
            ]}
            onPress={() => onValueChange(item)}
          >
            <Text style={[
              styles.pickerItemText,
              selectedValue === item && styles.selectedPickerItemText
            ]}>
              {formatter ? formatter(item) : item.toString().padStart(2, '0')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelButton}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={styles.title}>時刻を選択</Text>
          <TouchableOpacity onPress={handleConfirm}>
            <Text style={styles.confirmButton}>完了</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timeInfo}>
          <Text style={styles.timeInfoText}>
            開始時刻: {formatTime(selectedStartHour, selectedStartMinute)}
            {allowEndTime && ` - 終了時刻: ${formatTime(selectedEndHour, selectedEndMinute)}`}
          </Text>
        </View>

        <View style={styles.pickersContainer}>
          {/* 開始時刻 */}
          <View style={styles.timeSection}>
            <Text style={styles.sectionTitle}>開始時刻</Text>
            <View style={styles.timePicker}>
              {renderPickerColumn(hours, selectedStartHour, setSelectedStartHour)}
              <Text style={styles.separator}>:</Text>
              {renderPickerColumn(minutes, selectedStartMinute, setSelectedStartMinute)}
            </View>
          </View>

          {/* 終了時刻 */}
          {allowEndTime && (
            <View style={styles.timeSection}>
              <Text style={styles.sectionTitle}>終了時刻</Text>
              <View style={styles.timePicker}>
                {renderPickerColumn(hours, selectedEndHour, setSelectedEndHour)}
                <Text style={styles.separator}>:</Text>
                {renderPickerColumn(minutes, selectedEndMinute, setSelectedEndMinute)}
              </View>
            </View>
          )}
        </View>

        {/* 時刻プリセット */}
        <View style={styles.presetsContainer}>
          <Text style={styles.presetsTitle}>よく使う時刻</Text>
          <View style={styles.presetButtons}>
            {[
              { label: '朝 (9:00)', hour: 9, minute: 0 },
              { label: '昼 (12:00)', hour: 12, minute: 0 },
              { label: '夕方 (17:00)', hour: 17, minute: 0 },
              { label: '夜 (19:00)', hour: 19, minute: 0 },
            ].map((preset) => (
              <TouchableOpacity
                key={preset.label}
                style={styles.presetButton}
                onPress={() => {
                  setSelectedStartHour(preset.hour);
                  setSelectedStartMinute(preset.minute);
                }}
              >
                <Text style={styles.presetButtonText}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  timeInfo: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  timeInfoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pickersContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  timeSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  timePicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pickerColumn: {
    width: 80,
    height: 120,
  },
  scrollContainer: {
    paddingVertical: 40,
  },
  pickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 8,
  },
  selectedPickerItem: {
    backgroundColor: '#ff6b6b',
  },
  pickerItemText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  selectedPickerItemText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  separator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 8,
  },
  presetsContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  presetButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
  },
  presetButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});