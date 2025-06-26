import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';
import { RecurringRule } from '../types';

interface RecurringPickerProps {
  recurringRule?: RecurringRule;
  onRuleChange: (rule: RecurringRule | undefined) => void;
  visible: boolean;
  onClose: () => void;
}

export default function RecurringPicker({ 
  recurringRule, 
  onRuleChange, 
  visible, 
  onClose 
}: RecurringPickerProps) {
  const [isRecurring, setIsRecurring] = useState(!!recurringRule);
  const [type, setType] = useState<RecurringRule['type']>(recurringRule?.type || 'weekly');
  const [interval, setInterval] = useState(recurringRule?.interval?.toString() || '1');
  const [endType, setEndType] = useState<RecurringRule['endType']>(recurringRule?.endType || 'never');
  const [endDate, setEndDate] = useState(recurringRule?.endDate || '');
  const [endCount, setEndCount] = useState(recurringRule?.endCount?.toString() || '10');

  const recurringTypes = [
    { key: 'daily', label: '毎日' },
    { key: 'weekly', label: '毎週' },
    { key: 'monthly', label: '毎月' },
    { key: 'yearly', label: '毎年' },
  ] as const;

  const endTypes = [
    { key: 'never', label: '終了しない' },
    { key: 'date', label: '終了日を指定' },
    { key: 'count', label: '回数を指定' },
  ] as const;

  const handleSave = () => {
    if (isRecurring) {
      const rule: RecurringRule = {
        type,
        interval: parseInt(interval) || 1,
        endType,
        ...(endType === 'date' && endDate ? { endDate } : {}),
        ...(endType === 'count' ? { endCount: parseInt(endCount) || 10 } : {}),
      };
      onRuleChange(rule);
    } else {
      onRuleChange(undefined);
    }
    onClose();
  };

  const getIntervalLabel = () => {
    const num = parseInt(interval) || 1;
    switch (type) {
      case 'daily': return num === 1 ? '毎日' : `${num}日ごと`;
      case 'weekly': return num === 1 ? '毎週' : `${num}週間ごと`;
      case 'monthly': return num === 1 ? '毎月' : `${num}ヶ月ごと`;
      case 'yearly': return num === 1 ? '毎年' : `${num}年ごと`;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={styles.title}>繰り返し設定</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>保存</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text style={styles.sectionTitle}>繰り返し予定</Text>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ false: '#d0d0d0', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {isRecurring && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>繰り返しパターン</Text>
                {recurringTypes.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.option,
                      type === item.key && styles.selectedOption,
                    ]}
                    onPress={() => setType(item.key)}
                  >
                    <Text style={[
                      styles.optionText,
                      type === item.key && styles.selectedOptionText,
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>間隔</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.intervalInput}
                    value={interval}
                    onChangeText={setInterval}
                    keyboardType="numeric"
                    placeholder="1"
                  />
                  <Text style={styles.intervalLabel}>{getIntervalLabel()}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>終了条件</Text>
                {endTypes.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.option,
                      endType === item.key && styles.selectedOption,
                    ]}
                    onPress={() => setEndType(item.key)}
                  >
                    <Text style={[
                      styles.optionText,
                      endType === item.key && styles.selectedOptionText,
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}

                {endType === 'date' && (
                  <View style={styles.endCondition}>
                    <Text style={styles.label}>終了日</Text>
                    <TextInput
                      style={styles.input}
                      value={endDate}
                      onChangeText={setEndDate}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                )}

                {endType === 'count' && (
                  <View style={styles.endCondition}>
                    <Text style={styles.label}>回数</Text>
                    <TextInput
                      style={styles.countInput}
                      value={endCount}
                      onChangeText={setEndCount}
                      keyboardType="numeric"
                      placeholder="10"
                    />
                    <Text style={styles.countLabel}>回</Text>
                  </View>
                )}
              </View>

              <View style={styles.preview}>
                <Text style={styles.previewTitle}>プレビュー</Text>
                <Text style={styles.previewText}>
                  {getIntervalLabel()}
                  {endType === 'date' && endDate && ` (${endDate}まで)`}
                  {endType === 'count' && ` (${endCount}回)`}
                  {endType === 'never' && ' (終了しない)'}
                </Text>
              </View>
            </>
          )}
        </ScrollView>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedOption: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intervalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    width: 80,
    marginRight: 12,
    backgroundColor: '#fff',
  },
  intervalLabel: {
    fontSize: 16,
    color: '#666',
  },
  endCondition: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginRight: 12,
    minWidth: 60,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  countInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    width: 80,
    backgroundColor: '#fff',
  },
  countLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  preview: {
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 16,
    color: '#333',
  },
});