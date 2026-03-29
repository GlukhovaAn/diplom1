import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Star,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface AdminSidebarProps {
  isOpen: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen }) => {
  const { logout } = useAuth();

  const menuItems = [
    { path: "/admin/dashboard", icon: LayoutDashboard, label: "Дашборд" },
    { path: "/admin/customers", icon: Users, label: "Клиенты" },
    { path: "/admin/orders", icon: ShoppingCart, label: "Заказы" },
    { path: "/admin/products", icon: Package, label: "Каталог" },
    {
      path: "/admin/capsules",
      icon: Star,
      label: "Капсулы",
    },
  ];

  return (
    <div
      className={`${isOpen ? "w-64" : "w-20"} bg-gray-800 transition-all duration-300`}
    >
      <div className="flex items-center justify-center h-16 bg-gray-900">
        <h1
          className={`text-white font-bold ${isOpen ? "text-xl" : "text-sm"}`}
        >
          {isOpen ? "MyShop Admin" : "FA"}
        </h1>
      </div>
      <nav className="mt-8">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
                isActive
                  ? "bg-gray-700 text-white border-l-4 border-blue-500"
                  : ""
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {isOpen && <span className="ml-3">{item.label}</span>}
          </NavLink>
        ))}

        <button
          onClick={logout}
          className="flex items-center w-full px-6 py-3 mt-8 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {isOpen && <span className="ml-3">Выйти</span>}
        </button>
      </nav>
    </div>
  );
};

export default AdminSidebar;
