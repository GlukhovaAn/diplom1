const dotenv = require("dotenv");
dotenv.config();

console.log("Environment check at startup:");
console.log("- NODE_ENV:", process.env.NODE_ENV || "development");
console.log("- PORT:", process.env.PORT || 5000);
console.log(
  "- GEMINI_API_KEY:",
  process.env.GEMINI_API_KEY ? "Loaded" : "Missing"
);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const recommendationRoutes = require("./routes/recommendations");
const userRoutes = require("./routes/users");
const capsulesRoutes = require("./routes/capsules");

const adminAuthRoutes = require("./routes/admin/auth");
const adminDashboardRoutes = require("./routes/admin/dashboard");
const adminProductRoutes = require("./routes/admin/products");
const adminOrderRoutes = require("./routes/admin/orders");
const adminUserRoutes = require("./routes/admin/users");
const adminNotificationRoutes = require("./routes/admin/notifications");
const adminCapsulesRoutes = require("./routes/admin/capsules");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/uploads", (req, res, next) => {
  console.log("Static file requested:", req.url);
  next();
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

const MONGODB_URI = process.env.MONGODB_URI || "";
console.log(MONGODB_URI);

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    console.log("Database:", mongoose.connection.name);
    console.log("Static files served from:", path.join(__dirname, "uploads"));
  })
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/capsules", capsulesRoutes);

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);
app.use("/api/admin/capsules", adminCapsulesRoutes);

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("joinChat", (userId) => {
    socket.join(`user-${userId}`);
    socket.join("chat-room");
    console.log(`User ${userId} joined chat room`);
  });
  socket.on("joinAdminRoom", () => {
    socket.join("admin-room");
    console.log("Admin joined admin room");
  });
  socket.on("joinConversation", (conversationId) => {
    socket.join(`conversation-${conversationId}`);
    console.log(`Socket joined conversation: ${conversationId}`);
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.use((req, res, next) => {
  if (req.url.startsWith("/uploads")) {
    console.log("404 - Image not found:", req.url);
    res
      .status(404)
      .sendFile(path.join(__dirname, "public", "placeholder-image.png"));
  } else {
    next();
  }
});

app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong!",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Frontend URL: http://localhost:3000`);
  console.log(`Static files: http://localhost:${PORT}/uploads/`);
});
