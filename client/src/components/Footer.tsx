import { EnvelopeIcon } from "@heroicons/react/24/outline";
import {
  ChevronDownIcon,
  MapPinIcon,
  PhoneIcon,
  ShoppingBagIcon,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <footer className="bg-gray-900 text-white mt-20 w-full">
      <div className="w-full px-8 lg:px-16 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <ShoppingBagIcon className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold">MyShop</span>
            </div>
            <p className="text-gray-400 mb-6">
              Надежный магазин высококачественной одежды по разумным ценам.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4 lg:mb-6">
              <button
                onClick={() => toggleSection("links")}
                className="flex items-center justify-between w-full lg:cursor-default"
              >
                <span>Навигация</span>
                <ChevronDownIcon
                  className={`w-5 h-5 lg:hidden transition-transform ${expandedSection === "links" ? "rotate-180" : ""}`}
                />
              </button>
            </h4>
            <ul
              className={`space-y-3 text-gray-400 ${expandedSection === "links" || "hidden lg:block"}`}
            >
              <li>
                <Link
                  to="/about"
                  className="hover:text-white transition-colors"
                >
                  О нас
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="hover:text-white transition-colors"
                >
                  Продукты
                </Link>
              </li>
              <li>
                <Link
                  to="/promotions"
                  className="hover:text-white transition-colors"
                >
                  Акции
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-white transition-colors">
                  Блог
                </Link>
              </li>
              <li>
                <Link
                  to="/size-guide"
                  className="hover:text-white transition-colors"
                >
                  Размеры
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="hover:text-white transition-colors"
                >
                  Карьера
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4 lg:mb-6">
              <button
                onClick={() => toggleSection("service")}
                className="flex items-center justify-between w-full lg:cursor-default"
              >
                <span>Как купить</span>
                <ChevronDownIcon
                  className={`w-5 h-5 lg:hidden transition-transform ${expandedSection === "service" ? "rotate-180" : ""}`}
                />
              </button>
            </h4>
            <ul
              className={`space-y-3 text-gray-400 ${expandedSection === "service" || "hidden lg:block"}`}
            >
              <li>
                <Link
                  to="/shipping"
                  className="hover:text-white transition-colors"
                >
                  Доставка
                </Link>
              </li>
              <li>
                <Link
                  to="/returns"
                  className="hover:text-white transition-colors"
                >
                  Возврат
                </Link>
              </li>
              <li>
                <Link
                  to="/payment"
                  className="hover:text-white transition-colors"
                >
                  Оплата
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  Частые вопросы
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-white transition-colors"
                >
                  Контакты
                </Link>
              </li>
              <li>
                <Link
                  to="/track-order"
                  className="hover:text-white transition-colors"
                >
                  Отслеживание
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4 lg:mb-6">
              <button
                onClick={() => toggleSection("contact")}
                className="flex items-center justify-between w-full lg:cursor-default"
              >
                <span>Контакты</span>
                <ChevronDownIcon
                  className={`w-5 h-5 lg:hidden transition-transform ${expandedSection === "contact" ? "rotate-180" : ""}`}
                />
              </button>
            </h4>
            <div
              className={`space-y-4 text-gray-400 ${expandedSection === "contact" || "hidden lg:block"}`}
            >
              <div className="flex items-start space-x-3">
                <MapPinIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Москва, Красная площадь</span>
              </div>
              <div className="flex items-start space-x-3">
                <PhoneIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p>8 800 555 55 55</p>
                  <p className="text-xs">(10:00 - 22:00 Мск)</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <EnvelopeIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">support@fashionshop.ru</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h4 className="font-semibold text-lg mb-2">Скачать приложение</h4>
              <p className="text-gray-400 text-sm">
                Получайте эксклюзивные уведомления и специальные предложения.
              </p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="block">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Download_on_the_App_Store_Badge.svg/203px-Download_on_the_App_Store_Badge.svg.png"
                  alt="App Store"
                  className="h-10"
                />
              </a>
              <a href="#" className="block">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/270px-Google_Play_Store_badge_EN.svg.png"
                  alt="Google Play"
                  className="h-10"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-950 py-6 w-full">
        <div className="px-8 lg:px-16">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 MyShop. Все права защищены.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <Link
                to="/privacy"
                className="hover:text-white transition-colors"
              >
                Политика конфиденциальности
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors">
                Персональные данные
              </Link>
              <Link
                to="/cookies"
                className="hover:text-white transition-colors"
              >
                Cookie
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
