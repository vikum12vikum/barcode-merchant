
import { useState } from "react";
import { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Trash2, 
  Plus, 
  Minus, 
  Package,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface ProductCardProps {
  product: Product;
  isPos?: boolean;
  quantity?: number;
  onAdd?: () => void;
  onRemove?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProductCard({
  product,
  isPos = false,
  quantity = 0,
  onAdd,
  onRemove,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const { isAdmin } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const hasLowStock = product.stock <= product.lowStockThreshold;

  return (
    <div
      className={cn(
        "relative group glass-card rounded-lg overflow-hidden transition-all duration-200",
        isHovered && "shadow-elevated transform scale-[1.01]",
        hasLowStock && "border-amber-400/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {hasLowStock && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="outline" className="border-amber-400 text-amber-500 flex items-center gap-1">
            <AlertCircle size={14} />
            Low Stock
          </Badge>
        </div>
      )}
      
      <div className="aspect-square bg-secondary/50 flex items-center justify-center">
        {product.image && !imageError ? (
          <img
            src={product.image}
            alt={product.name}
            className="object-cover w-full h-full transition-opacity duration-200"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <Package className="h-12 w-12 text-muted-foreground/30" />
        )}
      </div>
      
      <div className="p-4 space-y-2">
        <div className="space-y-1">
          <h3 className="font-medium line-clamp-1">{product.name}</h3>
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold">${product.price.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground">
              Stock: {product.stock}
            </span>
          </div>
        </div>

        {isPos ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onRemove}
              disabled={quantity === 0}
              className="h-8 w-8"
            >
              <Minus size={16} />
            </Button>
            <span className="flex-1 text-center font-medium">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={onAdd}
              disabled={product.stock === 0}
              className="h-8 w-8"
            >
              <Plus size={16} />
            </Button>
          </div>
        ) : (
          isAdmin && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex-1 h-8"
              >
                <Edit size={14} className="mr-1" /> Edit
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          )
        )}
      </div>

      {isPos && product.stock === 0 && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Badge variant="destructive" className="text-sm font-medium">
            Out of Stock
          </Badge>
        </div>
      )}
    </div>
  );
}
