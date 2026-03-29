import React from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import AdminRoute from "./components/admin/AdminRoute";
import Home from "./pages/home/page";
import ProductDetail from "./pages/product/ProductDetail";
import Cart from "./pages/cart/Cart";
import Checkout from "./pages/checkout/Checkout";
import OrderHistory from "./pages/orders/OrderHistory";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Wishlist from "./pages/wishlist/Wishlist";
import Profile from "./pages/profile/Profile";
import AdminLayout from "./components/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminCapsules from "./pages/admin/AdminCapsules";
import { Capsules } from "./pages/capsules/Capsules";

const PageWithNavbar: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
};

const ProtectedPageWithNavbar: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <PageWithNavbar>{children}</PageWithNavbar>;
};

const AuthPage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                <PageWithNavbar>
                  <Home />
                </PageWithNavbar>
              }
            />
            <Route
              path="/product/:id"
              element={
                <PageWithNavbar>
                  <ProductDetail />
                </PageWithNavbar>
              }
            />
            <Route
              path="/login"
              element={
                <AuthPage>
                  <Login />
                </AuthPage>
              }
            />
            <Route
              path="/register"
              element={
                <AuthPage>
                  <Register />
                </AuthPage>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedPageWithNavbar>
                  <Cart />
                </ProtectedPageWithNavbar>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedPageWithNavbar>
                  <Checkout />
                </ProtectedPageWithNavbar>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedPageWithNavbar>
                  <OrderHistory />
                </ProtectedPageWithNavbar>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedPageWithNavbar>
                  <Wishlist />
                </ProtectedPageWithNavbar>
              }
            />
            <Route
              path="/capsules"
              element={
                <ProtectedPageWithNavbar>
                  <Capsules />
                </ProtectedPageWithNavbar>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedPageWithNavbar>
                  <Profile />
                </ProtectedPageWithNavbar>
              }
            />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route
                  index
                  element={<Navigate to="/admin/dashboard" replace />}
                />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="capsules" element={<AdminCapsules />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
