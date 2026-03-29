import React from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";

interface StockBadgeProps {
  quantity: number;
  className?: string;
}

const StockBadge: React.FC<StockBadgeProps> = ({
  quantity,
  className = "",
}) => {
  if (quantity === 0) {
    return (
      <div className={`flex items-center text-red-600 ${className}`}>
        <XCircleIcon className="h-5 w-5 mr-1" />
        <span className="font-medium">Распродано</span>
      </div>
    );
  }

  if (quantity < 5) {
    return (
      <div className={`flex items-center text-orange-600 ${className}`}>
        <ExclamationCircleIcon className="h-5 w-5 mr-1" />
        <span className="font-medium">Осталось {quantity} </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center text-green-600 ${className}`}>
      <CheckCircleIcon className="h-5 w-5 mr-1" />
      <span className="font-medium">В наличии</span>
    </div>
  );
};

export default StockBadge;
