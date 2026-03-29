const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fashion-shop")
  .then(async () => {
    console.log("MongoDB connected");

    // Проверяем, существует ли super admin
    const existingSuperAdmin = await User.findOne({
      email: "admin@gmail.com",
    });

    if (!existingSuperAdmin) {
      const superAdmin = new User({
        name: "Super Admin",
        email: "admin@gmail.com",
        password: "admin123", // поменяй потом!
        phone: "0123456789",
        address: "Head Office",
        role: "admin",
      });

      await superAdmin.save();
      console.log("Super Admin created");
    } else {
      console.log("Super Admin already exists");
    }

    // Проверяем обычного админа
    const existingAdmin = await User.findOne({
      email: "manager@gmail.com",
    });

    if (!existingAdmin) {
      const admin = new User({
        name: "Store Manager",
        email: "manager@gmail.com",
        password: "admin123",
        phone: "0987654321",
        address: "Store Office",
        role: "admin",
      });

      await admin.save();
      console.log("Admin created");
    } else {
      console.log("Admin already exists");
    }

    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
