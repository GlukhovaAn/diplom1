import React, { useEffect, useMemo, useState } from "react";
import { useImagePreloader } from "../../../hooks/useImagePreloader";
import ImageWithFallback from "../../../components/ImageWithFallback";
import { ArrowRightIcon, ChevronRightIcon } from "lucide-react";

export const HeroBanner: React.FC = React.memo(() => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { preloadImages } = useImagePreloader();

  const slides = useMemo(
    () => [
      {
        id: 1,
        image: `${import.meta.env.VITE_APP_API_URL}/uploads/home-slider-1.jpeg`,
        title: "Летняя коллекция 2026",
        subtitle: "Яркий летний стиль",
        description:
          "Откройте для себя новую коллекцию, включающую более 500 уникальных моделей",
        cta: "Подробнее",
        badge: "НОВОЕ",
        discount: "-50%",
        gradient: "from-purple-600 to-pink-600",
      },
      {
        id: 2,
        image: `${import.meta.env.VITE_APP_API_URL}/uploads/home-slider-2.jpg`,
        title: "Распродажа выходного дня",
        subtitle: "Шокирующие скидки",
        description: "Скидки до 70% для VIP-членов",
        cta: "Купить сейчас",
        badge: "LIMITED",
        discount: "-70%",
        gradient: "from-orange-600 to-red-600",
      },
      {
        id: 3,
        image: `${import.meta.env.VITE_APP_API_URL}/uploads/home-slider-3.jpg`,
        title: "Премиум модели",
        subtitle: "Классика премиум-класса",
        description: "Эксклюзивные модели от ведущих дизайнеров",
        cta: "Посмотреть подробности",
        badge: "EXCLUSIVE",
        discount: "VIP",
        gradient: "from-blue-600 to-cyan-600",
      },
    ],
    []
  );

  useEffect(() => {
    const urls = slides.map((slide) => slide.image);
    preloadImages(urls, { priority: "high" });
  }, [slides, preloadImages]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <div className="relative h-[500px] lg:h-[600px] rounded-3xl overflow-hidden mb-16 group">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-1000 ${
            index === currentSlide
              ? "opacity-100 scale-100"
              : "opacity-0 scale-105"
          }`}
        >
          <div className="relative h-full w-full">
            <ImageWithFallback
              src={slide.image}
              alt={slide.title}
              className="w-full h-full transform transition-transform duration-[10s] ease-out"
              style={{
                transform: index === currentSlide ? "scale(1.1)" : "scale(1)",
              }}
              priority="high"
              loading="eager"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-6 lg:px-12">
              <div
                className={`max-w-2xl transform transition-all duration-1000 delay-300 ${
                  index === currentSlide
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-10 opacity-0"
                }`}
              >
                <div className="inline-flex items-center space-x-2 mb-6">
                  <span
                    className={`bg-gradient-to-r ${slide.gradient} text-white text-xs font-bold px-4 py-2 rounded-full animate-pulse`}
                  >
                    {slide.badge}
                  </span>
                  {slide.discount !== "VIP" && (
                    <span className="bg-yellow-500 text-black text-sm font-bold px-4 py-2 rounded-full">
                      {slide.discount}
                    </span>
                  )}
                </div>

                <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                  {slide.title}
                </h1>

                <p className="text-xl lg:text-2xl text-gray-200 mb-4">
                  {slide.subtitle}
                </p>

                <p className="text-lg text-gray-300 mb-8">
                  {slide.description}
                </p>

                <div className="flex flex-wrap gap-4">
                  <button
                    className={`group/btn bg-gradient-to-r ${slide.gradient} text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center space-x-2`}
                  >
                    <span>{slide.cta}</span>
                    <ArrowRightIcon className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>

                  <button className="bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/30 transition-all duration-300 border border-white/30">
                    Больше
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 ${
              index === currentSlide
                ? "w-12 h-3 bg-white rounded-full"
                : "w-3 h-3 bg-white/50 rounded-full hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      <button
        onClick={() =>
          goToSlide((currentSlide - 1 + slides.length) % slides.length)
        }
        className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronRightIcon className="w-6 h-6 rotate-180" />
      </button>

      <button
        onClick={() => goToSlide((currentSlide + 1) % slides.length)}
        className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronRightIcon className="w-6 h-6" />
      </button>
    </div>
  );
});
