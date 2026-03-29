import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, Package, Star } from "lucide-react";
import axios from "../../utils/axios";
import { Pagination } from "../../components/admin/Pagination";
import { TableWrapper } from "../../components/admin/Table";

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  subcategory: string;
  brand: string;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: Array<{
    size: string;
    color: string;
    quantity: number;
  }>;
  description: string;
  rating: number;
  totalReviews: number;
  totalOrders: number;
  viewCount: number;
  createdAt: string;
}

interface CategoryData {
  category: string;
  subcategories: string[];
  count: number;
}

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    subcategory: "",
    brand: "",
    sizes: [] as string[],
    colors: [] as string[],
    stock: [] as any[],
    tags: [] as string[],
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null
  );

  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [showNewBrandInput, setShowNewBrandInput] = useState(false);

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockUpdates, setStockUpdates] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage, search, category]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await axios.get("/admin/products/categories");
      setCategories(response.data.categories || []);
      setBrands(response.data.brands || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/admin/products", {
        params: {
          page: currentPage,
          limit: 10,
          search,
          category,
        },
      });
      setProducts(response.data.products || []);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitFormData = new FormData();
    submitFormData.append("name", formData.name);
    submitFormData.append("description", formData.description);
    submitFormData.append("price", formData.price);
    submitFormData.append("category", formData.category);
    submitFormData.append("subcategory", formData.subcategory);
    submitFormData.append("brand", formData.brand);
    submitFormData.append("sizes", JSON.stringify(formData.sizes));
    submitFormData.append("colors", JSON.stringify(formData.colors));

    let stockData = formData.stock;
    if (
      stockData.length === 0 &&
      formData.sizes.length > 0 &&
      formData.colors.length > 0
    ) {
      stockData = [];
      formData.sizes.forEach((size) => {
        formData.colors.forEach((color) => {
          stockData.push({ size, color, quantity: 0 });
        });
      });
    }
    submitFormData.append("stock", JSON.stringify(stockData));
    submitFormData.append("tags", JSON.stringify(formData.tags));

    if (editingProduct && existingImages.length > 0) {
      submitFormData.append("existingImages", JSON.stringify(existingImages));
    }

    selectedImages.forEach((image) => {
      submitFormData.append("images", image);
    });

    try {
      if (editingProduct) {
        await axios.put(
          `/admin/products/${editingProduct._id}`,
          submitFormData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        alert("Обновление продукта прошло успешно!");
      } else {
        await axios.post("/admin/products", submitFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Товар успешно добавлен!");
      }

      setShowModal(false);
      resetForm();
      fetchProducts();
      fetchCategories();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Ошибка сохранения продукта");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingProductId(id);
      await axios.delete(`/admin/products/${id}`);
      alert("Продукт успешно удалён!");
      fetchProducts();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      alert(error.response?.data?.message || "Ошибка при удалении товара");
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      subcategory: product.subcategory || "",
      brand: product.brand,
      sizes: product.sizes || [],
      colors: product.colors || [],
      stock: product.stock || [],
      tags: [],
    });
    setExistingImages(product.images || []);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Файл ${file.name} слишком большой. Максимальный размер — 5 МБ.`);
        return false;
      }
      if (!file.type.startsWith("image/")) {
        alert(`Файл ${file.name} не является изображением.`);
        return false;
      }
      return true;
    });

    setSelectedImages(validFiles);

    const previews = validFiles.map((file) => URL.createObjectURL(file));
    setImagesPreviews(previews);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      subcategory: "",
      brand: "",
      sizes: [],
      colors: [],
      stock: [],
      tags: [],
    });
    setSelectedImages([]);
    setImagesPreviews([]);
    setExistingImages([]);
    setEditingProduct(null);
    setNewSize("");
    setNewColor("");
    setNewTag("");
    setNewCategory("");
    setNewSubcategory("");
    setNewBrand("");
    setShowNewCategoryInput(false);
    setShowNewBrandInput(false);
  };

  const addSize = () => {
    if (newSize && !formData.sizes.includes(newSize)) {
      setFormData({ ...formData, sizes: [...formData.sizes, newSize] });
      setNewSize("");
    }
  };

  const removeSize = (size: string) => {
    setFormData({
      ...formData,
      sizes: formData.sizes.filter((s) => s !== size),
    });
  };

  const addColor = () => {
    if (newColor && !formData.colors.includes(newColor)) {
      setFormData({ ...formData, colors: [...formData.colors, newColor] });
      setNewColor("");
    }
  };

  const removeColor = (color: string) => {
    setFormData({
      ...formData,
      colors: formData.colors.filter((c) => c !== color),
    });
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    return `http://localhost:5000${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  };

  const formatCurrency = (amount: number) => {
    return amount;
  };

  const openStockModal = (product: Product) => {
    setStockProduct(product);
    setStockUpdates(product.stock || []);
    setShowStockModal(true);
  };

  const updateStockQuantity = (index: number, quantity: string) => {
    const newUpdates = [...stockUpdates];
    newUpdates[index].quantity = parseInt(quantity) || 0;
    setStockUpdates(newUpdates);
  };

  const saveStockUpdates = async () => {
    if (!stockProduct) return;

    try {
      await axios.patch(`/admin/products/${stockProduct._id}/stock`, {
        stockUpdates,
      });

      setShowStockModal(false);
      fetchProducts();
      alert("Обновление данных об остатках на складе прошло успешно!");
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Ошибка при обновлении остатков.");
    }
  };

  const getTotalStock = (product: Product) => {
    if (!product.stock || !Array.isArray(product.stock)) return 0;
    return product.stock.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const getStockBadge = (product: Product) => {
    const total = getTotalStock(product);
    if (total === 0) {
      return (
        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
          Распродано
        </span>
      );
    } else if (total < 10) {
      return (
        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
          Мало
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
          В наличии
        </span>
      );
    }
  };

  const getSubcategories = (selectedCategory: string) => {
    const cat = categories.find((c) => c.category === selectedCategory);
    return cat?.subcategories || [];
  };

  const handleAddNewCategory = () => {
    if (newCategory) {
      setFormData({
        ...formData,
        category: newCategory,
        subcategory: newSubcategory,
      });
      setShowNewCategoryInput(false);
      setNewCategory("");
      setNewSubcategory("");
    }
  };

  const handleAddNewBrand = () => {
    if (newBrand) {
      setFormData({ ...formData, brand: newBrand });
      setShowNewBrandInput(false);
      setNewBrand("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Управление продуктами
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Добавить товар
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loadingCategories}
          >
            <option value="">Все категории</option>
            {categories.map((cat) => (
              <option key={cat.category} value={cat.category}>
                {cat.category} ({cat.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      <TableWrapper
        loading={loading}
        isEmpty={products.length === 0}
        emptyError="Нет товаров"
        headArr={[
          "Товар",
          "Категория",
          "Цена",
          "Инвентаризация",
          "Оценка",
          "Продано",
          "Операция",
        ]}
      >
        {products.map((product) => (
          <tr key={product._id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <img
                  className="h-10 w-10 rounded-lg object-cover"
                  src={getImageUrl(product.images?.[0])}
                  alt={product.name}
                  // onError={(e) => {
                  //   e.currentTarget.src = "/placeholder-image.png";
                  // }}
                />
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {product.name}
                  </div>
                  <div className="text-sm text-gray-500">{product.brand}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div>
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  {product.category}
                </span>
                {product.subcategory && (
                  <span className="ml-2 text-xs text-gray-500">
                    / {product.subcategory}
                  </span>
                )}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {formatCurrency(product.price)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center space-x-2">
                <span className="text-sm">{getTotalStock(product)}</span>
                {getStockBadge(product)}
                <button
                  onClick={() => openStockModal(product)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Package className="w-4 h-4" />
                </button>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="ml-1 text-sm text-gray-600">
                  {product.rating?.toFixed(1) || "0.0"} (
                  {product.totalReviews || 0})
                </span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {product.totalOrders || 0}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button
                onClick={() => handleEdit(product)}
                className="text-indigo-600 hover:text-indigo-900 mr-3"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(product._id)}
                disabled={deletingProductId === product._id}
                className="text-red-600 hover:text-red-900 disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </td>
          </tr>
        ))}
      </TableWrapper>

      {totalPages > 1 && (
        <Pagination
          onCurrentPage={setCurrentPage}
          totalPages={totalPages}
          currentPage={currentPage}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {editingProduct
                  ? "Редактировать товар"
                  : "Добавить новые товары"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Цена
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Категория
                  </label>
                  {!showNewCategoryInput ? (
                    <div className="flex gap-2">
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            category: e.target.value,
                            subcategory: "",
                          });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Выберите категорию</option>
                        {categories.map((cat) => (
                          <option key={cat.category} value={cat.category}>
                            {cat.category}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowNewCategoryInput(true)}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Введите новую категорию"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddNewCategory}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewCategoryInput(false);
                            setNewCategory("");
                          }}
                          className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Подкатегория
                  </label>
                  {formData.category &&
                  getSubcategories(formData.category).length > 0 ? (
                    <select
                      value={formData.subcategory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subcategory: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Выберите подкатегорию</option>
                      {getSubcategories(formData.category).map((subcat) => (
                        <option key={subcat} value={subcat}>
                          {subcat}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.subcategory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subcategory: e.target.value,
                        })
                      }
                      placeholder={
                        formData.category
                          ? "Введите новую подкатегорию."
                          : "Сначала выберите основную категорию."
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!formData.category}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Бренд
                  </label>
                  {!showNewBrandInput ? (
                    <div className="flex gap-2">
                      <select
                        value={formData.brand}
                        onChange={(e) =>
                          setFormData({ ...formData, brand: e.target.value })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Выберите бренд</option>
                        {brands.map((brand) => (
                          <option key={brand} value={brand}>
                            {brand}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowNewBrandInput(true)}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newBrand}
                        onChange={(e) => setNewBrand(e.target.value)}
                        placeholder="Введите новый бренд"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewBrand}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewBrandInput(false);
                          setNewBrand("");
                        }}
                        className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Отмена
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Размер
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.sizes.map((size) => (
                    <span
                      key={size}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center"
                    >
                      {size}
                      <button
                        type="button"
                        onClick={() => removeSize(size)}
                        className="ml-2 text-blue-700 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    placeholder="Укажите размер (например, S, M, L, XL)"
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addSize}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    ОК
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Цвет
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.colors.map((color) => (
                    <span
                      key={color}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center"
                    >
                      {color}
                      <button
                        type="button"
                        onClick={() => removeColor(color)}
                        className="ml-2 text-green-700 hover:text-green-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    placeholder="Введите цвет (например, черный, белый, синий)"
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addColor}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    ОК
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Теги
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-purple-700 hover:text-purple-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Введите тег"
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    ОК
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Изображение
                </label>

                {editingProduct && existingImages.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Текущее изображение:
                    </p>
                    <div className="grid grid-cols-4 gap-4">
                      {existingImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={getImageUrl(image)}
                            alt={`Existing ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                            // onError={(e) => {
                            //   e.currentTarget.src = "/placeholder-image.png";
                            // }}
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Выберите несколько изображений, максимальный размер каждого
                  изображения — 5 МБ. Формат: JPG, PNG, GIF.
                </p>

                {imagesPreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-4">
                    {imagesPreviews.map((preview, index) => (
                      <img
                        key={index}
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingProduct ? "Обновление..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockModal && stockProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                Управление запасами - {stockProduct.name}
              </h2>
              <button
                onClick={() => setShowStockModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {stockUpdates.length === 0 ? (
                <p className="text-gray-500 text-center">Вариантов пока нет.</p>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Текущий объем запасов:{" "}
                      <strong>{getTotalStock(stockProduct)}</strong> товаров
                    </p>
                  </div>
                  {stockUpdates.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <span className="font-medium">{item.size}</span>
                        <span className="mx-2">-</span>
                        <span className="text-gray-600">{item.color}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">
                          Количество:
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateStockQuantity(index, e.target.value)
                          }
                          className="w-20 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={saveStockUpdates}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
