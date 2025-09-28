import React, { useState, useEffect } from 'react';
import './GuessSlider.css';

interface GuessSliderProps {
  isOpen: boolean;
  onClose: () => void;
  onGuessSubmit: (guess: number) => void;
  disabled?: boolean;
}

const GuessSlider: React.FC<GuessSliderProps> = ({
  isOpen,
  onClose,
  onGuessSubmit,
  disabled = false
}) => {
  const [guess, setGuess] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Reset guess when opening
      setGuess('');
    } else if (isAnimating) {
      // Keep animating state during slide-down transition
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isAnimating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numGuess = parseInt(guess);
    if (isNaN(numGuess) || numGuess <= 0) {
      return;
    }
    onGuessSubmit(numGuess);
    setGuess('');
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatCurrency = (value: string) => {
    // Remove non-digits
    const numericValue = value.replace(/\D/g, '');
    // Add commas for thousands
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
    setGuess(value);
  };

  if (!isOpen && !isAnimating) return null;
  
  // Always render when animating or open to allow CSS transitions

  return (
    <div 
      className="guess-slider-backdrop"
      onClick={handleBackdropClick}
    >
      <div className={`guess-slider ${isOpen ? 'slide-up' : 'slide-down'}`}>
        <div className="slider-handle" />
        
        <div className="slider-header">
          <h3 className="slider-title">MONTHLY RENT ESTIMATE</h3>
          <button className="slider-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="slider-content">
          <form onSubmit={handleSubmit} className="guess-form">
            <div className="guess-input-container">
              <div className="currency-wrapper">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatCurrency(guess)}
                  onChange={handleInputChange}
                  placeholder="Enter monthly rent..."
                  disabled={disabled}
                  className="guess-input"
                  autoFocus
                />
              </div>
              
              <div className="guess-actions">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="cancel-btn"
                >
                  CANCEL
                </button>
                <button 
                  type="submit" 
                  disabled={disabled || !guess}
                  className="submit-guess-btn"
                >
                  SUBMIT GUESS
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GuessSlider;