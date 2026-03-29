import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../../utils/axios";
import ReviewForm from "../../components/ReviewForm";
import { useAuth } from "../../context/AuthContext";
import {
  ShoppingBagIcon,
  XMarkIcon,
  QrCodeIcon,
  ClockIcon,
  CheckCircleIcon,
  BanknotesIcon,
  SparklesIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline";
import OptimizedImage from "../../components/OptimizedImage";

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<{
    productId: string;
    orderId: string;
  } | null>(null);
  const [cancelingOrder, setCancelingOrder] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<{
    orderId: string;
    orderNumber: string;
  } | null>(null);
  const [showQRModal, setShowQRModal] = useState<any>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const interval = setInterval(
        () => {
          fetchOrders();
        },
        5 * 60 * 1000
      );

      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get("/orders/my-orders");
      console.log("Orders fetched:", data);
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewQR = async (orderId: string) => {
    setLoadingQR(true);
    try {
      const { data } = await axios.get(`/orders/${orderId}/qr-code`);
      setShowQRModal(data);
    } catch (error: any) {
      console.error("Error fetching QR code:", error);
      if (error.response?.data?.expired) {
        alert("Срок оплаты заказа истёк.");
      } else {
        alert(error.response?.data?.message || "Не удалось загрузить QR-код.");
      }
    } finally {
      setLoadingQR(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancelingOrder(orderId);
    try {
      await axios.put(`/orders/${orderId}/cancel`);

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, orderStatus: "cancelled" } : order
        )
      );

      setShowCancelModal(null);
      alert("Заказ успешно отменен!");
    } catch (error: any) {
      console.error("Error canceling order:", error);
      alert(
        error.response?.data?.message || "Произошла ошибка при отмене заказа."
      );
    } finally {
      setCancelingOrder(null);
    }
  };

  const canCancelOrder = (orderStatus: string) => {
    return orderStatus === "pending" || orderStatus === "processing";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "processing":
        return "text-blue-600 bg-blue-50";
      case "shipped":
        return "text-purple-600 bg-purple-50";
      case "delivered":
        return "text-green-600 bg-green-50";
      case "cancelled":
        return "text-red-600 bg-red-50";
      case "expired":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Новый";
      case "processing":
        return "В работе";
      case "shipped":
        return "Доставка";
      case "delivered":
        return "Завершен";
      case "cancelled":
        return "Отменено";
      case "expired":
        return "Срок оплаты истёк";
      default:
        return status;
    }
  };

  const formatTimeRemaining = (deadline: any) => {
    if (!deadline) return null;

    if (deadline.isExpired) {
      return <span className="text-red-600">Срок оплаты истёк</span>;
    }

    const { hoursRemaining, minutesRemaining } = deadline;

    return (
      <span className="text-blue-600 flex items-center">
        <ClockIcon className="w-4 h-4 mr-1" />
        Осталось {hoursRemaining}ч {minutesRemaining}м
      </span>
    );
  };

  const togglePaymentDetails = (orderId: string) => {
    setExpandedPayment(expandedPayment === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">
          Для просмотра истории заказов, пожалуйста, войдите в систему.
        </p>
        <Link to="/login" className="text-blue-600 hover:underline">
          Войти
        </Link>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Нет заказов.
        </h2>
        <p className="text-gray-500 mb-6">Сделайте заказ прямо сейчас!</p>
        <Link to="/" className="text-blue-600 hover:underline">
          Купить
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Количество заказов ({orders.length})
      </h1>

      <div className="space-y-4">
        {orders.map((order: any) => (
          <div
            key={order._id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Номер заказа:{" "}
                    <span className="font-semibold text-gray-800">
                      #{order._id.slice(-8)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Дата заказа:{" "}
                    {new Date(order.createdAt).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {order.paymentMethod === "BankTransfer" &&
                    order.paymentStatus === "pending" &&
                    order.paymentDeadlineStatus &&
                    !order.paymentDeadlineStatus.isExpired && (
                      <div className="mt-2">
                        {formatTimeRemaining(order.paymentDeadlineStatus)}
                      </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}
                  >
                    {getStatusText(order.orderStatus)}
                  </span>
                  {order.paymentMethod === "BankTransfer" &&
                    order.paymentStatus === "pending" &&
                    order.orderStatus !== "cancelled" &&
                    order.orderStatus !== "expired" && (
                      <button
                        onClick={() => handleViewQR(order._id)}
                        disabled={loadingQR}
                        className="px-3 py-1 text-sm rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors flex items-center"
                      >
                        <QrCodeIcon className="w-4 h-4 mr-1" />
                        Просмотреть QR-код
                      </button>
                    )}

                  {canCancelOrder(order.orderStatus) && (
                    <button
                      onClick={() =>
                        setShowCancelModal({
                          orderId: order._id,
                          orderNumber: order._id.slice(-8),
                        })
                      }
                      disabled={cancelingOrder === order._id}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        cancelingOrder === order._id
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-red-100 text-red-600 hover:bg-red-200"
                      }`}
                    >
                      {cancelingOrder === order._id
                        ? "Отмена..."
                        : "Отменить заказ"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item._id} className="flex items-center space-x-4">
                    <OptimizedImage
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded"
                      width={300}
                      height={300}
                      loading="lazy"
                      placeholder="/placeholder.jpg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {item.product?.name || "Sản phẩm đã xóa"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Размер: {item.size} | Цвет: {item.color} | Количество:{" "}
                        {item.quantity}
                      </p>
                      <div className="mt-1">
                        <p className="text-sm font-semibold text-gray-800">
                          {(item.price * item.quantity).toLocaleString()} Р
                        </p>
                      </div>
                    </div>
                    {order.orderStatus === "delivered" && item.product && (
                      <button
                        onClick={() =>
                          setSelectedReview({
                            productId: item.product._id,
                            orderId: order._id,
                          })
                        }
                        className="text-blue-600 text-sm hover:underline whitespace-nowrap"
                      >
                        Оценить
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={() => togglePaymentDetails(order._id)}
                  className="w-full flex items-center justify-between py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <ReceiptPercentIcon className="w-5 h-5 mr-2" />
                    Платежные данные
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${
                      expandedPayment === order._id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {expandedPayment === order._id && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Стоимость:</span>
                      <span className="font-medium">
                        {order.subtotal.toLocaleString()} Р
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Доставка:</span>
                      <span className="font-medium">
                        {order.shippingFee > 0
                          ? `${order.shippingFee.toLocaleString()} Р`
                          : "Бесплатно"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Способы оплаты:</span>
                      <span className="font-medium flex items-center">
                        {order.paymentMethod === "COD" ? (
                          <>
                            <BanknotesIcon className="w-4 h-4 mr-1" />
                            Оплата при доставке
                          </>
                        ) : (
                          <>
                            <QrCodeIcon className="w-4 h-4 mr-1" />
                            Онлайн
                            {order.paymentStatus === "paid" && (
                              <CheckCircleIcon className="w-4 h-4 ml-2 text-green-600" />
                            )}
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-base pt-2 border-t border-gray-200">
                      <span className="font-semibold text-gray-700">
                        Итого:
                      </span>
                      <span className="text-xl font-bold text-red-600">
                        {order.totalAmount.toLocaleString()} Р
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-1">Адрес доставки:</p>
                  <p className="text-sm">
                    {order.shippingAddress.recipientName} -{" "}
                    {order.shippingAddress.recipientPhone}
                  </p>
                  <p className="text-sm">
                    {order.shippingAddress.street},{" "}
                    {order.shippingAddress.state}, {order.shippingAddress.city}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Информация об оплате</h3>
              <button
                onClick={() => setShowQRModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <img
                      src={showQRModal.qrUrl}
                      alt="QR Code"
                      className="w-60 h-60"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowQRModal(null)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Подтверждение отмены заказа
              </h3>
              <button
                onClick={() => setShowCancelModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Вы уверены, что хотите отменить{" "}
                <span className="font-semibold">
                  #{showCancelModal.orderNumber}
                </span>{" "}
                заказ?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  После отмены заказа его восстановление невозможно.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(null)}
                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Передумал
              </button>
              <button
                onClick={() => handleCancelOrder(showCancelModal.orderId)}
                disabled={cancelingOrder === showCancelModal.orderId}
                className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                  cancelingOrder === showCancelModal.orderId
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {cancelingOrder === showCancelModal.orderId
                  ? "Отмена..."
                  : "Отменить заказ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <ReviewForm
              productId={selectedReview.productId}
              orderId={selectedReview.orderId}
              onSuccess={() => {
                setSelectedReview(null);
                fetchOrders();
              }}
            />
            <button
              onClick={() => setSelectedReview(null)}
              className="mt-4 w-full text-gray-600 hover:text-gray-800"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
