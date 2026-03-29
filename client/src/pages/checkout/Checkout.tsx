import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import {
  CheckCircleIcon,
  TicketIcon,
  XMarkIcon,
  InformationCircleIcon,
  MapPinIcon,
  CreditCardIcon,
  TruckIcon,
  ArrowLeftIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/solid";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import OptimizedImage from "../../components/OptimizedImage";

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { clearCart, fetchCart } = useCart();
  const { user } = useAuth();
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "00000",
    country: "Россия",
  });

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [processing, setProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [qrCodeData, setQrCodeData] = useState<any>(null);

  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState("");
  const [voucherDetails, setVoucherDetails] = useState<any>(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  useEffect(() => {
    const checkoutItemsStr = sessionStorage.getItem("checkoutItems");
    if (!checkoutItemsStr) {
      navigate("/cart");
      return;
    }

    const items = JSON.parse(checkoutItemsStr);
    setSelectedItems(items);

    if (user) {
      setCustomerName(user.name || "");
      setCustomerPhone(user.phone || "");
      if (user.address) {
        const addressParts = user.address.split(",");
        if (addressParts.length > 0) {
          setShippingAddress((prev) => ({
            ...prev,
            street: addressParts[0]?.trim() || "",
            state: addressParts[1]?.trim() || "",
            city: addressParts[2]?.trim() || "",
          }));
        }
      }
    }

    checkFinalAvailability();
  }, [user, navigate]);

  const checkFinalAvailability = async () => {
    try {
      const { data } = await axios.get("/cart/check-availability");
      if (!data.available) {
        alert(
          "Некоторые товары отсутствуют на складе. Пожалуйста, вернитесь в корзину, чтобы проверить наличие."
        );
        navigate("/cart");
      }
    } catch (error) {
      console.error("Error checking availability:", error);
    }
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const calculateOriginalSubtotal = () => {
    return selectedItems.reduce((total, item) => {
      const price = item.originalPrice || item.price;
      return total + price * item.quantity;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal - voucherDiscount;
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone);
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError("Пожалуйста, введите код купона.");
      return;
    }

    setApplyingVoucher(true);
    setVoucherError("");

    try {
      const orderAmount = calculateSubtotal();
      const orderItems = selectedItems.map((item) => ({
        productId: item.product._id,
        product: item.product,
        quantity: item.quantity,
        price: item.price,
      }));

      const { data } = await axios.post("/orders/validate-voucher", {
        code: voucherCode,
        orderAmount,
        orderItems,
      });

      if (data.valid) {
        setVoucherDiscount(data.discountAmount);
        setVoucherDetails(data);
      }
    } catch (error: any) {
      setVoucherError(error.response?.data?.message || "Неверный код ваучера");
      setVoucherDiscount(0);
      setVoucherDetails(null);
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherCode("");
    setVoucherDiscount(0);
    setVoucherDetails(null);
    setVoucherError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhone(customerPhone)) {
      alert("Неверный номер телефона");
      return;
    }

    setProcessing(true);
    try {
      const selectedItemIds = selectedItems.map((item) => item._id);
      const subtotal = calculateSubtotal();
      const total = calculateTotal();

      const fullShippingAddress = {
        ...shippingAddress,
        recipientName: customerName,
        recipientPhone: customerPhone,
      };

      const orderData = {
        shippingAddress: fullShippingAddress,
        paymentMethod,
        selectedItemIds,
        voucherCode: voucherDetails?.code || null,
        subtotal: subtotal,
        discountAmount: voucherDiscount,
        totalAmount: total,
        customerName,
        customerPhone,
      };

      const { data } = await axios.post("/orders/create", orderData);

      setOrderId(data.order._id);

      if (data.qrCodeData) {
        setQrCodeData(data.qrCodeData);
      }

      setOrderSuccess(true);
      sessionStorage.removeItem("checkoutItems");

      if (data.remainingCartItems === 0) {
        clearCart();
      } else {
        await fetchCart();
      }

      if (paymentMethod !== "BankTransfer") {
        setTimeout(() => {
          navigate("/orders");
        }, 3000);
      }
    } catch (error: any) {
      console.error("Error creating order:", error);

      if (error.response?.data?.unavailableItems) {
        alert(
          "Некоторые товары отсутствуют на складе. Пожалуйста, вернитесь в корзину."
        );
        navigate("/cart");
      } else {
        alert(
          error.response?.data?.message ||
            "В процессе оформления заказа произошла ошибка."
        );
      }
    } finally {
      setProcessing(false);
    }
  };

  if (orderSuccess && paymentMethod === "BankTransfer" && qrCodeData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-green-500 p-6 text-white text-center">
              <CheckCircleIcon className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                Заказ успешно оформлен
              </h2>
              <p className="text-green-100">
                Номер заказа:{" "}
                <span className="font-mono font-bold">
                  #{orderId.slice(-8).toUpperCase()}
                </span>
              </p>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Оплата через QR-код
                </h3>
                <p className="text-gray-600">Отсканируйте QR-код для оплаты.</p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate("/orders")}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Посмотреть мой заказ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Заказ успешно оформлен!
          </h2>
          <p className="text-gray-600 mb-2">Номер вашего заказа:</p>
          <p className="text-xl font-bold font-mono text-blue-600 mb-6">
            #{orderId}
          </p>
          <div className="flex items-center justify-center text-sm text-gray-500">
            <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
            Перейти на страницу управления заказами...
          </div>
        </div>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const originalSubtotal = calculateOriginalSubtotal();
  const totalAmount = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/cart")}
              className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Вернуться</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <MapPinIcon className="w-5 h-5 mr-2 text-blue-500" />
                  Адрес доставки
                </h2>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ФИО *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Номер телефона *
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) =>
                        setCustomerPhone(e.target.value.replace(/\D/g, ""))
                      }
                      className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                        customerPhone && !validatePhone(customerPhone)
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                      pattern="[0-9]{10,11}"
                      maxLength={11}
                      required
                    />
                    {customerPhone && !validatePhone(customerPhone) && (
                      <p className="text-red-500 text-xs mt-1">
                        Телефонные номера должны состоять из 11 цифр.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Адрес *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.street}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          street: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Район *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            state: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Город *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            city: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <CreditCardIcon className="w-5 h-5 mr-2 text-blue-500" />
                  Способы оплаты
                </h2>

                <div className="space-y-3">
                  <label
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === "COD"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-blue-600"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-gray-800">Наличными</p>
                      <p className="text-sm text-gray-500">
                        Оплата наличными курьеру
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === "BankTransfer"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      value="BankTransfer"
                      checked={paymentMethod === "BankTransfer"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-blue-600"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-gray-800">СПБ</p>
                      <p className="text-sm text-gray-500">
                        С помощью QR-кода или приложение банка
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <TicketIcon className="w-5 h-5 mr-2 text-amber-500" />
                  Промокод
                </h2>

                {!voucherDetails ? (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) =>
                        setVoucherCode(e.target.value.toUpperCase())
                      }
                      placeholder="Введите код ваучера"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors uppercase font-medium"
                      disabled={applyingVoucher}
                    />
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      disabled={applyingVoucher || !voucherCode.trim()}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        applyingVoucher || !voucherCode.trim()
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-amber-500 text-white hover:bg-amber-600"
                      }`}
                    >
                      {applyingVoucher ? (
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        "Применить"
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-green-800">
                        {voucherDetails.code}
                      </p>
                      <p className="text-sm text-green-600">
                        {voucherDetails.description}
                      </p>
                      <p className="text-sm font-medium text-green-700 mt-1">
                        Скидка: {voucherDiscount.toLocaleString()} Р
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="text-green-600 hover:text-green-800"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {voucherError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <InformationCircleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-red-600 text-sm">{voucherError}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                      <ShoppingBagIcon className="w-5 h-5 mr-2 text-blue-500" />
                      Товары ({selectedItems.length})
                    </h3>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {selectedItems.map((item) => (
                      <div
                        key={item._id}
                        className="p-4 border-b border-gray-50 last:border-b-0"
                      >
                        <div className="flex gap-3">
                          <div className="relative">
                            <OptimizedImage
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-12 h-12 object-cover rounded"
                              width={300}
                              height={300}
                              loading="lazy"
                              placeholder="/placeholder.jpg"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-800 line-clamp-1">
                              {item.product.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {item.size}, {item.color} • x{item.quantity}
                            </p>
                            <div className="mt-1">
                              {item.originalPrice &&
                              item.originalPrice !== item.price ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 line-through">
                                    {item.originalPrice.toLocaleString()} Р
                                  </span>
                                  <span className="text-sm font-medium text-blue-600">
                                    {item.price.toLocaleString()} Р
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm font-medium text-gray-800">
                                  {item.price.toLocaleString()} Р
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    Стоимость
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Итого</span>
                      <span>{subtotal.toLocaleString()} Р</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 flex items-center">
                        <TruckIcon className="w-3 h-3 mr-1 text-blue-500" />
                        Стоимость доставки
                      </span>
                      <span className="text-green-600">Бесплатно</span>
                    </div>

                    {voucherDiscount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 flex items-center">
                          <TicketIcon className="w-3 h-3 mr-1 text-amber-500" />
                          Купон
                        </span>
                        <span className="text-green-600">
                          -{voucherDiscount.toLocaleString()} Р
                        </span>
                      </div>
                    )}

                    <div className="pt-3 mt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800">
                          Итого
                        </span>
                        <div className="text-right">
                          <p className="text-xl font-bold text-blue-600">
                            {totalAmount.toLocaleString()} Р
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={processing || !validatePhone(customerPhone)}
                    className={`w-full mt-6 py-3 rounded-lg font-semibold transition-colors ${
                      processing || !validatePhone(customerPhone)
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {processing ? (
                      <span className="flex items-center justify-center">
                        <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                        Обработка...
                      </span>
                    ) : (
                      "Оформить"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
