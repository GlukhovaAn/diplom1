import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../../utils/axios";
import ProductCard from "../../components/ProductCard";
import RecommendationSection from "../../components/RecommendationSection";
import { HeartIcon, TrashIcon, ShareIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useAuth } from "../../context/AuthContext";

interface WishlistItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
    rating: number;
    totalReviews: number;
    category: string;
    brand?: string;
    stock: Array<{
      size: string;
      color: string;
      quantity: number;
    }>;
  };
  addedAt: string;
}

const Wishlist: React.FC = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "price_low" | "price_high" | "name"
  >("newest");
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/users/wishlist");
      const wishlistData = data || [];
      setWishlistItems(wishlistData);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const { data } = await axios.post("/users/wishlist", {
        productId,
        action: "remove",
      });
      const wishlistData = data || [];

      setWishlistItems(wishlistData);

      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      alert("Произошла ошибка при удалении товара.");
    }
  };

  const removeSelectedItems = async () => {
    if (selectedItems.size === 0) return;

    try {
      const promises = Array.from(selectedItems).map((productId) =>
        axios.post("/users/wishlist", {
          productId,
          action: "remove",
        })
      );

      await Promise.all(promises);
      await fetchWishlist();
      setSelectedItems(new Set());
    } catch (error) {
      console.error("Error removing selected items:", error);
      alert("Произошла ошибка при удалении товара.");
    }
  };

  const toggleSelectItem = (productId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectAllItems = () => {
    if (selectedItems.size === wishlistItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(wishlistItems.map((item) => item.product._id)));
    }
  };

  const shareWishlist = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Мой список избранных",
          text: `Посмотреть мои любимые товары`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Ссылка на список избранных скопирована!");
      }
    } catch (error) {
      console.error("Error sharing wishlist:", error);
    }
  };

  const getOriginalPrice = (product: any) => {
    return product.price;
  };

  const sortedItems = [...wishlistItems].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      case "oldest":
        return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
      case "price_low":
        return getOriginalPrice(a.product) - getOriginalPrice(b.product);
      case "price_high":
        return getOriginalPrice(b.product) - getOriginalPrice(a.product);
      case "name":
        return a.product.name.localeCompare(b.product.name, "ru");
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка списка избранных...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <HeartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Войдите в систему, чтобы просмотреть список избранных.
          </h2>
          <p className="text-gray-600 mb-4">
            Войдите в систему, чтобы сохранять и управлять своими любимыми
            товарами.
          </p>
          <Link
            to="/login"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <HeartSolidIcon className="h-16 w-16 text-pink-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Список избранных пуст.
          </h2>
          <p className="text-gray-500 mb-6">
            Добавьте понравившиеся товары, чтобы оставить отзыв позже.
          </p>
          <div className="space-x-4">
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Главная
            </Link>
            <Link
              to="/categories"
              className="inline-block border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Каталог
            </Link>
          </div>
        </div>
        <div className="mt-12">
          <RecommendationSection
            title="Рекомендации"
            type="mixed"
            userId={user._id}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Избранное</h1>
          <p className="text-gray-600">{wishlistItems.length} товаров</p>
        </div>

        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <button
            onClick={shareWishlist}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShareIcon className="h-4 w-4" />
            <span>Поделиться</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={
                selectedItems.size === wishlistItems.length &&
                wishlistItems.length > 0
              }
              onChange={selectAllItems}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Выбрать все ({selectedItems.size}/{wishlistItems.length})
            </span>
          </label>

          {selectedItems.size > 0 && (
            <button
              onClick={removeSelectedItems}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
              <span>Удалить ({selectedItems.size})</span>
            </button>
          )}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="newest">Новые</option>
          <option value="oldest">Старые</option>
          <option value="price_low">По уменьшению цены</option>
          <option value="price_high">По возрастанию цены</option>
          <option value="name">Tên A-Z</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
        {sortedItems.map((item) => (
          <div key={item._id} className="relative group">
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={selectedItems.has(item.product._id)}
                onChange={() => toggleSelectItem(item.product._id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white shadow-sm"
              />
            </div>
            <ProductCard
              product={item.product}
              showRecommendationReason={false}
              isWishlisted={true}
              onToggleWishlist={() => removeFromWishlist(item.product._id)}
            />
            <div className="mt-2 text-xs text-gray-500 text-center">
              Добавлен: {new Date(item.addedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t pt-12">
        <RecommendationSection
          title="Похожие товары"
          type="content"
          userId={user._id}
        />
      </div>
    </div>
  );
};

export default Wishlist;
