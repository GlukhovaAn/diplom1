import React, { useState, memo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  StarIcon,
  HeartIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import OptimizedImage from "./OptimizedImage";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import axios from "../utils/axios";
import { showToast } from "../utils/shared";

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  rating: number;
  totalReviews: number;
  category?: string;
  brand?: string;
  sizes?: string[];
  colors?: string[];
  stock?: Array<{
    size: string;
    color: string;
    quantity: number;
  }>;
  effectivePrice?: number;
  discountPrice?: number;
  originalPrice?: number;
  discountPercentage?: number;
  trendingScore?: number;
  trendingUsers?: number;
  trendingOrders?: number;
  recommendationType?: string;
  reason?: string;
  confidence?: number;
  recommendationScore?: number;
  recommendedByUsers?: number;
  contentScore?: number;
  complementScore?: number;
  boughtTogether?: number;
}

interface ProductCardProps {
  product: Product;
  showRecommendationReason?: boolean;
  recommendationData?: {
    type?: string;
    reason?: string;
    confidence?: number;
    complementaryScore?: number;
  };
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string, isWishlisted: boolean) => void;
  onAddToCart?: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = memo(
  ({
    product,
    recommendationData,
    isWishlisted: propIsWishlisted = false,
    onToggleWishlist,
    onAddToCart,
  }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isWishlisted, setIsWishlisted] = useState(propIsWishlisted);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [cartLoading, setCartLoading] = useState(false);
    const viewStartTime = useRef<number>(Date.now());
    const intervalRef = useRef<any>(null);

    const { user } = useAuth();
    const { addToCart } = useCart();

    const getEffectivePrice = () => {
      if (product.effectivePrice !== undefined) {
        return product.effectivePrice;
      }
      return product.price;
    };

    const getOriginalPrice = () => {
      return product.price;
    };

    const effectivePrice = getEffectivePrice();
    const originalPrice = getOriginalPrice();
    const hasDiscount = effectivePrice < originalPrice;

    useEffect(() => {
      setIsWishlisted(propIsWishlisted);
    }, [propIsWishlisted]);

    const handleMouseEnter = () => {
      if (product.images.length > 1) {
        let imageIndex = 0;
        intervalRef.current = setInterval(() => {
          imageIndex = (imageIndex + 1) % product.images.length;
          setCurrentImageIndex(imageIndex);
        }, 1000);
      }
    };

    const handleMouseLeave = () => {
      setCurrentImageIndex(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleWishlistToggle = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) {
        alert("Для использования этой функции необходимо войти в систему");
        return;
      }

      if (wishlistLoading) return;

      setWishlistLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Для использования этой функции необходимо войти в систему");
          return;
        }

        await axios.post(
          "/users/wishlist",
          {
            productId: product._id,
            action: isWishlisted ? "remove" : "add",
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setIsWishlisted(!isWishlisted);

        if (onToggleWishlist) {
          onToggleWishlist(product._id, !isWishlisted);
        }

        showToast(
          !isWishlisted
            ? "Добавлено в список избранных"
            : "Удалено из списка избранных",
          "success"
        );
      } catch (error: any) {
        console.error("Error updating wishlist:", error);
        showToast(
          error.response?.data?.message ||
            "Произошла ошибка. Пожалуйста, попробуйте еще раз!",
          "error"
        );
      } finally {
        setWishlistLoading(false);
      }
    };

    const handleAddToCart = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) {
        alert("Для использования этой функции необходимо войти в систему");
        return;
      }

      if (cartLoading) return;

      const availableStock = product.stock?.filter((s) => s.quantity > 0) || [];

      if (availableStock.length === 0) {
        showToast(
          "В настоящее время этот товар отсутствует на складе",
          "error"
        );
        return;
      }

      const firstAvailable = availableStock[0];
      const size = firstAvailable.size || product.sizes?.[0] || "M";
      const color = firstAvailable.color || product.colors?.[0] || "Черный";

      setCartLoading(true);
      try {
        await addToCart(product._id, 1, size, color);

        if (onAddToCart) {
          onAddToCart(product._id);
        }

        const savings = hasDiscount ? originalPrice - effectivePrice : 0;
        const message = hasDiscount
          ? `Добавлено в корзину по цене распродажи! Сэкономлено ${savings.toLocaleString()} Р`
          : "Добавлено в корзину";

        showToast(message, "success");
      } catch (error: any) {
        console.error("Error adding to cart:", error);
        showToast(
          error.response?.data?.message ||
            "Произошла ошибка при добавлении товара в корзину",
          "error"
        );
      } finally {
        setCartLoading(false);
      }
    };

    const currentImage =
      product.images[currentImageIndex] ||
      product.images[0] ||
      "/placeholder.jpg";

    return (
      <div
        className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <Link to={`/product/${product._id}`}>
            <OptimizedImage
              src={currentImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              width={300}
              height={300}
              loading="lazy"
              placeholder="/placeholder.jpg"
            />
          </Link>
          <div className="absolute top-3 right-3 z-20 space-y-2">
            {product.trendingUsers && product.trendingUsers > 10 && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full shadow">
                👀 {product.trendingUsers} смотрят
              </div>
            )}
            {product.recommendedByUsers && product.recommendedByUsers > 5 && (
              <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow">
                👥 {product.recommendedByUsers} купили
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-3">
              <button
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                className={`w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-all hover:scale-110 ${
                  wishlistLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                title={
                  isWishlisted
                    ? "Удалить из избранного"
                    : "Добавить в избранное"
                }
              >
                {wishlistLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
                ) : isWishlisted ? (
                  <HeartSolidIcon className="w-6 h-6 text-red-500" />
                ) : (
                  <HeartIcon className="w-6 h-6 text-gray-600" />
                )}
              </button>
              <button
                onClick={handleAddToCart}
                disabled={cartLoading}
                className={`w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-all hover:scale-110 ${
                  cartLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                title="Добавить в корзину"
              >
                {cartLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                ) : (
                  <ShoppingCartIcon className="w-6 h-6 text-gray-600" />
                )}
              </button>
            </div>
            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Link
                to={`/product/${product._id}`}
                className="w-full bg-white text-gray-800 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-center block shadow-md"
              >
                Подробнее
              </Link>
            </div>
          </div>
          {product.images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {product.images.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    index === currentImageIndex ? "bg-white w-3" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="p-4">
          <Link to={`/product/${product._id}`}>
            <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors min-h-[48px]">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="ml-1 text-sm text-gray-600">
              {product.rating.toFixed(1)} ({product.totalReviews})
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <div>
              {hasDiscount ? (
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold text-red-600">
                      {effectivePrice.toLocaleString()} Р
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      {originalPrice.toLocaleString()} Р
                    </span>
                  </div>
                  <div className="text-xs text-green-600 font-medium mt-1">
                    Экономия {(originalPrice - effectivePrice).toLocaleString()}{" "}
                    Р
                  </div>
                </div>
              ) : (
                <span className="text-xl font-bold text-gray-900">
                  {effectivePrice.toLocaleString()} Р
                </span>
              )}
            </div>

            {(product.confidence || recommendationData?.confidence) && (
              <div className="text-right">
                <div className="text-xs text-gray-500">Похожее</div>
                <div className="text-sm font-semibold text-blue-600">
                  {Math.round(
                    (product.confidence ||
                      recommendationData?.confidence ||
                      0) * 100
                  )}
                  %
                </div>
              </div>
            )}
          </div>

          {(product.category || product.brand) && (
            <div className="text-xs text-gray-500 flex items-center">
              {product.brand && (
                <span className="truncate max-w-[100px]" title={product.brand}>
                  {product.brand}
                </span>
              )}
              {product.brand && product.category && (
                <span className="mx-1">•</span>
              )}
              {product.category && (
                <span
                  className="truncate max-w-[100px]"
                  title={product.category}
                >
                  {product.category}
                </span>
              )}
            </div>
          )}

          {product.boughtTogether && product.boughtTogether > 0 && (
            <div className="mt-2 text-xs text-green-600 font-medium">
              🛒 {product.boughtTogether} купили
            </div>
          )}
        </div>
      </div>
    );
  }
);

ProductCard.displayName = "ProductCard";

export default ProductCard;
