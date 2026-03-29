import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import axios from "../utils/axios";
import ProductCard from "./ProductCard";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  rating: number;
  totalReviews: number;
  recommendationType?: string;
  reason?: string;
  confidence?: number;
  complementaryScore?: number;
}

interface RecommendationSectionProps {
  title: string;
  type: "mixed" | "collaborative" | "content" | "trending" | "new";
  productId?: string;
  userId?: string;
  refreshTrigger?: number;
}

const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  title,
  type,
  productId,
  userId,
  refreshTrigger = 0,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);
  const hasInitialLoadRef = useRef(false);
  const lastFetchParamsRef = useRef({ type, productId, userId });

  const maxRetries = 3;

  const safeSetProducts = useCallback((newProducts: any) => {
    if (Array.isArray(newProducts)) {
      setProducts(newProducts);
    } else {
      console.error("Attempted to set non-array products:", newProducts);
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const trackInteraction = useCallback(
    async (
      action: string,
      targetProductId: string,
      duration: number = 0,
      metadata: any = {}
    ) => {
      if (!userId || !mountedRef.current) return;

      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const trackController = new AbortController();

        await axios.post(
          "/recommendations/track",
          {
            action,
            productId: targetProductId,
            duration,
            metadata: {
              ...metadata,
              source: "recommendation_section",
              sectionType: type,
              timestamp: Date.now(),
            },
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
            signal: trackController.signal,
          }
        );
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.warn("Failed to track interaction:", error);
        }
      }
    },
    [userId, type]
  );

  const fetchRecommendations = useCallback(
    async (forceRefresh = false) => {
      const paramsChanged =
        lastFetchParamsRef.current.type !== type ||
        lastFetchParamsRef.current.productId !== productId ||
        lastFetchParamsRef.current.userId !== userId;

      if (
        loading &&
        !forceRefresh &&
        !paramsChanged &&
        hasInitialLoadRef.current
      ) {
        return;
      }

      lastFetchParamsRef.current = { type, productId, userId };

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        if (mountedRef.current) {
          setLoading(true);
          setError(null);
        }

        let url = "/recommendations";
        const params = new URLSearchParams();

        if (productId) {
          url = `${url}/product/${productId}`;
        } else {
          params.append("type", type);
          if (forceRefresh) {
            params.append("_t", Date.now().toString());
          }
        }

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        console.log("Fetching recommendations from:", url);

        const { data } = await axios.get(url, {
          headers,
          timeout: 10000,
          signal: abortControllerRef.current.signal,
        });

        console.log("Raw API response:", data);

        let recommendedProducts: Product[] = [];

        // Handle null or undefined data
        if (!data) {
          console.warn("API returned null/undefined data");
          recommendedProducts = [];
        } else if (
          productId &&
          typeof data === "object" &&
          !Array.isArray(data)
        ) {
          const similar =
            data.similar && Array.isArray(data.similar) ? data.similar : [];
          const complementary =
            data.complementary && Array.isArray(data.complementary)
              ? data.complementary
              : [];
          const userRecommended =
            data.userRecommended && Array.isArray(data.userRecommended)
              ? data.userRecommended
              : [];

          console.log("Product recommendations:", {
            similar: similar.length,
            complementary: complementary.length,
            userRecommended: userRecommended.length,
          });

          const seen = new Set<string>();
          const combined = [...similar, ...complementary, ...userRecommended];

          recommendedProducts = combined.filter((product) => {
            if (!product || typeof product !== "object" || !product._id)
              return false;
            if (seen.has(product._id)) return false;
            seen.add(product._id);
            return true;
          });
        } else if (Array.isArray(data)) {
          recommendedProducts = data.filter(
            (item) => item && typeof item === "object" && item._id
          );
        } else if (data && typeof data === "object") {
          if (Array.isArray(data.products)) {
            recommendedProducts = data.products;
          } else if (Array.isArray(data.recommendations)) {
            recommendedProducts = data.recommendations;
          } else if (Array.isArray(data.data)) {
            recommendedProducts = data.data;
          } else {
            console.warn("Unexpected recommendation format:", data);
            recommendedProducts = [];
          }
        } else {
          console.warn("Invalid response format:", data);
          recommendedProducts = [];
        }

        recommendedProducts = recommendedProducts.filter((product) => {
          const isValid =
            product &&
            typeof product === "object" &&
            product._id &&
            product.name &&
            typeof product.price === "number" &&
            Array.isArray(product.images);

          if (!isValid) {
            console.warn("Invalid product filtered out:", product);
          }

          return isValid;
        });

        console.log("Final processed products:", recommendedProducts.length);

        if (mountedRef.current) {
          safeSetProducts(recommendedProducts);
          setCurrentIndex(0);
          retryCountRef.current = 0;
          hasInitialLoadRef.current = true;

          if (recommendedProducts.length > 0 && userId) {
            trackInteraction("recommendation_load", "", 0, {
              type,
              count: recommendedProducts.length,
              hasProductId: !!productId,
            });
          }
        }
      } catch (error: any) {
        if (error.name === "AbortError" || !mountedRef.current) {
          return;
        }

        console.error("API Error:", error);

        if (retryCountRef.current < maxRetries && mountedRef.current) {
          retryCountRef.current++;
          const retryDelay = Math.min(
            1000 * Math.pow(2, retryCountRef.current),
            5000
          );
          console.log(
            `Retrying in ${retryDelay}ms (attempt ${retryCountRef.current}/${maxRetries})`
          );
          setTimeout(() => {
            if (mountedRef.current) {
              fetchRecommendations(forceRefresh);
            }
          }, retryDelay);
          return;
        }

        if (mountedRef.current) {
          setError(error.response?.data?.message || error.message || "Ошибка");
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [type, productId, userId, trackInteraction, safeSetProducts]
  );

  useEffect(() => {
    fetchRecommendations();
  }, [type, productId, userId, refreshTrigger]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchRecommendations(true);
  }, [fetchRecommendations]);

  const scrollLeft = useCallback(() => {
    if (!Array.isArray(products) || products.length === 0) return;

    const newIndex = Math.max(0, currentIndex - 4);
    setCurrentIndex(newIndex);
    if (userId) {
      trackInteraction("scroll", "", 0, {
        direction: "left",
        fromIndex: currentIndex,
        toIndex: newIndex,
      });
    }
  }, [currentIndex, products, trackInteraction, userId]);

  const scrollRight = useCallback(() => {
    if (!Array.isArray(products) || products.length === 0) return;

    const newIndex = Math.min(
      Math.max(0, products.length - 4),
      currentIndex + 4
    );
    setCurrentIndex(newIndex);
    if (userId) {
      trackInteraction("scroll", "", 0, {
        direction: "right",
        fromIndex: currentIndex,
        toIndex: newIndex,
      });
    }
  }, [currentIndex, products, trackInteraction, userId]);

  const handleProductClick = useCallback(
    (product: Product) => {
      if (userId && Array.isArray(products)) {
        const position =
          currentIndex +
          products
            .slice(currentIndex, currentIndex + 4)
            .findIndex((p) => p._id === product._id);
        trackInteraction("click", product._id, 0, {
          position,
          confidence: product.confidence,
          reason: product.reason,
        });
      }
    },
    [currentIndex, products, trackInteraction, userId]
  );

  const visibleProducts = useMemo(() => {
    if (!Array.isArray(products)) {
      console.warn("Products is not an array:", products);
      return [];
    }
    if (products.length === 0) {
      return [];
    }
    const safeIndex = Math.min(
      Math.max(0, currentIndex),
      Math.max(0, products.length - 1)
    );
    return products.slice(safeIndex, safeIndex + 4);
  }, [products, currentIndex]);

  if (loading && products.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <div className="text-sm text-gray-500">Загрузка...</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <div className="bg-gray-200 h-48 rounded-t-xl animate-pulse"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-red-800">{title}</h3>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
            disabled={isRefreshing}
          >
            {isRefreshing ? "Загрузка..." : "Повторить попытку"}
          </button>
        </div>
      </div>
    );
  }

  if (!Array.isArray(products) || products.length === 0) {
    return (
      <div className="mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-yellow-800">{title}</h3>
            <p className="text-yellow-600 mt-1">Рекомендации отсутствуют</p>
          </div>
          <button
            onClick={handleRefresh}
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded transition-colors"
          >
            Обновить
          </button>
        </div>
      </div>
    );
  }

  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex + 4 < products.length;

  return (
    <div className="mb-8 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {products.length} товаров
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon
              className={`h-4 w-4 text-gray-600 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>

          {products.length > 4 && (
            <>
              <button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                aria-label="Xem sản phẩm trước"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={scrollRight}
                disabled={!canScrollRight}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                aria-label="Xem sản phẩm tiếp theo"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
            </>
          )}
        </div>
      </div>

      {products.length > 4 && (
        <div className="flex space-x-1 mb-3">
          {Array.from({ length: Math.ceil(products.length / 4) }).map(
            (_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-colors ${
                  Math.floor(currentIndex / 4) === index
                    ? "bg-blue-500 w-8"
                    : "bg-gray-200 w-2"
                }`}
              />
            )
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleProducts.map((product) => (
          <div key={product._id} onClick={() => handleProductClick(product)}>
            <ProductCard
              product={product}
              showRecommendationReason={true}
              recommendationData={{
                type: product.recommendationType || type,
                reason: product.reason,
                confidence: product.confidence,
                complementaryScore: product.complementaryScore,
              }}
            />
          </div>
        ))}
      </div>

      {isRefreshing && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <div className="flex items-center space-x-2">
            <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-blue-600">Обновление...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationSection;
