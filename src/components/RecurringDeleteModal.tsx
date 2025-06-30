// 繰り返し予定削除モーダル

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { Event } from '../types';
import { useFirebaseEvents } from '../contexts/FirebaseEventContext';
import UndoToast from './UndoToast';

export type DeleteOption = 'single' | 'future' | 'all';

interface DeleteOptionInfo {
  count: number;
  description: string;
  warning?: string;
}

interface RecurringDeleteModalProps {
  visible: boolean;
  onClose: () => void;
  event: Event | null;
  selectedDate: string;
  onDeleteSuccess: () => void;
}

export default function RecurringDeleteModal({
  visible,
  onClose,
  event,
  selectedDate,
  onDeleteSuccess,
}: RecurringDeleteModalProps) {
  console.log('RecurringDeleteModal がレンダリングされました');
  console.log('Props:', { visible, event: event?.title, selectedDate });
  const { events, deleteEvent, updateEvent } = useFirebaseEvents();
  const [selectedOption, setSelectedOption] = useState<DeleteOption>('single');
  const [deleteInfo, setDeleteInfo] = useState<Record<DeleteOption, DeleteOptionInfo>>({
    single: { count: 1, description: 'この日の予定のみ' },
    future: { count: 0, description: 'この日以降の予定すべて' },
    all: { count: 0, description: 'すべての繰り返し予定' },
  });
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [deletedEvents, setDeletedEvents] = useState<Event[]>([]);
  const [undoMessage, setUndoMessage] = useState('');

  // visible状態の変化を監視
  useEffect(() => {
    console.log('RecurringDeleteModal visible状態が変化:', visible);
    if (visible) {
      console.log('モーダルが表示されようとしています');
      console.log('Event:', event);
      console.log('Selected date:', selectedDate);
    }
  }, [visible, event, selectedDate]);

  useEffect(() => {
    if (!visible || !event?.recurringId) return;

    const calculateDeleteCounts = () => {
      setCalculating(true);
      
      try {
        // 同じ繰り返しグループの予定を取得
        const recurringEvents = events.filter(e => 
          e.recurringId === event.recurringId
        );

        const selectedDateObj = new Date(selectedDate);
        const futureEvents = recurringEvents.filter(e => 
          new Date(e.date) >= selectedDateObj
        );

        setDeleteInfo({
          single: {
            count: 1,
            description: `この日（${formatDate(selectedDate)}）の予定のみ`,
          },
          future: {
            count: futureEvents.length,
            description: `この日以降の予定すべて`,
            warning: futureEvents.length > 10 ? `${futureEvents.length}件の予定が削除されます` : undefined,
          },
          all: {
            count: recurringEvents.length,
            description: `すべての繰り返し予定`,
            warning: recurringEvents.length > 20 ? `${recurringEvents.length}件の予定が削除されます` : undefined,
          },
        });
      } catch (error) {
        console.error('Failed to calculate delete counts:', error);
      } finally {
        setCalculating(false);
      }
    };

    calculateDeleteCounts();
  }, [visible, event, selectedDate, events]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const handleDelete = async () => {
    if (!event) return;

    const option = deleteInfo[selectedOption];
    const confirmMessage = getConfirmMessage(selectedOption, option);

    Alert.alert(
      '削除の確認',
      confirmMessage,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => executeDelete(),
        },
      ]
    );
  };

  const getConfirmMessage = (option: DeleteOption, info: DeleteOptionInfo): string => {
    switch (option) {
      case 'single':
        return `${formatDate(selectedDate)}の予定を削除しますか？`;
      case 'future':
        return `${formatDate(selectedDate)}以降の${info.count}件の予定を削除しますか？\n\n※この操作は取り消せません。`;
      case 'all':
        return `「${event?.title || '無題'}」の繰り返し予定（全${info.count}件）を削除しますか？\n\n※この操作は取り消せません。`;
      default:
        return '予定を削除しますか？';
    }
  };

  const executeDelete = async () => {
    if (!event) return;

    setLoading(true);
    
    try {
      switch (selectedOption) {
        case 'single':
          await deleteSingleEvent();
          break;
        case 'future':
          await deleteFutureEvents();
          break;
        case 'all':
          await deleteAllEvents();
          break;
      }

      // 削除成功後にUndoトーストを表示
      const deletedCount = deleteInfo[selectedOption].count;
      setUndoMessage(`${deletedCount}件の予定を削除しました`);
      setShowUndoToast(true);
      onDeleteSuccess();
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
      Alert.alert('エラー', '削除に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const deleteSingleEvent = async () => {
    if (!event) return;

    // 単一の予定を削除
    const targetEvent = events.find(e => 
      e.recurringId === event.recurringId && e.date === selectedDate
    );
    
    if (targetEvent) {
      setDeletedEvents([targetEvent]); // 復元用に保存
      console.log('Deleting single recurring event:', targetEvent.id); // デバッグ用
      await deleteEvent(targetEvent.id);
    }
  };

  const deleteFutureEvents = async () => {
    if (!event) return;

    const selectedDateObj = new Date(selectedDate);
    const futureEvents = events.filter(e => 
      e.recurringId === event.recurringId && new Date(e.date) >= selectedDateObj
    );

    setDeletedEvents(futureEvents); // 復元用に保存
    console.log('Deleting future recurring events:', futureEvents.length, 'events'); // デバッグ用
    
    // バッチ削除
    const deletePromises = futureEvents.map(e => {
      console.log('Deleting future event:', e.id); // デバッグ用
      return deleteEvent(e.id);
    });
    await Promise.all(deletePromises);
  };

  const deleteAllEvents = async () => {
    if (!event) return;

    const recurringEvents = events.filter(e => 
      e.recurringId === event.recurringId
    );

    setDeletedEvents(recurringEvents); // 復元用に保存
    console.log('Deleting all recurring events:', recurringEvents.length, 'events'); // デバッグ用
    
    // バッチ削除
    const deletePromises = recurringEvents.map(e => {
      console.log('Deleting all event:', e.id); // デバッグ用
      return deleteEvent(e.id);
    });
    await Promise.all(deletePromises);
  };

  const handleUndo = async () => {
    // 削除した予定を復元
    try {
      const restorePromises = deletedEvents.map(evt => 
        // createEventを使用して予定を復元
        // 実際の実装では、より適切な復元方法を使用する必要があります
        console.log('Restoring event:', evt.title, evt.date)
      );
      
      await Promise.all(restorePromises);
      setShowUndoToast(false);
      setDeletedEvents([]);
      
      // 注意: 実際の復元にはより複雑な実装が必要です
      Alert.alert('情報', '復元機能は開発中です');
    } catch (error) {
      console.error('Undo failed:', error);
      Alert.alert('エラー', '復元に失敗しました');
    }
  };

  const renderDeleteOption = (option: DeleteOption) => {
    const info = deleteInfo[option];
    const isSelected = selectedOption === option;

    return (
      <TouchableOpacity
        key={option}
        style={[styles.optionContainer, isSelected && styles.selectedOption]}
        onPress={() => setSelectedOption(option)}
        disabled={calculating}
      >
        <View style={styles.optionHeader}>
          <View style={[styles.radio, isSelected && styles.radioSelected]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
          <View style={styles.optionContent}>
            <Text style={[styles.optionTitle, isSelected && styles.selectedText]}>
              {info.description}
            </Text>
            <Text style={[styles.optionCount, isSelected && styles.selectedText]}>
              {calculating ? '計算中...' : `${info.count}件の予定`}
            </Text>
            {info.warning && (
              <Text style={styles.warningText}>⚠️ {info.warning}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!event || !event.recurringId) {
    console.log('RecurringDeleteModal: 条件を満たさないためnullを返します');
    console.log('Event:', event);
    console.log('RecurringId:', event?.recurringId);
    return null;
  }

  console.log('RecurringDeleteModal: モーダルをレンダリングします');

  // Web環境での追加スタイル
  const webModalStyle = Platform.OS === 'web' ? {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  } : {};

  // Web環境でのModal表示
  if (Platform.OS === 'web' && visible) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div style={{
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90%',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        }}>
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelButton}>キャンセル</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>繰り返し予定の削除</Text>
              <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.content}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title || '無題'}</Text>
                <Text style={styles.eventDate}>選択日: {formatDate(selectedDate)}</Text>
                {event.time && (
                  <Text style={styles.eventTime}>
                    {event.time}{event.endTime ? ` - ${event.endTime}` : ''}
                  </Text>
                )}
              </View>

              <Text style={styles.sectionTitle}>削除する範囲を選択してください</Text>

              <View style={styles.optionsContainer}>
                {(['single', 'future', 'all'] as DeleteOption[]).map(renderDeleteOption)}
              </View>

              <View style={styles.noteContainer}>
                <Text style={styles.noteTitle}>⚠️ 注意事項</Text>
                <Text style={styles.noteText}>
                  • 「この日以降」および「すべて」の削除は取り消せません{'\n'}
                  • 関連する通知やリマインダーも削除されます{'\n'}
                  • 共有予定の場合、他の参加者にも影響があります
                </Text>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.deleteButton, (loading || calculating) && styles.disabledButton]}
                onPress={handleDelete}
                disabled={loading || calculating}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.deleteButtonText}>削除</Text>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          
          <UndoToast
            visible={showUndoToast}
            message={undoMessage}
            onUndo={handleUndo}
            onDismiss={() => setShowUndoToast(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      transparent={false}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>繰り返し予定の削除</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{event.title || '無題'}</Text>
            <Text style={styles.eventDate}>選択日: {formatDate(selectedDate)}</Text>
            {event.time && (
              <Text style={styles.eventTime}>
                {event.time}{event.endTime ? ` - ${event.endTime}` : ''}
              </Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>削除する範囲を選択してください</Text>

          <View style={styles.optionsContainer}>
            {(['single', 'future', 'all'] as DeleteOption[]).map(renderDeleteOption)}
          </View>

          <View style={styles.noteContainer}>
            <Text style={styles.noteTitle}>⚠️ 注意事項</Text>
            <Text style={styles.noteText}>
              • 「この日以降」および「すべて」の削除は取り消せません{'\n'}
              • 関連する通知やリマインダーも削除されます{'\n'}
              • 共有予定の場合、他の参加者にも影響があります
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.deleteButton, (loading || calculating) && styles.disabledButton]}
            onPress={handleDelete}
            disabled={loading || calculating}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.deleteButtonText}>削除</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      
      <UndoToast
        visible={showUndoToast}
        message={undoMessage}
        onUndo={handleUndo}
        onDismiss={() => setShowUndoToast(false)}
      />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  eventInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedOption: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#ff6b6b',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff6b6b',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionCount: {
    fontSize: 14,
    color: '#666',
  },
  selectedText: {
    color: '#ff6b6b',
  },
  warningText: {
    fontSize: 12,
    color: '#ff8800',
    marginTop: 4,
    fontWeight: '500',
  },
  noteContainer: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffeaa7',
    marginBottom: 20,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  deleteButton: {
    backgroundColor: '#ff4757',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});