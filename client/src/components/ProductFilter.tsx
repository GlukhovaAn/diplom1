import React, { useState, useEffect } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import axios from "../utils/axios";

interface ProductFilterProps {
  filters: any;
  onFilterChange: (filters: any) => void;
}

interface FilterSection {
  title: string;
  key: string;
  type: "single" | "multiple" | "range";
  options?: string[];
  min?: number;
  max?: number;
}

const ProductFilter: React.FC<ProductFilterProps> = ({
  filters,
  onFilterChange,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["category", "price"])
  );
  const [localFilters, setLocalFilters] = useState(filters);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [appliedFiltersCount, setAppliedFiltersCount] = useState(0);

  const filterSections: FilterSection[] = [
    {
      title: "Категория",
      key: "category",
      type: "single",
      options: categories,
    },
    {
      title: "Бренд",
      key: "brand",
      type: "single",
      options: brands,
    },
    {
      title: "Цена",
      key: "price",
      type: "range",
      min: 0,
      max: 10000000,
    },
    {
      title: "Размер",
      key: "size",
      type: "multiple",
      options: ["XS", "S", "M", "L", "XL", "XXL"],
    },
    {
      title: "Цвет",
      key: "color",
      type: "multiple",
      options: [
        "Черный",
        "Белый",
        "Синий",
        "Красный",
        "Желтый",
        "Серый",
        "Коричневый",
        "Розовый",
        "Фиолетовый",
        "Оранжевый",
      ],
    },
    {
      title: "Оценка",
      key: "rating",
      type: "single",
      options: ["5", "4+", "3+", "2+", "1+"],
    },
  ];

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    setLocalFilters(filters);
    countAppliedFilters(filters);
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      const categoriesResponse = await axios.get("/products/categories");
      setCategories(categoriesResponse.data);
      const brandsResponse = await axios.get("/products/brands");
      setBrands(brandsResponse.data);
    } catch (error) {
      console.error("Error fetching filter options:", error);
      setCategories([
        "Футболки",
        "Рубашки",
        "Джинсы",
        "Платья",
        "Куртки",
        "Аксессуары",
      ]);
      setBrands(["Nike", "Adidas", "Zara", "H&M", "Uniqlo"]);
    }
  };

  const countAppliedFilters = (currentFilters: any) => {
    let count = 0;
    Object.keys(currentFilters).forEach((key) => {
      if (key === "search") return;

      if (
        Array.isArray(currentFilters[key]) &&
        currentFilters[key].length > 0
      ) {
        count += currentFilters[key].length;
      } else if (
        currentFilters[key] &&
        typeof currentFilters[key] === "object"
      ) {
        if (currentFilters[key].min > 0 || currentFilters[key].max < 10000000) {
          count++;
        }
      } else if (currentFilters[key]) {
        count++;
      }
    });
    setAppliedFiltersCount(count);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleFilterChange = (key: string, value: any, type: string) => {
    let newFilters = { ...localFilters };

    if (type === "single") {
      if (newFilters[key] === value) {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
    } else if (type === "multiple") {
      if (!newFilters[key]) {
        newFilters[key] = [];
      }
      const index = newFilters[key].indexOf(value);
      if (index > -1) {
        newFilters[key].splice(index, 1);
        if (newFilters[key].length === 0) {
          delete newFilters[key];
        }
      } else {
        newFilters[key].push(value);
      }
    } else if (type === "range") {
      newFilters[key] = value;
      if (value.min === 0 && value.max === 10000000) {
        delete newFilters[key];
      }
    }

    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = filters.search ? { search: filters.search } : {};
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const formatPrice = (price: number) => {
    return price;
  };

  const isFilterActive = (key: string, value?: any): boolean => {
    if (!localFilters[key]) return false;

    if (value !== undefined) {
      if (Array.isArray(localFilters[key])) {
        return localFilters[key].includes(value);
      }
      return localFilters[key] === value;
    }

    return true;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Фильтр</h3>
          {appliedFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <XMarkIcon className="h-4 w-4" />
              <span>Сбросить ({appliedFiltersCount})</span>
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {filterSections.map((section) => {
          const isExpanded = expandedSections.has(section.key);
          const sectionOptions =
            section.key === "category"
              ? categories
              : section.key === "brand"
                ? brands
                : section.options || [];

          return (
            <div key={section.key} className="p-4">
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full flex justify-between items-center text-left"
              >
                <span className="font-medium text-gray-700">
                  {section.title}
                </span>
                {isExpanded ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-3">
                  {section.type === "range" ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          placeholder="От"
                          value={localFilters[section.key]?.min || ""}
                          onChange={(e) =>
                            handleFilterChange(
                              section.key,
                              {
                                min: parseInt(e.target.value) || 0,
                                max:
                                  localFilters[section.key]?.max || section.max,
                              },
                              "range"
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="number"
                          placeholder="До"
                          value={localFilters[section.key]?.max || ""}
                          onChange={(e) =>
                            handleFilterChange(
                              section.key,
                              {
                                min: localFilters[section.key]?.min || 0,
                                max: parseInt(e.target.value) || section.max,
                              },
                              "range"
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ) : section.type === "single" ? (
                    <div className="space-y-1">
                      {sectionOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() =>
                            handleFilterChange(section.key, option, "single")
                          }
                          className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                            isFilterActive(section.key, option)
                              ? "bg-blue-100 text-blue-700 font-medium"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {section.key === "rating" ? (
                            <span className="flex items-center">
                              <span className="mr-1">{option}</span>
                              <span className="text-yellow-400">★</span>
                            </span>
                          ) : (
                            option
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {sectionOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() =>
                            handleFilterChange(section.key, option, "multiple")
                          }
                          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                            isFilterActive(section.key, option)
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {appliedFiltersCount > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">Текущие:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(localFilters).map(([key, value]: [string, any]) => {
              if (key === "search" || !value) return null;

              if (Array.isArray(value)) {
                return value.map((v) => (
                  <span
                    key={`${key}-${v}`}
                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                  >
                    {v}
                    <button
                      onClick={() => handleFilterChange(key, v, "multiple")}
                      className="ml-1 hover:text-blue-900"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ));
              } else if (typeof value === "object" && value.min !== undefined) {
                return (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                  >
                    {formatPrice(value.min)} - {formatPrice(value.max)}
                    <button
                      onClick={() =>
                        handleFilterChange(
                          key,
                          { min: 0, max: 10000000 },
                          "range"
                        )
                      }
                      className="ml-1 hover:text-blue-900"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                );
              } else {
                return (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                  >
                    {value}
                    <button
                      onClick={() => handleFilterChange(key, value, "single")}
                      className="ml-1 hover:text-blue-900"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                );
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilter;
