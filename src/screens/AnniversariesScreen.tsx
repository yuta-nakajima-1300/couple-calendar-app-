import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image,
  SafeAreaView,
  ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { AnniversaryStackParamList } from '../types/navigation';
import { useAnniversaries } from '../contexts/AnniversaryContext';
import { Anniversary } from '../types';

export default function AnniversariesScreen() {
  const navigation = useNavigation<NavigationProp<AnniversaryStackParamList>>();
  const { anniversaries, loading } = useAnniversaries();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getDaysUntilText = (daysUntil: number) => {
    if (daysUntil === 0) return '今日';
    if (daysUntil === 1) return '明日';
    if (daysUntil < 0) return `${Math.abs(daysUntil)}日前`;
    return `あと${daysUntil}日`;
  };

  const renderAnniversary = ({ item }: { item: Anniversary }) => (
    <TouchableOpacity 
      style={styles.anniversaryCard}
      onPress={() => {
        // TODO: 記念日詳細画面への遷移
      }}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>📅</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardRight}>
          <Text style={styles.anniversaryTitle}>{item.title}</Text>
          <Text style={styles.anniversaryDate}>{formatDate(item.date)}</Text>
          {item.description && (
            <Text style={styles.anniversaryDescription}>{item.description}</Text>
          )}
          <View style={styles.daysUntilContainer}>
            <Text style={[
              styles.daysUntil,
              (item.daysUntil || 0) <= 7 && styles.urgentDays
            ]}>
              {getDaysUntilText(item.daysUntil || 0)}
            </Text>
            {item.isRecurring && (
              <Text style={styles.recurringBadge}>毎年</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>記念日</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AnniversaryCreate')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          次の記念日まで{' '}
          <Text style={styles.summaryDays}>
            {anniversaries.length > 0 
              ? getDaysUntilText(Math.min(...anniversaries.map(a => a.daysUntil || 0)))
              : 'データなし'
            }
          </Text>
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ff6b6b" style={styles.loading} />
      ) : anniversaries.length > 0 ? (
        <FlatList
          data={anniversaries.sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0))}
          keyExtractor={(item) => item.id}
          renderItem={renderAnniversary}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>記念日がありません</Text>
          <Text style={styles.emptySubtext}>特別な日を追加してみましょう</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => {
              // TODO: 記念日作成画面への遷移
            }}
          >
            <Text style={styles.emptyButtonText}>最初の記念日を追加</Text>
          </TouchableOpacity>
        </View>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#ff6b6b',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  summary: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
  },
  summaryDays: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  anniversaryCard: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  cardLeft: {
    marginRight: 16,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 24,
  },
  cardRight: {
    flex: 1,
    justifyContent: 'space-between',
  },
  anniversaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  anniversaryDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  anniversaryDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  daysUntilContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  daysUntil: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  urgentDays: {
    color: '#dc3545',
  },
  recurringBadge: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#6c757d',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loading: {
    marginTop: 40,
    alignSelf: 'center',
  },
});