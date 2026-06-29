import { Heart, Star, ShoppingCart } from "lucide-react";
import { Product } from "@/react-app/data/products";
import { useLanguage } from "@/react-app/contexts/LanguageContext";

interface ProductCardProps {
  product: Product;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
}

export function ProductCard({ 
  product, 
  isWishlisted = false,
  onToggleWishlist,
  onAddToCart 
}: ProductCardProps) {
  const { t } = useLanguage();
  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100) 
    : 0;

  return (
    <div className="panel-raised p-0 overflow-hidden group">
      {/* Title bar */}
      <div className="title-bar text-xs py-1 px-2">
        <span className="truncate">{product.name}</span>
        <button 
          onClick={() => onToggleWishlist?.(product.id)}
          className={`w-4 h-4 flex items-center justify-center ${isWishlisted ? 'text-red-400' : ''}`}
        >
          <Heart size={12} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      </div>
      
      {/* Image container */}
      <div className="relative">
        <div className="panel-inset m-2 p-1">
          <img
            src={product.image}
            alt={product.name}
            className="w-full aspect-square object-cover"
          />
        </div>
        
        {/* Badge */}
        {product.badge && (
          <div className="absolute top-4 left-4 btn-gold px-2 py-1 text-xs font-bold">
            {product.badge}
          </div>
        )}
        
        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute top-4 right-4 bg-red-600 text-white px-2 py-1 text-xs font-bold border-2 border-red-900">
            -{discount}%
          </div>
        )}
      </div>
      
      {/* Product info */}
      <div className="p-3">
        <p className="text-xs text-retro-dark uppercase tracking-wider mb-1">
          {product.category}
        </p>
        
        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <Star size={12} className="fill-retro-gold text-retro-gold" />
          <span className="text-xs font-bold">{product.rating}</span>
          <span className="text-xs text-retro-dark">({product.reviews})</span>
        </div>
        
        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="panel-inset px-2 py-1 font-pixel text-lg font-bold">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-retro-dark line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
        
        {/* Add to cart button */}
        <button
          onClick={() => onAddToCart?.(product.id)}
          className="w-full btn-gold py-2 font-bold text-sm flex items-center justify-center gap-2"
        >
          <ShoppingCart size={14} />
          {t("product.addToCart")}
        </button>
      </div>
    </div>
  );
}
