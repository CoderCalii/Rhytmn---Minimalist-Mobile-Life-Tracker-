import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';
import { sanitizeText } from '../../../../utils/sanitize';

interface CategorySelectorProps {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  onAddCategory: (category: string) => void;
  onRemoveCategory: (category: string) => void;
  newCategory: string;
  onNewCategoryChange: (value: string) => void;
  type: 'income' | 'expense';
}

export const CategorySelector = ({
  categories,
  selectedCategory,
  onCategorySelect,
  isEditing,
  onToggleEdit,
  onAddCategory,
  onRemoveCategory,
  newCategory,
  onNewCategoryChange,
  type
}: CategorySelectorProps) => {
  if (type !== 'income' && type !== 'expense') return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Category</Text>
        <Pressable onPress={onToggleEdit}>
          <Text style={styles.editButton}>
            {isEditing ? 'Done' : 'Edit'}
          </Text>
        </Pressable>
      </View>
      <View style={styles.categoriesContainer}>
        {categories.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
          return isEditing ? (
            <View
              key={cat}
              style={[styles.categoryTag, styles.categoryTagEditing, isSelected && styles.categoryTagSelected]}
            >
              <Pressable onPress={() => onCategorySelect(cat)}>
                <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                  {cat}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => onRemoveCategory(cat)}
                style={[styles.removeButton, isSelected && styles.removeButtonSelected]}
                accessibilityLabel={`Remove ${cat}`}
              >
                <X size={10} color={isSelected ? '#ffffff' : '#94a3b8'} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              key={cat}
              onPress={() => onCategorySelect(cat)}
              style={[styles.categoryTag, selectedCategory === cat && styles.categoryTagSelected]}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextSelected]}>
                {cat}
              </Text>
            </Pressable>
          );
        })}
        {!isEditing && categories.length === 0 && (
          <Text style={styles.emptyText}>No categories yet.</Text>
        )}
      </View>
      {isEditing && (
        <View style={styles.addContainer}>
          <TextInput
            placeholder="Add category"
            value={newCategory}
            onChangeText={(value) => onNewCategoryChange(sanitizeText(value))}
            onSubmitEditing={() => onAddCategory(newCategory)}
            style={styles.addInput}
            placeholderTextColor="#cbd5f5"
          />
          <Pressable
            onPress={() => onAddCategory(newCategory)}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  editButton: {
    fontSize: 9,
    fontWeight: '900',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f1f5f9',
  },
  categoryTagEditing: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryTagSelected: {
    backgroundColor: '#0f172a',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  categoryTextSelected: {
    color: '#ffffff',
  },
  removeButton: {
    marginLeft: 8,
    height: 20,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: '#ffffff',
  },
  removeButtonSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  emptyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  addContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addInput: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  addButton: {
    marginLeft: 8,
    borderRadius: 16,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.1,
    color: '#ffffff',
  },
});

