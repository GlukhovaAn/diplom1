import React, { useEffect, useState, useCallback } from "react";
import axios from "../../utils/axios";
import ProductCard from "../../components/ProductCard";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { showToast } from "../../utils/shared";
import { useCart } from "../../context/CartContext";

interface CapsuleItem {
  product: any;
  role: string;
}

interface Capsule {
  _id: string;
  name: string;
  description?: string;
  items: CapsuleItem[];
  type: string;
  isPublished: boolean;
  createdAt: string;
}

export const Capsules: React.FC = () => {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("trending");
  const [cartLoading, setCartLoading] = useState(false);
  const { addToCart } = useCart();
  const [userPref, setUserPref] = useState({
    size: "",
    size2: "",
    style: [] as string[],
    favoriteColors: [] as string[],
    priceRange: {
      min: 0,
      max: 10000000,
    },
    preferredBrands: [] as string[],
    preferredCategories: [] as string[],
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/users/me");
      setUserPref(response.data.preferences);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCapsules = useCallback(async () => {
    try {
      setLoading(true);

      const { data } = await axios.get("/capsules");

      setCapsules(data.capsules || []);
    } catch (error) {
      console.error("Error fetching capsules:", error);
      setCapsules([]);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchCapsules();
    fetchProfile();
  }, []);

  const scroll = (id: string, direction: "left" | "right") => {
    const container = document.getElementById(id);
    if (!container) return;

    const scrollAmount = 300;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleBuyCapsule = async (capsule: any) => {
    if (!capsule?.items?.length) {
      showToast("Капсула пуста", "error");
      return;
    }

    setCartLoading(true);

    let successCount = 0;
    let failedCount = 0;

    try {
      for (const item of capsule.items) {
        const product = item.product;

        const availableStock =
          product.stock?.filter((s: any) => s.quantity > 0) || [];

        if (availableStock.length === 0) {
          failedCount++;
          continue;
        }

        // 🎯 предпочтения пользователя
        const isShoes = product.category === "Обувь";

        const preferredSize = isShoes ? userPref?.size2 : userPref?.size;

        const preferredColors = userPref?.favoriteColors || [];

        // 1. идеальный матч (size + color)
        let selectedStock = availableStock.find((s: any) => {
          const sizeMatch = preferredSize ? s.size === preferredSize : true;
          const colorMatch = preferredColors.length
            ? preferredColors.includes(s.color)
            : true;

          return sizeMatch && colorMatch;
        });

        // 2. fallback только по размеру
        if (!selectedStock && preferredSize) {
          selectedStock = availableStock.find(
            (s: any) => s.size === preferredSize
          );
        }

        // 3. полный fallback
        if (!selectedStock) {
          selectedStock = availableStock[0];
        }

        const size =
          selectedStock.size || preferredSize || product.sizes?.[0] || "M";

        const color =
          selectedStock.color ||
          preferredColors?.[0] ||
          product.colors?.[0] ||
          "Черный";

        try {
          await addToCart(product._id, 1, size, color);
          successCount++;
        } catch (error) {
          failedCount++;
        }
      }

      // 🧾 итоговое сообщение
      if (successCount > 0) {
        showToast(
          `Добавлено ${successCount} товаров из капсулы${
            failedCount ? ` (не удалось: ${failedCount})` : ""
          }`,
          "success"
        );
      } else {
        showToast("Не удалось добавить товары из капсулы", "error");
      }
    } catch (error) {
      console.error("Error buying capsule:", error);
      showToast("Ошибка при покупке капсулы", "error");
    } finally {
      setCartLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-10 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Капсулы</h1>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="trending">В тренде</option>
            <option value="new">Новые</option>
            <option value="recommended">Рекомендованные</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20">Загрузка...</div>
        ) : capsules.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            Капсулы не найдены
          </div>
        ) : (
          <div className="space-y-16">
            {capsules.map((capsule) => {
              const scrollId = `capsule-${capsule._id}`;

              return (
                <div
                  key={capsule._id}
                  className="bg-white p-6 rounded-2xl shadow-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">{capsule.name}</h2>
                      {capsule.description && (
                        <p className="text-gray-600 mt-1">
                          {capsule.description}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleBuyCapsule(capsule)}
                      disabled={cartLoading}
                      className="bg-black text-white px-4 py-2 rounded-lg hover:opacity-90"
                    >
                      {cartLoading ? (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                      ) : (
                        <span>Купить капсулу</span>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => scroll(scrollId, "left")}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow p-2 rounded-full"
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <div
                      id={scrollId}
                      className="flex gap-4 overflow-x-auto scroll-smooth no-scrollbar px-10"
                    >
                      {capsule.items?.map((item, index) => (
                        <div
                          key={index}
                          className="min-w-[220px] max-w-[220px]"
                        >
                          <ProductCard product={item.product} />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => scroll(scrollId, "right")}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow p-2 rounded-full"
                    >
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
