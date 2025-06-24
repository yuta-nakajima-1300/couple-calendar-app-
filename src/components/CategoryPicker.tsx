import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { EventCategory, DEFAULT_CATEGORIES } from '../types';

interface CategoryPickerProps {
  selectedCategory?: EventCategory;
  onCategorySelect: (category: EventCategory) => void;
  visible: boolean;
  onClose: () => void;
}

export default function CategoryPicker({
  selectedCategory,
  onCategorySelect,
  visible,
  onClose
}: CategoryPickerProps) {
  const handleCategorySelect = (category: EventCategory) => {
    onCategorySelect(category);
    onClose();
  };

  const renderCategory = ({ item }: { item: EventCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory?.id === item.id && styles.selectedCategory
      ]}
      onPress={() => handleCategorySelect(item)}
    >
      <View style={styles.categoryContent}>
        <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
        <Text style={styles.categoryIcon}>{item.icon}</Text>
        <Text style={styles.categoryName}>{item.name}</Text>
      </View>
      {selectedCategory?.id === item.id && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={styles.title}>カテゴリーを選択</Text>
          <View style={styles.placeholder} />
        </View>

        <FlatList
          data={DEFAULT_CATEGORIES}
          keyExtractor={(item) => item.id}
          renderItem={renderCategory}
          style={styles.categoryList}
          showsVerticalScrollIndicator={false}
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
  placeholder: {
    width: 60,
  },
  categoryList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  categoryItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCategory: {
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 18,
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
});