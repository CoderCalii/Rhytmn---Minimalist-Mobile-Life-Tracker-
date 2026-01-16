import { CategorySelector } from '../components/CategorySelector';
import type { TransactionType } from '../capture.types';

interface CategorySectionProps {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  onAddCategory: () => void;
  onRemoveCategory: (tag: string) => void;
  newCategory: string;
  onNewCategoryChange: (value: string) => void;
  type: TransactionType;
}

export const CategorySection = ({
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
}: CategorySectionProps) => {
  if (type !== 'income' && type !== 'expense') return null;

  return (
    <CategorySelector
      categories={categories}
      selectedCategory={selectedCategory}
      onCategorySelect={onCategorySelect}
      isEditing={isEditing}
      onToggleEdit={onToggleEdit}
      onAddCategory={onAddCategory}
      onRemoveCategory={onRemoveCategory}
      newCategory={newCategory}
      onNewCategoryChange={onNewCategoryChange}
      type={type}
    />
  );
};

