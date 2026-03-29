import React, { useState, useRef, useEffect, type CSSProperties } from "react";
import { useImagePreloader } from "../hooks/useImagePreloader";

interface ImageWithFallbackProps {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  priority?: "high" | "medium" | "low";
  onLoad?: () => void;
  onError?: () => void;
  showSkeleton?: boolean;
  style?: CSSProperties;
  placeholder?: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc,
  alt,
  className = "",
  skeletonClassName = "",
  width,
  height,
  loading = "lazy",
  priority = "medium",
  onLoad,
  onError,
  showSkeleton = true,
  style = {},
  placeholder = "/placeholder.jpg",
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const { isImagePreloaded, preloadImage } = useImagePreloader();

  const finalFallbackSrc = fallbackSrc || placeholder;

  useEffect(() => {
    if (isImagePreloaded(src)) {
      setImageLoaded(true);
    } else if (priority === "high") {
      preloadImage(src, { priority });
    }
  }, [src, isImagePreloaded, preloadImage, priority]);

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    if (currentSrc !== finalFallbackSrc) {
      setCurrentSrc(finalFallbackSrc);
      setImageError(false);
    } else {
      setImageError(true);
      onError?.();
    }
  };

  const imageStyle: CSSProperties = {
    aspectRatio: width && height ? `${width}/${height}` : undefined,
    ...style,
  };

  return (
    <div className={`relative ${className}`}>
      {showSkeleton && !imageLoaded && !imageError && (
        <div
          className={`absolute inset-0 bg-gray-200 animate-pulse ${skeletonClassName}`}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      {imageError && (
        <div
          className={`absolute inset-0 bg-gray-100 flex items-center justify-center ${skeletonClassName}`}
        >
          <div className="text-center text-gray-400">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs">Ошибка загрузки изображения</span>
          </div>
        </div>
      )}

      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        loading={loading}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        decoding="async"
        style={imageStyle}
      />
    </div>
  );
};

export default ImageWithFallback;
