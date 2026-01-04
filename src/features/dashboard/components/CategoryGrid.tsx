import { CategoryCard, CategoryCardProps } from './CategoryCard';
import styles from './CategoryGrid.module.css';

export interface CategoryGridProps {
  categories: CategoryCardProps[];
}

export const CategoryGrid = ({ categories }: CategoryGridProps) => {
  return (
    <div className={styles.grid}>
      {categories.map((category) => (
        <CategoryCard key={category.categoryId} {...category} />
      ))}
    </div>
  );
};
