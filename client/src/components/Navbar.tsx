import React, { useState } from "react";
import { Link } from "react-router-dom";

import {
  ShoppingCartIcon,
  UserIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
  };

  const NotificationBadge = ({
    count,
    className = "",
    animate = false,
  }: {
    count: number;
    className?: string;
    animate?: boolean;
  }) =>
    count > 0 ? (
      <span
        className={`absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium ${animate ? "animate-pulse" : ""} ${className}`}
      >
        {count > 9 ? "9+" : count}
      </span>
    ) : null;

  const NavLink = ({
    to,
    children,
    onClick,
    className = "",
  }: {
    to?: string;
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) =>
    to ? (
      <Link
        to={to}
        className={`text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium ${className}`}
        onClick={onClick}
      >
        {children}
      </Link>
    ) : (
      <button
        onClick={onClick}
        className={`text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium ${className}`}
      >
        {children}
      </button>
    );

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            MyShop
          </Link>

          <div className="hidden lg:flex items-center space-x-8">
            <NavLink to="/">Главная</NavLink>

            {user && (
              <>
                <NavLink to="/capsules" className="flex items-center space-x-1">
                  <span>Капсулы</span>
                </NavLink>
                <NavLink to="/wishlist" className="flex items-center space-x-1">
                  <span>Избранное</span>
                </NavLink>
                <NavLink to="/orders">Заказы</NavLink>
              </>
            )}

            <Link
              to="/cart"
              className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              <NotificationBadge count={totalItems} className="bg-red-500" />
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 border border-transparent hover:border-blue-200"
                >
                  <UserIcon className="h-5 w-5" />
                  <span className="font-medium">{user.name}</span>
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform duration-200 ${userDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 transform opacity-100 scale-100 transition-all duration-200">
                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <UserIcon className="h-4 w-4 mr-3" />
                          Профиль
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                        >
                          <svg
                            className="h-4 w-4 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Выйти
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <NavLink to="/login">Войти</NavLink>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
