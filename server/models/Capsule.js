const mongoose = require("mongoose");

const capsuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    coverImage: {
      type: String,
    },

    // Тип капсулы
    type: {
      type: String,
      enum: ["manual", "auto", "personal"],
      required: true,
      index: true,
    },

    // Для отображения на клиенте
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },

    isTrending: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Основной список товаров (для manual и сгенерированных)
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // Разбитая структура (удобно для UI и логики)
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        role: {
          type: String,
          enum: ["top", "bottom", "outerwear", "shoes", "accessory", "bag"],
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Правила генерации (для auto капсул)
    rules: {
      styles: [String],
      seasons: [String],
      colorGroups: [String],
      brands: [String],

      minItems: {
        type: Number,
        default: 3,
      },

      maxItems: {
        type: Number,
        default: 6,
      },

      // какие роли обязательны
      requiredRoles: [
        {
          type: String,
          enum: ["top", "bottom", "outerwear", "shoes", "accessory", "bag"],
        },
      ],
    },

    // Для персональных капсул
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // Метрики (для аналитики и авто-капсул)
    stats: {
      views: {
        type: Number,
        default: 0,
      },
      clicks: {
        type: Number,
        default: 0,
      },
      purchases: {
        type: Number,
        default: 0,
      },
    },

    // Приоритет (для сортировки)
    priority: {
      type: Number,
      default: 0,
      index: true,
    },

    // Когда последний раз пересобиралась
    lastGeneratedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// 📊 Индексы
capsuleSchema.index({ type: 1, isPublished: 1 });
capsuleSchema.index({ isTrending: 1 });
capsuleSchema.index({ priority: -1 });
capsuleSchema.index({ "stats.views": -1 });

// 🔧 Метод: получить продукты (fallback если items не заполнен)
capsuleSchema.methods.getProductsList = function () {
  if (this.items && this.items.length > 0) {
    return this.items.map((i) => i.product);
  }
  return this.products;
};

// 🔁 Метод: проверить нужно ли пересобрать авто-капсулу
capsuleSchema.methods.needsRegeneration = function () {
  if (this.type !== "auto") return false;

  if (!this.lastGeneratedAt) return true;

  const now = new Date();
  const diffHours = (now - this.lastGeneratedAt) / (1000 * 60 * 60);

  return diffHours > 24; // раз в сутки
};

module.exports = mongoose.model("Capsule", capsuleSchema);
