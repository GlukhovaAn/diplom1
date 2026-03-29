// backend/models/Cart.js
const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        size: String,
        color: String,
        price: {
          type: Number,
          required: true,
        },
        originalPrice: Number,
        discountPercentage: Number,
      },
    ],
    totalPrice: {
      type: Number,
      default: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
cartSchema.index({ user: 1 });
cartSchema.index({ "items.product": 1 });

// Method to validate and update flash sale items
cartSchema.methods.validateFlashSaleItems = async function () {
  let hasChanges = false;
  return hasChanges;
};

// Method to add/update item with flash sale check
cartSchema.methods.addItemWithFlashSale = async function (
  productId,
  quantity,
  size,
  color
) {
  const Product = mongoose.model("Product");

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  let flashSaleInfo = null;

  // Check if item already exists
  const existingItemIndex = this.items.findIndex(
    (item) =>
      item.product.toString() === productId.toString() &&
      item.size === size &&
      item.color === color
  );

  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].price = product.price;
  } else {
    // Add new item
    const newItem = {
      product: productId,
      quantity,
      size,
      color,
      price: product.price,
      originalPrice: flashSaleInfo?.originalPrice || null,
      discountPercentage: flashSaleInfo?.discountPercentage || null,
    };

    this.items.push(newItem);
  }

  this.calculateTotals();
  await this.save();

  return this;
};

// Method to calculate totals including discounts
cartSchema.methods.calculateTotals = function () {
  let total = 0;
  let discount = 0;

  this.items.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
  });

  this.totalPrice = total;
  this.totalDiscount = discount;
};

// Method to get formatted cart with details
cartSchema.methods.getFormattedCart = async function () {
  await this.populate("items.product");
  await this.validateFlashSaleItems();

  const formattedItems = this.items.map((item) => ({
    _id: item._id,
    product: item.product,
    quantity: item.quantity,
    size: item.size,
    color: item.color,
    price: item.price,
    originalPrice: item.originalPrice,
    discountPercentage: item.discountPercentage,
    subtotal: item.price * item.quantity,
    savings:
      item.isFlashSaleItem && item.originalPrice
        ? (item.originalPrice - item.price) * item.quantity
        : 0,
  }));

  return {
    items: formattedItems,
    totalPrice: this.totalPrice,
    totalDiscount: this.totalDiscount,
    finalPrice: this.totalPrice,
    itemCount: this.items.reduce((sum, item) => sum + item.quantity, 0),
  };
};

// Pre-save middleware to calculate totals
cartSchema.pre("save", function (next) {
  this.calculateTotals();
  next();
});

module.exports = mongoose.model("Cart", cartSchema);
