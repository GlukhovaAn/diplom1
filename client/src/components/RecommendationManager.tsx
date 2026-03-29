import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import RecommendationSection from "./RecommendationSection";

interface RecommendationManagerProps {
  userId?: string;
  productId?: string;
  sections?: Array<{
    type: "mixed" | "collaborative" | "content" | "trending" | "new";
    title: string;
    enabled: boolean;
  }>;
}

const DEFAULT_SECTIONS = [
  { type: "mixed" as const, title: "Предложения для Вас", enabled: true },
  { type: "trending" as const, title: "Популярное", enabled: true },
  { type: "new" as const, title: "Новые поступления", enabled: true },
  {
    type: "collaborative" as const,
    title: "Многим это нравится",
    enabled: false,
  },
  { type: "content" as const, title: "Похожее", enabled: false },
];

const RecommendationManager: React.FC<RecommendationManagerProps> = ({
  userId,
  productId,
  sections = DEFAULT_SECTIONS,
}) => {
  const location = useLocation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const prevLocationRef = useRef(location.pathname);
  const isHomePageRef = useRef(
    location.pathname === "/" || location.pathname === "/home"
  );

  useEffect(() => {
    const isHomePage =
      location.pathname === "/" || location.pathname === "/home";
    const wasHomePage = isHomePageRef.current;

    if (prevLocationRef.current !== location.pathname) {
      if (!isHomePage || (wasHomePage && !isHomePage)) {
        setRefreshTrigger((prev) => prev + 1);
      }
    }

    prevLocationRef.current = location.pathname;
    isHomePageRef.current = isHomePage;
  }, [location.pathname]);

  const trackingTimeoutRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    return () => {
      trackingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-8">
        {sections.map((section) => (
          <RecommendationSection
            key={`${section.type}-${refreshTrigger}`}
            title={section.title}
            type={section.type}
            productId={productId}
            userId={userId}
            refreshTrigger={refreshTrigger}
          />
        ))}
      </div>
    </div>
  );
};

export default RecommendationManager;
