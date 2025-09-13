import React, { useState, useEffect } from 'react';
import './GameWindow.css';
import ImageCarousel from './ImageCarousel';

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
  currentProperty,
  totalProperties,
  onGuessSubmit,
  disabled = false
}) => {
  const [guess, setGuess] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numGuess = parseInt(guess);
    if (isNaN(numGuess) || numGuess <= 0) {
      return;
    }
    onGuessSubmit(numGuess);
    setGuess('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      handleSubmit(e as any);
    }
    if (e.key === 'F11') {
      e.preventDefault();
      setIsFullscreen(!isFullscreen);
    }
  };

  return (
    <div className={`game-window ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="window-frame">
        <div className="window-header">
          <div className="window-title">
            <span className="window-icon">🏠</span>
            PROPERTY ANALYZER v2.0
          </div>
          <div className="window-controls">
            <button 
              className="window-btn minimize"
              title="Toggle Fullscreen (F11)"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? '🗗' : '🗖'}
            </button>
            <div className="window-btn status">●</div>
          </div>
        </div>

        <div className="window-toolbar">
          <div className="toolbar-section">
            <span className="toolbar-label">MISSION:</span>
            <span className="mission-counter">
              {currentProperty}/{totalProperties}
            </span>
          </div>
          <div className="toolbar-section">
            <span className="toolbar-label">STATUS:</span>
            <span className="status-indicator">
              {disabled ? 'ANALYZING...' : 'AWAITING INPUT'}
            </span>
          </div>
        </div>

        <div className="window-content">
          <div className="image-viewport">
            <div className="viewport-header">
              <div className="viewport-title">PROPERTY SURVEILLANCE</div>
              <div className="viewport-coords">
                📍 {address}
              </div>
            </div>
            
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
            </div>
          </div>

          <div className="control-panel">
            <div className="panel-header">
              <div className="panel-title">RENT ESTIMATION TERMINAL</div>
              <div className="panel-subtitle">Enter your price analysis</div>
            </div>
            
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
                  <button 
                    type="submit" 
                    disabled={disabled || !guess}
                    className="submit-btn"
                  >
                    SUBMIT ANALYSIS
                  </button>
                </div>
              </div>
            </form>

            <div className="panel-footer">
              <div className="hint-text">
                💡 Use F11 for fullscreen mode • Press ENTER to submit
              </div>
            </div>
          </div>
        </div>

        <div className="window-statusbar">
          <div className="status-left">
            <span className="status-item">TARGET: {propertyName}</span>
          </div>
          <div className="status-right">
            <span className="status-item">RENT DETECTIVE v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameWindow;
