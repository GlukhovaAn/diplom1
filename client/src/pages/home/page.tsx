import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "../../utils/axios";
import ProductCard from "../../components/ProductCard";
import SearchBar from "../../components/SearchBar";
import ProductFilter from "../../components/ProductFilter";
import RecommendationManager from "../../components/RecommendationManager";
import { useAuth } from "../../context/AuthContext";
import {
  ChevronRightIcon,
  SparklesIcon,
  ShoppingBagIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { HeroBanner } from "./components/HeroBanner";
import { Footer } from "../../components/Footer";
import { Pagination } from "../../components/Pagination";

interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  size?: string | string[];
  color?: string[];
  rating?: string;
  price?: {
    min?: number;
    max?: number;
  };
}

const Home: React.FC = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const { user } = useAuth();

  const isSearching = useMemo(
    () => Boolean(searchQuery || Object.keys(filters).length > 0),
    [searchQuery, filters]
  );

  const fetchProducts = useCallback(async () => {
    const controller = new AbortController();

    try {
      setLoading(true);

      const params: any = {
        page: pagination.page,
        sort: sortBy,
        limit: 12,
      };

      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.brand) params.brand = filters.brand;
      if (filters.size) params.size = filters.size;
      if (filters.color) params.color = filters.color[0];
      if (filters.rating) params.rating = filters.rating;

      if (filters.price && typeof filters.price === "object") {
        if (filters.price.min !== undefined)
          params.minPrice = filters.price.min;
        if (filters.price.max !== undefined)
          params.maxPrice = filters.price.max;
      }

      const { data } = await axios.get("/products", {
        params,
        signal: controller.signal,
      });

      if (data.products) {
        setProducts(data.products);
        setPagination((prev) => ({
          ...prev,
          pages: data.pagination?.pages || 1,
          total: data.pagination?.total || data.products.length,
        }));
      } else {
        setProducts(data);
        setPagination((prev) => ({
          ...prev,
          pages: 1,
          total: data.length,
        }));
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error fetching products:", error);
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, [pagination.page, filters, sortBy]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const runFetch = async () => {
      cleanup = await fetchProducts();
    };

    runFetch();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [fetchProducts]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setFilters((prev) => ({ ...prev, search: query }));
    setPagination({ page: 1, pages: 1, total: 0 });
  }, []);

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setPagination({ page: 1, pages: 1, total: 0 });
  }, []);

  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
    setPagination({ page: 1, pages: 1, total: 0 });
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 mx-8">
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!isSearching && (
          <>
            <HeroBanner />
          </>
        )}

        {user && !isSearching && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <SparklesIcon className="w-8 h-8 text-purple-600" />
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Рекомендации
                  </h2>
                  <p className="text-gray-600">
                    Предложения с учетом ваших предпочтений.
                  </p>
                </div>
              </div>
            </div>
            <RecommendationManager
              userId={user._id}
              sections={[
                { type: "mixed", title: "Для Вас", enabled: true },
                { type: "trending", title: "Популярное", enabled: true },
                { type: "new", title: "Новое", enabled: true },
              ]}
            />
          </div>
        )}

        {!user && !isSearching && (
          <div className="mb-16 relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-12 text-white">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-yellow-300 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <SparklesIcon className="w-16 h-16 mx-auto mb-6 animate-bounce" />
              <h3 className="text-4xl font-bold mb-4">Умные покупки</h3>
              <p className="text-xl mb-8 text-white/90">
                Получайте персонализированные предложения, эксклюзивные скидки и
                легко отслеживайте свой заказ.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/login"
                  className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl transform hover:scale-105 transition-all"
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="bg-white/20 backdrop-blur-md border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/30 transition-all"
                >
                  Регистрация
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mb-16">
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <ArrowTrendingUpIcon className="w-8 h-8 text-blue-600" />
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {searchQuery
                      ? `Результат для "${searchQuery}"`
                      : "В тренде"}
                  </h2>
                  <p className="text-gray-600">{pagination.total} товар(-ов)</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Новые</option>
                  <option value="price-asc">По увеличению цены</option>
                  <option value="price-desc">По уменьшению цены</option>
                  <option value="popular">Популярное</option>
                  <option value="rating">Высокие оценки</option>
                </select>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    showFilters
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  <AdjustmentsHorizontalIcon className="w-5 h-5" />
                  <span>Фильтр</span>
                  {Object.keys(filters).filter((k) => k !== "search").length >
                    0 && (
                    <span className="bg-white text-blue-600 text-xs px-2 py-0.5 rounded-full">
                      {
                        Object.keys(filters).filter((k) => k !== "search")
                          .length
                      }
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            <div
              className={`transition-all duration-300 ${
                showFilters ? "w-80" : "w-0"
              } overflow-hidden`}
            >
              <div className="w-80">
                <div className="bg-white rounded-2xl shadow-lg sticky top-24">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg flex items-center">
                        <FunnelIcon className="w-5 h-5 mr-2 text-blue-600" />
                        Расширенный фильтр
                      </h3>
                      <button
                        onClick={() => setFilters({})}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Очистить
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                    <ProductFilter
                      filters={filters}
                      onFilterChange={handleFilterChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1">
              {loading ? (
                <div
                  className={`grid "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" gap-6`}
                >
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-2xl h-80 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl">
                  <div className="inline-flex p-6 bg-gray-100 rounded-full mb-6">
                    <ShoppingBagIcon className="w-16 h-16 text-gray-400" />
                  </div>
                  <p className="text-2xl font-semibold text-gray-600 mb-2">
                    Товары не найдены.
                  </p>
                  <p className="text-gray-500 mb-6">
                    Попробуйте изменить фильтры или использовать другой поиск.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilters({});
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Очистить
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product: any) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                  {pagination.pages > 1 && (
                    <Pagination
                      pagination={pagination}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all z-30"
      >
        <ChevronRightIcon className="w-6 h-6 rotate-[-90deg]" />
      </button>
    </div>
  );
};

export default Home;
