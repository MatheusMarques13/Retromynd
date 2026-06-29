import { categories } from "@/react-app/data/products";

interface CategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryBar({ selectedCategory, onSelectCategory }: CategoryBarProps) {
  return (
    <div className="overflow-x-auto py-4">
      <div className="flex gap-2 min-w-max px-4 lg:justify-center">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => onSelectCategory(category.name)}
            className={`
              flex items-center gap-2 px-4 py-2 font-bold text-sm transition-all
              ${selectedCategory === category.name
                ? "btn-gold"
                : "btn-retro"
              }
            `}
          >
            <span className="text-base">{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
