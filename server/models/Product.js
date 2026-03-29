// backend/models/Product.js - Enhanced with Flash Sale Integration and Secondary Images
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    images: [String],
    secondaryImages: [
      {
        url: String,
        type: {
          type: String,
          enum: ["detail", "size_chart", "instruction", "material", "other"],
          default: "detail",
        },
        caption: String,
        order: {
          type: Number,
          default: 0,
        },
      },
    ],
    category: {
      type: String,
      required: true,
    },
    subcategory: String,
    brand: String,
    sizes: [String],
    colors: [String],
    stock: [
      {
        size: String,
        color: String,
        quantity: Number,
      },
    ],
    tags: [String],
    rating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    // Capsule-related fields
    capsuleRole: {
      type: String,
      enum: ["top", "bottom", "outerwear", "shoes", "accessory", "bag"],
      index: true,
    },

    season: [
      {
        type: String,
        enum: ["spring", "summer", "autumn", "winter", "all-season"],
        index: true,
      },
    ],

    style: [
      {
        type: String,
        enum: ["casual", "minimal", "street", "classic", "sport", "business"],
        index: true,
      },
    ],

    colorGroup: [
      {
        type: String,
        enum: [
          "black",
          "white",
          "neutral",
          "earth",
          "bright",
          "pastel",
          "denim",
        ],
        index: true,
      },
    ],

    baseColor: {
      type: String,
    },

    formality: {
      type: String,
      enum: ["casual", "smart-casual", "business", "sport"],
      index: true,
    },

    gender: {
      type: String,
      enum: ["men", "women", "unisex"],
      default: "unisex",
      index: true,
    },

    // Для авто-капсул и ранжирования
    popularityScore: {
      type: Number,
      default: 0,
      index: true,
    },

    // приоритет для продвижения
    capsulePriority: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ totalOrders: -1 });
productSchema.index({ viewCount: -1 });
productSchema.index({ capsuleRole: 1, style: 1 });
productSchema.index({ season: 1 });
productSchema.index({ colorGroup: 1 });
productSchema.index({ popularityScore: -1 });

// Method to get product with flash sale info
productSchema.methods.getWithFlashSale = async function () {
  const productObj = this.toObject();
  productObj.effectivePrice = this.price;

  return productObj;
};

// Method to get effective price (flash sale or regular)
productSchema.methods.getEffectivePrice = async function () {
  return {
    price: this.price,
    originalPrice: this.price,
    discountPercentage: 0,
  };
};

// Method to check stock considering flash sale limits
productSchema.methods.getAvailableStock = async function (size, color) {
  const stockItem = this.stock.find(
    (s) => s.size === size && s.color === color
  );
  if (!stockItem) return 0;

  let availableQuantity = stockItem.quantity;

  return availableQuantity;
};

// Static method to get products with flash sale info
productSchema.statics.getProductsWithFlashSale = async function (
  filter = {},
  options = {}
) {
  const products = await this.find(filter, null, options);
  return products;
};

// Static method for getting products for recommendations with flash sale
productSchema.statics.getRecommendedWithFlashSale = async function (
  productIds,
  limit = 20
) {
  return this.getProductsWithFlashSale({ _id: { $in: productIds } }, { limit });
};

module.exports = mongoose.model("Product", productSchema);
