import React, { useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import axios from "../utils/axios";

interface ReviewFormProps {
  productId: string;
  orderId: string;
  onSuccess: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  orderId,
  onSuccess,
}) => {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      setError("Пожалуйста, оставьте свой комментарий");
      return;
    }

    if (comment.trim().length < 10) {
      setError("Комментарий должен содержать не менее 10 символов.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/reviews/create", {
        productId,
        orderId,
        rating,
        comment: comment.trim(),
      });

      console.log("Review created:", response.data);
      setRating(5);
      setComment("");
      onSuccess();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      if (error.response?.status === 401) {
        setError(
          "Для того чтобы оставить отзыв, пожалуйста, войдите в систему"
        );
      } else if (error.response?.status === 400) {
        setError(
          error.response.data.message || "Произошла ошибка при отправке отзыва"
        );
      } else {
        setError("Не удалось отправить отзыв. Пожалуйста, попробуйте позже");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Обзор продукта</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Уровень удовлетворенности
        </label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              {star <= (hoveredRating || rating) ? (
                <StarIcon className="h-8 w-8 text-yellow-400" />
              ) : (
                <StarOutlineIcon className="h-8 w-8 text-gray-300" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Коментарий
          <span className="text-red-500 ml-1">*</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            setError("");
          }}
          rows={4}
          className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            error ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
          disabled={loading}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">{comment.length}/500</span>
        </div>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={loading || comment.trim().length < 10}
        className={`w-full py-3 px-4 rounded-md font-medium transition-all duration-200 ${
          loading || comment.trim().length < 10
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Отправка отзыва...
          </span>
        ) : (
          "Оставить отзыв"
        )}
      </button>
    </form>
  );
};

export default ReviewForm;
