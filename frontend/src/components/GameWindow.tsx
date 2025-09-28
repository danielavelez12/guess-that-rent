import React, { useState, useRef, useEffect } from 'react';
import './GameWindow.css';
import ImageCarousel from './ImageCarousel';
import PropertyDetailsModal from './PropertyDetailsModal';
import LocationModal from './LocationModal';
import GuessSlider from './GuessSlider';
import useDeviceDetection from '../hooks/useDeviceDetection';

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

interface GameWindowProps {
  photos: Photo[];
  propertyName: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  details: string;
  currentProperty: number;
  totalProperties: number;
  onGuessSubmit: (guess: number) => void;
  disabled?: boolean;
}

const GameWindow: React.FC<GameWindowProps> = ({
  photos,
  propertyName,
  address,
  bedrooms,
  bathrooms,
  details,
  currentProperty,
  totalProperties,
  onGuessSubmit,
  disabled = false,
}) => {
  const device = useDeviceDetection();
  const [guess, setGuess] = useState('');

  // Mobile modal states
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isGuessSliderOpen, setIsGuessSliderOpen] = useState(false);

  // Desktop dragging states (keep for desktop compatibility)
  const [mapPosition, setMapPosition] = useState({ x: -1, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numGuess = parseInt(guess);
    if (isNaN(numGuess) || numGuess <= 0) {
      return;
    }
    onGuessSubmit(numGuess);
    setGuess('');
  };

  const handleMobileGuessSubmit = (guessValue: number) => {
    onGuessSubmit(guessValue);
    setIsGuessSliderOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      handleSubmit(e as any);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const containerRect = mapRef.current.parentElement?.getBoundingClientRect();

      if (containerRect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        setIsDragging(true);
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && mapRef.current) {
      const containerRect = mapRef.current.parentElement?.getBoundingClientRect();
      if (containerRect) {
        const newX = e.clientX - containerRect.left - dragOffset.x;
        const newY = e.clientY - containerRect.top - dragOffset.y;

        // Keep map within bounds - updated for smaller size
        const maxX = containerRect.width - 350; // smaller map width
        const maxY = containerRect.height - 280; // smaller map height

        setMapPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Mobile Layout
  if (device.isMobile) {
    return (
      <div className="game-window mobile-layout">
        <div className="mobile-image-container">
          <ImageCarousel photos={photos} className="mobile-carousel" />

          {/* Mobile Overlay HUD */}
          <div className="mobile-overlay-hud">
            <div className="hud-info">
              <span className="hud-bedrooms">{bedrooms} BR</span>
              <span className="hud-bathrooms">{bathrooms} BA</span>
            </div>
            <div className="property-counter">
              {currentProperty}/{totalProperties}
            </div>
          </div>
        </div>

        {/* Mobile Control Buttons */}
        <div className="mobile-controls">
          <button
            className="control-btn property-btn"
            onClick={() => setIsPropertyModalOpen(true)}
            title="Property Intel"
          >
            📋
          </button>
          <button
            className="control-btn location-btn"
            onClick={() => setIsLocationModalOpen(true)}
            title="Location Data"
          >
            📍
          </button>
        </div>

        {/* Mobile Guess Button */}
        <div className="mobile-guess-button">
          <button
            className="guess-btn"
            onClick={() => setIsGuessSliderOpen(true)}
            disabled={disabled}
          >
            💰 GUESS RENT
          </button>
        </div>

        {/* Mobile Modals */}
        <PropertyDetailsModal
          isOpen={isPropertyModalOpen}
          onClose={() => setIsPropertyModalOpen(false)}
          details={details}
          bedrooms={bedrooms}
          bathrooms={bathrooms}
          propertyName={propertyName}
        />

        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          address={address}
        />

        <GuessSlider
          isOpen={isGuessSliderOpen}
          onClose={() => setIsGuessSliderOpen(false)}
          onGuessSubmit={handleMobileGuessSubmit}
          disabled={disabled}
        />
      </div>
    );
  }

  // Desktop Layout (keep existing)
  return (
    <div className="game-window desktop-layout fullscreen">
      <div className="window-frame">
        <div className="window-content">
          {/* Property Images View */}
          <div className="image-viewport">
            <div className="image-container">
              <ImageCarousel photos={photos} className="game-carousel" />
              <div className="image-overlay">
                <div className="overlay-hud">
                  <div className="hud-item">
                    <span className="hud-label">BEDROOMS:</span>
                    <span className="hud-value">{bedrooms}</span>
                  </div>
                  <div className="hud-item">
                    <span className="hud-label">BATHROOMS:</span>
                    <span className="hud-value">{bathrooms}</span>
                  </div>
                </div>
              </div>

              {/* Property Details Panel */}
              {details && (
                <div className="property-details-panel">
                  <div className="details-header">
                    <span className="details-title">PROPERTY INTEL</span>
                  </div>
                  <div className="details-content">
                    <p className="details-text">{details}</p>
                  </div>
                </div>
              )}

              {/* Floating Map Viewbox - Always Open */}
              <div
                ref={mapRef}
                className={`floating-map-container ${isDragging ? 'dragging' : ''}`}
                style={{
                  left: mapPosition.x === -1 ? 'auto' : `${mapPosition.x}px`,
                  right: mapPosition.x === -1 ? '20px' : 'auto',
                  top: `${mapPosition.y}px`,
                  bottom: 'auto',
                }}
              >
                <div className="floating-map-header" onMouseDown={handleMouseDown}>
                  <span className="floating-map-title">LOCATION DATA</span>
                  <div className="floating-map-controls">
                    <span className="drag-handle">⋮⋮</span>
                  </div>
                </div>
                <div className="floating-map-content">
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                      address,
                    )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Map of ${address}`}
                    className="floating-map-iframe"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="control-panel">
            <form onSubmit={handleSubmit} className="estimation-form">
              <div className="input-group">
                <label className="input-label">MONTHLY RENT ESTIMATE:</label>
                <div className="input-wrapper">
                  <span className="currency-symbol">$</span>
                  <input
                    type="number"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter amount..."
                    min="1"
                    disabled={disabled}
                    className="rent-estimation-input"
                  />
                  <button type="submit" disabled={disabled || !guess} className="submit-btn">
                    SUBMIT ANALYSIS
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameWindow;
