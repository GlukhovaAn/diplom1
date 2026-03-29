const mongoose = require("mongoose");
const Product = require("./models/Product");
const Capsule = require("./models/Capsule");
const Order = require("./models/Order");
require("dotenv").config();

const products = [
  // ===== MINIMAL CAPSULE =====
  {
    name: "Белая минимал футболка",
    description: "Базовая футболка в минимал стиле",
    price: 2000,
    images: ["uploads/products/pr1.jpg"],
    category: "Одежда",
    subcategory: "Футболки",
    brand: "Minimal Co",
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: [
      { size: "S", color: "Белый", quantity: 10 },
      { size: "M", color: "Белый", quantity: 15 },
      { size: "L", color: "Белый", quantity: 20 },
    ],
    colors: ["Белый"],
    style: ["minimal"],
    season: ["summer"],
    colorGroup: ["white"],
    capsuleRole: "top",
    formality: "casual",
    gender: "women",
  },

  {
    name: "Бежевые брюки",
    price: 4000,
    description: "Минимал брюки",
    images: ["uploads/products/pr2.jpg"],
    category: "Брюки",
    brand: "Minimal Co",
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: [
      { size: "S", color: "Бежевый", quantity: 10 },
      { size: "M", color: "Бежевый", quantity: 15 },
      { size: "L", color: "Бежевый", quantity: 20 },
    ],
    colors: ["Бежевый"],
    style: ["minimal"],
    season: ["summer"],
    colorGroup: ["earth"],
    capsuleRole: "bottom",
    formality: "casual",
    gender: "women",
  },

  {
    name: "Белые кроссовки",
    price: 5000,
    description: "Универсальные кроссовки",
    images: ["uploads/products/pr3.jpg"],
    category: "Обувь",
    brand: "Minimal Co",
    sizes: ["37", "38", "39", "40", "41"],
    stock: [
      { size: "37", color: "Белый", quantity: 10 },
      { size: "39", color: "Белый", quantity: 15 },
      { size: "41", color: "Белый", quantity: 20 },
    ],
    colors: ["Белый"],
    style: ["minimal"],
    season: ["summer"],
    colorGroup: ["white"],
    capsuleRole: "shoes",
    gender: "women",
  },

  // ===== STREET CAPSULE =====
  {
    name: "Чёрный худи",
    price: 4500,
    description: "Street стиль худи",
    images: ["uploads/products/pr4.jpg"],
    category: "Одежда",
    brand: "Street Brand",
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: [
      { size: "S", color: "Чёрный", quantity: 10 },
      { size: "M", color: "Чёрный", quantity: 15 },
      { size: "L", color: "Чёрный", quantity: 20 },
    ],
    colors: ["Чёрный"],
    style: ["street"],
    season: ["autumn"],
    colorGroup: ["black"],
    capsuleRole: "top",
    gender: "women",
  },

  {
    name: "Джинсы street",
    price: 5000,
    description: "Свободные джинсы",
    images: ["uploads/products/pr5.jpg"],
    category: "Брюки",
    brand: "Street Brand",
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: [
      { size: "S", color: "Синий", quantity: 10 },
      { size: "M", color: "Синий", quantity: 15 },
      { size: "L", color: "Синий", quantity: 20 },
    ],
    colors: ["Синий"],
    style: ["street"],
    season: ["autumn"],
    colorGroup: ["denim"],
    capsuleRole: "bottom",
    gender: "women",
  },

  {
    name: "Кроссовки street",
    price: 7000,
    description: "Street sneakers",
    images: ["uploads/products/pr6.jpg"],
    category: "Обувь",
    brand: "Street Brand",
    sizes: ["37", "38", "39", "40", "41"],
    stock: [
      { size: "37", color: "Белый", quantity: 10 },
      { size: "39", color: "Белый", quantity: 15 },
      { size: "41", color: "Белый", quantity: 20 },
    ],
    colors: ["Чёрный"],
    style: ["street"],
    season: ["autumn"],
    colorGroup: ["black"],
    capsuleRole: "shoes",
    gender: "women",
  },

  {
    name: "Бомбер",
    price: 8000,
    description: "Куртка street style",
    images: ["uploads/products/pr7.jpg"],
    category: "Верхняя одежда",
    brand: "Street Brand",
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: [
      { size: "S", color: "Чёрный", quantity: 10 },
      { size: "M", color: "Чёрный", quantity: 15 },
      { size: "L", color: "Чёрный", quantity: 20 },
    ],
    colors: ["Чёрный"],
    style: ["street"],
    season: ["autumn"],
    colorGroup: ["black"],
    capsuleRole: "outerwear",
    gender: "women",
  },

  // ===== CASUAL CAPSULE =====
  {
    name: "Синяя рубашка",
    price: 3500,
    description: "Casual рубашка",
    images: ["uploads/products/pr8.jpg"],
    category: "Одежда",
    brand: "Casual Co",
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: [
      { size: "S", color: "Синий", quantity: 10 },
      { size: "M", color: "Синий", quantity: 15 },
      { size: "L", color: "Синий", quantity: 20 },
    ],
    colors: ["Синий"],
    style: ["casual"],
    season: ["spring"],
    colorGroup: ["neutral"],
    capsuleRole: "top",
    gender: "women",
  },

  {
    name: "Серые брюки",
    price: 4200,
    description: "Casual брюки",
    images: ["uploads/products/pr9.jpg"],
    category: "Брюки",
    brand: "Casual Co",
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: [
      { size: "S", color: "Серый", quantity: 10 },
      { size: "M", color: "Серый", quantity: 15 },
      { size: "L", color: "Серый", quantity: 20 },
    ],
    colors: ["Серый"],
    style: ["casual"],
    season: ["spring"],
    colorGroup: ["neutral"],
    capsuleRole: "bottom",
    gender: "women",
  },

  {
    name: "Лоферы",
    price: 6000,
    description: "Casual обувь",
    images: ["uploads/products/pr10.jpg"],
    category: "Обувь",
    brand: "Casual Co",
    sizes: ["37", "38", "39", "40", "41"],
    stock: [
      { size: "37", color: "Черный", quantity: 10 },
      { size: "39", color: "Черный", quantity: 15 },
      { size: "41", color: "Черный", quantity: 20 },
    ],
    colors: ["Черный"],
    style: ["casual"],
    season: ["spring"],
    colorGroup: ["earth"],
    capsuleRole: "shoes",
    gender: "women",
  },
];

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fashion-shop")
  .then(async () => {
    await Product.deleteMany();
    await Order.deleteMany();
    await Capsule.deleteMany();
    await Product.insertMany(products);
    console.log("Seed products added!");
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
