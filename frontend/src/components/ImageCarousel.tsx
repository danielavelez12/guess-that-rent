import React, { useState, useEffect } from 'react';
import './ImageCarousel.css';

interface Photo {
  id: string;
  url: string;
  width: number;
  height: number;
  filename?: string;
  thumbnails?: {
    large?: { url: string; width: number; height: number };
    full?: { url: string; width: number; height: number };
  };
}

interface ImageCarouselProps {
  photos: Photo[];
  className?: string;
  onIndexChange?: (index: number) => void;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ photos, className = '', onIndexChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState<Set<number>>(new Set());
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const minSwipeDistance = 50;

  useEffect(() => {
    setCurrentIndex(0);
    setImageLoadError(new Set());
  }, [photos]);

  useEffect(() => {
    if (onIndexChange) {
      onIndexChange(currentIndex);
    }
  }, [currentIndex, onIndexChange]);

  const validPhotos = photos.filter((photo) => photo && photo.url);
  const hasPhotos = validPhotos.length > 0;

  const getImageUrl = (photo: Photo): string => {
    // Prefer full resolution, fallback to large, then original
    if (photo.thumbnails?.full?.url) {
      return photo.thumbnails.full.url;
    }
    if (photo.thumbnails?.large?.url) {
      return photo.thumbnails.large.url;
    }
    return photo.url;
  };

  const getPlaceholderUrl = (width: number = 800, height: number = 400): string => {
    return `https://via.placeholder.com/${width}x${height}/e0e0e0/999999?text=Image+Not+Available`;
  };

  const handlePrevious = () => {
    if (hasPhotos) {
      setCurrentIndex((prev) => (prev === 0 ? validPhotos.length - 1 : prev - 1));
    }
  };

  const handleNext = () => {
    if (hasPhotos) {
      setCurrentIndex((prev) => (prev === validPhotos.length - 1 ? 0 : prev + 1));
    }
  };

  const handleImageError = (index: number) => {
    setImageLoadError((prev) => new Set(prev).add(index));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(false);
    // Prevent scrolling during swipe
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);

    // Determine if this is a significant drag
    const distance = Math.abs(touchStart - currentTouch);
    if (distance > 10) {
      setIsDragging(true);
      // Prevent page scrolling during significant drag
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      // Reset touch action
      setIsDragging(false);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && validPhotos.length > 1) {
      handleNext();
    } else if (isRightSwipe && validPhotos.length > 1) {
      handlePrevious();
    }

    // Reset state
    setIsDragging(false);
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!hasPhotos) {
    return (
      <div className={`image-carousel no-photos ${className}`}>
        <div className="carousel-container">
          <div className="image-container">
            <img src={getPlaceholderUrl()} alt="No photos available" className="carousel-image" />
            <div className="no-photos-overlay">
              <span>No Photos Available</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentPhoto = validPhotos[currentIndex];
  const hasError = imageLoadError.has(currentIndex);

  return (
    <div className={`image-carousel ${className}`}>
      <div
        className="carousel-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrows */}
        {validPhotos.length > 1 && (
          <>
            <button
              className="carousel-arrow carousel-arrow-left"
              onClick={handlePrevious}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              className="carousel-arrow carousel-arrow-right"
              onClick={handleNext}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}

        {/* Image Container */}
        <div className="image-container">
          {hasError ? (
            <>
              <img
                src={getPlaceholderUrl(currentPhoto.width, currentPhoto.height)}
                alt="Failed to load image"
                className="carousel-image"
              />
              <div className="image-error-overlay">
                <span>Image failed to load</span>
              </div>
            </>
          ) : (
            <img
              src={getImageUrl(currentPhoto)}
              alt={currentPhoto.filename || `Photo ${currentIndex + 1}`}
              className="carousel-image"
              onError={() => handleImageError(currentIndex)}
              loading="lazy"
            />
          )}
        </div>

        {/* Image Counter */}
        {validPhotos.length > 1 && (
          <div className="image-counter">
            {currentIndex + 1} / {validPhotos.length}
          </div>
        )}

        {/* Mobile Swipe Indicator */}
        {validPhotos.length > 1 && (
          <div className="swipe-indicator">
            {validPhotos.map((_, index) => (
              <div
                key={index}
                className={`swipe-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCarousel;
