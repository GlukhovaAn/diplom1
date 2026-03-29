import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FireIcon,
  ClockIcon,
  InformationCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  SparklesIcon,
  XMarkIcon,
  MagnifyingGlassPlusIcon,
} from "@heroicons/react/24/solid";
import {
  HeartIcon,
  ShoppingCartIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import RecommendationSection from "../../components/RecommendationSection";
import StockBadge from "../../components/StockBadge";
import OptimizedImage from "../../components/OptimizedImage";
import ReviewSummary from "../../components/ReviewSummary";
import axios from "../../utils/axios";

interface SecondaryImage {
  _id?: string;
  url: string;
  type: "detail" | "size_chart" | "instruction" | "material" | "other";
  caption: string;
  order: number;
}

interface ProductStockItem {
  size: string;
  color: string;
  quantity: number;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  secondaryImages?: SecondaryImage[];
  category: string;
  subcategory?: string;
  brand?: string;
  sizes: string[];
  colors: string[];
  stock: ProductStockItem[];
  tags?: string[];
  rating: number;
  totalReviews: number;
  viewCount: number;
  totalOrders: number;
  createdAt: string;
  updatedAt: string;
}

interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    email?: string;
  };
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
  helpful?: number;
}

interface ToastOptions {
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [currentStock, setCurrentStock] = useState(0);

  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showSecondaryImageModal, setShowSecondaryImageModal] = useState(false);
  const [selectedSecondaryImage, setSelectedSecondaryImage] =
    useState<SecondaryImage | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "reviews" | "care">(
    "details"
  );
  const [showSecondaryImages, setShowSecondaryImages] = useState(false);

  const [showRecommendations, setShowRecommendations] = useState(false);

  const timerRef = useRef<any>(null);

  const viewStartTime = useRef<number>(Date.now());
  const hasTrackedView = useRef<boolean>(false);
  const trackingTimeout = useRef<any>(null);
  const pageLoadTime = useRef<number>(Date.now());

  useEffect(() => {
    if (id) {
      viewStartTime.current = Date.now();
      hasTrackedView.current = false;
      pageLoadTime.current = Date.now();
      setShowRecommendations(false);
      fetchProductData();
      window.scrollTo(0, 0);
    }

    return () => {
      if (trackingTimeout.current) {
        clearTimeout(trackingTimeout.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    if (user && product) {
      checkWishlist();
    } else {
      setIsWishlisted(false);
    }
  }, [user, product]);

  useEffect(() => {
    if (product && !loading) {
      const timer = setTimeout(() => {
        setShowRecommendations(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [product, loading]);

  useEffect(() => {
    if (product && selectedSize && selectedColor) {
      const stockItem = product.stock?.find(
        (item) => item.size === selectedSize && item.color === selectedColor
      );
      let availableStock = stockItem ? stockItem.quantity : 0;

      setCurrentStock(availableStock);
    }
  }, [product, selectedSize, selectedColor]);

  const getEffectivePrice = () => {
    return product?.price || 0;
  };

  const getOriginalPrice = () => {
    if (product && product.price < 1000000) {
      return product.price * 1.25;
    }
    return null;
  };

  const getGroupedSecondaryImages = () => {
    if (!product?.secondaryImages) return {};

    const grouped: Record<string, SecondaryImage[]> = {};
    product.secondaryImages.forEach((img) => {
      if (!grouped[img.type]) {
        grouped[img.type] = [];
      }
      grouped[img.type].push(img);
    });

    Object.keys(grouped).forEach((type) => {
      grouped[type].sort((a, b) => a.order - b.order);
    });

    return grouped;
  };

  const getImageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      detail: "Подробная информация о товаре",
      size_chart: "Таблица размеров",
      instruction: "Инструкция",
      material: "Материал",
      other: "Другое",
    };
    return labels[type] || type;
  };

  const getImageTypeIcon = (type: string) => {
    switch (type) {
      case "detail":
        return <InformationCircleIcon className="w-5 h-5" />;
      case "size_chart":
        return <ChartBarIcon className="w-5 h-5" />;
      case "instruction":
        return <DocumentTextIcon className="w-5 h-5" />;
      case "material":
        return <SparklesIcon className="w-5 h-5" />;
      default:
        return <InformationCircleIcon className="w-5 h-5" />;
    }
  };

  const fetchProductData = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(`/products/${id}`);
      setProduct(data);

      if (data.sizes?.length > 0) {
        setSelectedSize(data.sizes[0]);
      }
      if (data.colors?.length > 0) {
        setSelectedColor(data.colors[0]);
      }

      await Promise.all([
        fetchReviews(),
        fetchRelatedProducts(data.category, data._id),
      ]);
    } catch (error) {
      console.error("Error fetching product:", error);
      showToast({
        message: "Не удалось загрузить информацию о товаре.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await axios.get(`/reviews/product/${id}`);
      setReviews(data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const fetchRelatedProducts = async (category: string, excludeId: string) => {
    try {
      const { data } = await axios.get("/products", {
        params: { category, limit: 6 },
      });
      const filtered = (data.products || data).filter(
        (p: Product) => p._id !== excludeId
      );
      setRelatedProducts(filtered.slice(0, 5));
    } catch (error) {
      console.error("Error fetching related products:", error);
    }
  };

  const checkWishlist = async () => {
    if (!user || !product) {
      setIsWishlisted(false);
      return;
    }

    try {
      const { data } = await axios.get("/users/me");
      const wishlist = data.interactions?.wishlist || [];

      const isInWishlist = wishlist.some((item: any) => {
        const productId = item.product?._id || item.product;
        return productId === product._id;
      });

      setIsWishlisted(isInWishlist);
    } catch (error) {
      console.error("Error checking wishlist:", error);
      setIsWishlisted(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      showToast({
        message:
          "Пожалуйста, войдите в систему, чтобы добавить товар в корзину.",
        type: "info",
      });
      navigate("/login");
      return;
    }

    if (!product) return;

    if (currentStock === 0) {
      showToast({
        message: "Этот товар отсутствует на складе!",
        type: "error",
      });
      return;
    }

    if (quantity > currentStock) {
      showToast({
        message: `В наличии осталось ${currentStock} товаров!`,
        type: "warning",
      });
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product._id, quantity, selectedSize, selectedColor);

      const token = localStorage.getItem("token");
      if (token) {
        try {
          await axios.post(
            "/recommendations/track",
            {
              action: "addToCart",
              productId: product._id,
              metadata: {
                source: "product_detail",
                size: selectedSize,
                color: selectedColor,
                quantity: quantity,
                price: getEffectivePrice(),
                totalValue: getEffectivePrice() * quantity,
              },
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } catch (trackError) {
          console.warn("Failed to track add to cart:", trackError);
        }
      }

      setCurrentStock((prev) => Math.max(0, prev - quantity));
      setQuantity(1);

      showToast({
        message: `В корзину добавлено ${quantity} товаров`,
        type: "success",
      });
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Произошла ошибка при добавлении товара в корзину.";
      showToast({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      showToast({
        message: "Для добавления в избранное, пожалуйста, войдите в систему.",
        type: "info",
      });
      navigate("/login");
      return;
    }

    if (wishlistLoading || !product) return;

    setWishlistLoading(true);
    try {
      await axios.post("/users/wishlist", {
        productId: product._id,
        action: isWishlisted ? "remove" : "add",
      });

      setIsWishlisted(!isWishlisted);

      showToast({
        message: !isWishlisted
          ? "Добавлено в список избранных!"
          : "Удалено из списка избранных",
        type: "success",
      });
    } catch (error: any) {
      console.error("Error updating wishlist:", error);
      showToast({
        message: error.response?.data?.message || "Произошла ошибка.",
        type: "error",
      });
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Просмотреть товар ${product.name} по цене ${getEffectivePrice().toLocaleString()} Р`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast({
          message: "Ссылка на товар скопирована!",
          type: "success",
        });
      }
    } catch (error) {
      if ((error as any).name !== "AbortError") {
        console.error("Error sharing:", error);
      }
    }
  };

  const openSecondaryImageModal = (image: SecondaryImage) => {
    setSelectedSecondaryImage(image);
    setShowSecondaryImageModal(true);
  };

  const showToast = useCallback((options: ToastOptions) => {
    const { message, type, duration = 3000 } = options;

    const toast = document.createElement("div");
    const bgColor = {
      success: "bg-green-500",
      error: "bg-red-500",
      info: "bg-blue-500",
      warning: "bg-yellow-500",
    }[type];

    const icon = {
      success: "✓",
      error: "✕",
      info: "ℹ",
      warning: "⚠",
    }[type];

    toast.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white font-medium shadow-lg transition-all duration-300 ${bgColor} flex items-center space-x-2 max-w-sm`;
    toast.innerHTML = `
      <span class="text-lg">${icon}</span>
      <span>${message}</span>
    `;
    toast.style.transform = "translateX(400px)";

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = "translateX(0)";
    });

    setTimeout(() => {
      toast.style.transform = "translateX(400px)";
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, duration);
  }, []);

  const nextImage = () => {
    if (product && product.images.length > 1) {
      setSelectedImage((prev) => (prev + 1) % product.images.length);
      setImageLoading(true);
    }
  };

  const prevImage = () => {
    if (product && product.images.length > 1) {
      setSelectedImage(
        (prev) => (prev - 1 + product.images.length) % product.images.length
      );
      setImageLoading(true);
    }
  };

  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    return `http://localhost:5000${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="bg-gray-200 rounded-lg aspect-square"></div>
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-200 rounded w-20 h-20"></div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-10 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Товар не найден.
          </h2>
          <Link to="/" className="text-blue-600 hover:underline">
            Вернуться на главную страницу
          </Link>
        </div>
      </div>
    );
  }

  const effectivePrice = getEffectivePrice();
  const originalPrice = getOriginalPrice();
  const groupedSecondaryImages = getGroupedSecondaryImages();

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2 flex-wrap">
          <li>
            <Link to="/" className="text-gray-500 hover:text-gray-700">
              Главная
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link
              to={`/category/${product.category}`}
              className="text-gray-500 hover:text-gray-700"
            >
              {product.category}
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div>
          <div className="relative mb-4 group">
            <div
              className="aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-zoom-in"
              onClick={() => setShowImageModal(true)}
            >
              <OptimizedImage
                src={product.images[selectedImage] || "/placeholder.jpg"}
                alt={product.name}
                className="w-full h-full object-cover"
                width={600}
                height={600}
                loading="eager"
                onLoad={() => setImageLoading(false)}
              />
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
              <div className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <MagnifyingGlassPlusIcon className="w-5 h-5" />
              </div>
            </div>
            {product.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedImage(index);
                    setImageLoading(true);
                  }}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index
                      ? "border-blue-500"
                      : "border-gray-200"
                  }`}
                >
                  <OptimizedImage
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    width={80}
                    height={80}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
          {product.secondaryImages && product.secondaryImages.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowSecondaryImages(!showSecondaryImages)}
                className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="font-medium text-gray-900">
                  Больше изображений
                </span>
                <ChevronRightIcon
                  className={`w-5 h-5 transition-transform ${showSecondaryImages ? "rotate-90" : ""}`}
                />
              </button>

              {showSecondaryImages && (
                <div className="mt-4 space-y-6">
                  {Object.entries(groupedSecondaryImages).map(
                    ([type, images]) => (
                      <div key={type}>
                        <div className="flex items-center space-x-2 mb-3">
                          {getImageTypeIcon(type)}
                          <h3 className="font-medium text-gray-900">
                            {getImageTypeLabel(type)}
                          </h3>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {images.map((image, index) => (
                            <button
                              key={image._id || index}
                              onClick={() => openSecondaryImageModal(image)}
                              className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 hover:opacity-80 transition-opacity"
                            >
                              <img
                                src={getImageUrl(image.url)}
                                alt={
                                  image.caption ||
                                  `${getImageTypeLabel(type)} ${index + 1}`
                                }
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              {image.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                                  {image.caption}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:pl-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              {product.brand && (
                <p className="text-gray-600 mb-2">
                  Бренд:{" "}
                  <Link
                    to={`/brand/${product.brand}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {product.brand}
                  </Link>
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <ShareIcon className="h-6 w-6 text-gray-600" />
              </button>
              <button
                onClick={toggleWishlist}
                disabled={wishlistLoading}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                {wishlistLoading ? (
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
                ) : isWishlisted ? (
                  <HeartSolidIcon className="h-6 w-6 text-red-500" />
                ) : (
                  <HeartIcon className="h-6 w-6 text-gray-600" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center mb-6">
            <div className="flex items-center mr-2">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-5 w-5 ${i < Math.floor(product.rating || 0) ? "text-yellow-400" : "text-gray-300"}`}
                />
              ))}
            </div>
            <span className="text-gray-700">
              {(product.rating || 0).toFixed(1)} ({product.totalReviews || 0}{" "}
              рейтинг) | {product.totalOrders || 0} продано
            </span>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline space-x-3">
              <p className="text-3xl font-bold text-red-600">
                {effectivePrice.toLocaleString()} Р
              </p>
              {originalPrice && (
                <p className="text-lg text-gray-400 line-through">
                  {originalPrice.toLocaleString()} Р
                </p>
              )}
            </div>
            {effectivePrice >= 500000 && (
              <p className="text-sm text-green-600 mt-1">
                ✓ Бесплатная доставка
              </p>
            )}
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Описание</h3>
            <p className="text-gray-700 leading-relaxed">
              {product.description}
            </p>
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Размер
                </label>
                {product.secondaryImages?.some(
                  (img) => img.type === "size_chart"
                ) && (
                  <button
                    onClick={() => {
                      const sizeChartImg = product.secondaryImages?.find(
                        (img) => img.type === "size_chart"
                      );
                      if (sizeChartImg) openSecondaryImageModal(sizeChartImg);
                    }}
                    className="text-sm text-blue-600 hover:underline flex items-center space-x-1"
                  >
                    <ChartBarIcon className="w-4 h-4" />
                    <span>Таблица размеров</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {product.sizes.map((size) => {
                  const hasStock = product.stock?.some(
                    (item) =>
                      item.size === size &&
                      item.color === selectedColor &&
                      item.quantity > 0
                  );

                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      disabled={!hasStock}
                      className={`px-3 py-2 border rounded-lg transition-all text-sm font-medium ${
                        selectedSize === size
                          ? "border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-200"
                          : hasStock
                            ? "border-gray-300 hover:border-gray-400"
                            : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {product.colors && product.colors.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Цвет:{" "}
                <span className="font-normal text-gray-600">
                  {selectedColor}
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => {
                  const hasStock = product.stock?.some(
                    (item) =>
                      item.size === selectedSize &&
                      item.color === color &&
                      item.quantity > 0
                  );

                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      disabled={!hasStock}
                      className={`px-4 py-2 border rounded-lg transition-all text-sm font-medium ${
                        selectedColor === color
                          ? "border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-200"
                          : hasStock
                            ? "border-gray-300 hover:border-gray-400"
                            : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-6">
            <StockBadge quantity={currentStock} />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Количество
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentStock === 0 || quantity <= 1}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 12H4"
                    />
                  </svg>
                </button>
                <input
                  type="number"
                  min="1"
                  max={currentStock}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    if (val > 0 && val <= currentStock) {
                      setQuantity(val);
                    }
                  }}
                  className="w-20 text-center border-x border-gray-300 focus:outline-none py-3"
                  disabled={currentStock === 0}
                />
                <button
                  onClick={() =>
                    setQuantity(Math.min(currentStock, quantity + 1))
                  }
                  className="px-4 py-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentStock === 0 || quantity >= currentStock}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={currentStock === 0 || addingToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-all ${
                  currentStock === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
                }`}
              >
                {currentStock === 0 ? (
                  "Распродано"
                ) : addingToCart ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Добавлено...
                  </>
                ) : (
                  <>
                    <ShoppingCartIcon className="h-5 w-5" />
                    Купить
                  </>
                )}
              </button>
              <button
                className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                onClick={() => {
                  handleAddToCart();
                  setTimeout(() => navigate("/cart"), 500);
                }}
                disabled={currentStock === 0 || addingToCart}
              >
                В корзину
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("details")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "details"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Подробная информация о товаре
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "reviews"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Комментарии
            </button>
          </nav>
        </div>

        <div className="py-6">
          {activeTab === "details" && (
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-4">
                Подробная информация
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Категория</p>
                  <p className="font-medium">{product.category}</p>
                </div>
                {product.brand && (
                  <div>
                    <p className="text-sm text-gray-600">Бренд</p>
                    <p className="font-medium">{product.brand}</p>
                  </div>
                )}
                {product.sizes && (
                  <div>
                    <p className="text-sm text-gray-600">Доступные размеры</p>
                    <p className="font-medium">{product.sizes.join(", ")}</p>
                  </div>
                )}
                {product.colors && (
                  <div>
                    <p className="text-sm text-gray-600">Доступные цвета</p>
                    <p className="font-medium">{product.colors.join(", ")}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Код товара</p>
                  <p className="font-medium">{product._id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Дата обновления</p>
                  <p className="font-medium">
                    {new Date(product.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-6">
              {reviews.length > 0 && (
                <div className="mb-8">
                  <ReviewSummary productId={id!} />
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="mb-4">
                    <StarIcon className="h-12 w-12 text-gray-300 mx-auto" />
                  </div>
                  <p className="text-gray-600 mb-2">
                    Отзывов об этом товаре пока нет.
                  </p>
                  <p className="text-sm text-gray-500">
                    Будьте первым, кто оставит отзыв об этом товаре!
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-gray-900">
                          {product.rating.toFixed(1)}
                        </p>
                        <div className="flex items-center justify-center mt-2">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-5 w-5 ${
                                i < Math.floor(product.rating)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {product.totalReviews} оценок
                        </p>
                      </div>

                      <div className="col-span-2 space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = reviews.filter(
                            (r) => r.rating === star
                          ).length;
                          const percentage = (count / reviews.length) * 100;

                          return (
                            <div
                              key={star}
                              className="flex items-center space-x-2"
                            >
                              <span className="text-sm text-gray-600 w-12">
                                {star} звезд
                              </span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-12 text-right">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review._id}
                        className="bg-white border border-gray-200 rounded-lg p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-gray-600 font-medium">
                                  {review.user?.name?.charAt(0).toUpperCase() ||
                                    "U"}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {review.user?.name || "Người dùng"}
                                </p>
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <StarIcon
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < review.rating
                                            ? "text-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {new Date(
                                      review.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-4">{review.comment}</p>

                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 mb-4">
                            {review.images.map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`Review ${index + 1}`}
                                className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Сопутствующие товары</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct._id}
                to={`/product/${relatedProduct._id}`}
                className="group"
              >
                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 mb-3">
                  <OptimizedImage
                    src={relatedProduct.images[0] || "/placeholder.jpg"}
                    alt={relatedProduct.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    width={200}
                    height={200}
                    loading="lazy"
                  />
                </div>
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {relatedProduct.name}
                </h3>
                <p className="text-sm font-semibold text-red-600 mt-1">
                  {relatedProduct.price.toLocaleString()} Р
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {showRecommendations && product && (
        <div className="space-y-12">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-6">
              Рекомендуемые товары для вас
            </h2>
            <RecommendationSection
              title="Похожие товары"
              type="content"
              productId={product._id}
              userId={user?._id}
            />
          </div>

          {user && (
            <RecommendationSection
              title="На основе истории просмотров"
              type="content"
              userId={user._id}
            />
          )}

          <RecommendationSection
            title="В тренде"
            type="trending"
            userId={user?._id}
          />
        </div>
      )}

      {showImageModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={getImageUrl(product.images[selectedImage])}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowImageModal(false);
              }}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {product.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-colors"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-colors"
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showSecondaryImageModal && selectedSecondaryImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSecondaryImageModal(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col">
            <img
              src={getImageUrl(selectedSecondaryImage.url)}
              alt={
                selectedSecondaryImage.caption ||
                getImageTypeLabel(selectedSecondaryImage.type)
              }
              className="max-w-full max-h-full object-contain"
            />

            {selectedSecondaryImage.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4">
                <p className="text-center">{selectedSecondaryImage.caption}</p>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSecondaryImageModal(false);
              }}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
